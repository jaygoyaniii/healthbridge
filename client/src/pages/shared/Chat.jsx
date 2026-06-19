import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send, Paperclip, MoreVertical, Search, ArrowLeft,
  MessageSquare, Calendar, User, FileText, Activity,
  Check, CheckCheck, Loader2, Download, Image as ImageIcon, X, File, ShieldCheck, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import useSocketStore from '../../store/useSocketStore';
import chatService from '../../services/chatService';
import adminService from '../../services/adminService';
import { timeAgo, formatSlotTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import Avatar from '../../components/common/Avatar';

const Chat = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected, fetchUnreadChatCount } = useSocketStore();

  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const basePath = `/${user.role}/chat`;
  const isDoctor = user.role === 'doctor';
  const isAdmin = user.role === 'admin';

  // Fetch initial conversations list
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      let convs = res.data.conversations || [];

      if (user.role === 'admin') {
        const [doctorsRes, patientsRes] = await Promise.all([
          adminService.getAllDoctors(),
          adminService.getAllPatients()
        ]);

        const existingUserIds = new Set(
          convs.flatMap(c => c.participants.map(p => p._id.toString()))
        );

        const addUsersAsDummyConvs = (usersList, defaultRole) => {
          usersList.forEach(u => {
            const rawUser = u.userId || u;
            if (rawUser && !existingUserIds.has(rawUser._id?.toString())) {
              rawUser.role = rawUser.role || defaultRole;
              convs.push({
                _id: `dummy_${rawUser._id}`,
                isDummy: true,
                participants: [user, rawUser],
                lastActivity: rawUser.createdAt || u.createdAt || new Date(0),
                unread: 0,
              });
            }
          });
        };

        addUsersAsDummyConvs(doctorsRes.data.doctors || [], 'doctor');
        addUsersAsDummyConvs(patientsRes.data.patients || [], 'patient');

        convs.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      }

      setConversations(convs);
      setFilteredConversations(convs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (conv) => {
    if (conv.isDummy) {
      try {
        const otherId = getOtherParticipant(conv)._id;
        const res = await chatService.createConversation(otherId);
        // Replace the dummy with the real one in local state
        setConversations(prev => prev.map(c => c._id === conv._id ? res.data.conversation : c));
        navigate(`${basePath}/${res.data.conversation._id}`);
      } catch (e) {
        toast.error('Failed to create conversation');
      }
    } else {
      navigate(`${basePath}/${conv._id}`);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search and Filter
  useEffect(() => {
    let result = conversations;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(c => {
        const other = getOtherParticipant(c);
        return other?.name?.toLowerCase().includes(lower) ||
          other?.email?.toLowerCase().includes(lower) ||
          other?.role?.toLowerCase().includes(lower);
      });
    }

    if (filterRole !== 'all') {
      if (filterRole === 'unread') {
        result = result.filter(c => c.unread > 0);
      } else {
        result = result.filter(c => getOtherParticipant(c)?.role === filterRole);
      }
    }

    setFilteredConversations(result);
  }, [searchQuery, filterRole, conversations]);

  // Fetch specific conversation messages
  useEffect(() => {
    if (conversationId) {
      if (conversationId.startsWith('dummy_')) {
        const participantId = conversationId.replace('dummy_', '');
        chatService.createConversation(participantId).then(res => {
          navigate(`${basePath}/${res.data.conversation._id}`, { replace: true });
        }).catch(() => {
          toast.error('Failed to initiate conversation');
          navigate(basePath);
        });
        return; // wait for navigation
      }

      chatService.getConversationById(conversationId).then(res => {
        setActiveConv(res.data.conversation);
        setMessages(res.data.messages || []);
        scrollToBottom();

        // Refresh local conversation list unread count
        setConversations(prev => prev.map(c =>
          c._id === conversationId ? { ...c, unread: 0 } : c
        ));

        // Auto-focus input
        setTimeout(() => inputRef.current?.focus(), 100);

        // Refresh global unread count since backend cleared it
        if (fetchUnreadChatCount) {
          fetchUnreadChatCount();
        }
      }).catch(() => {
        toast.error('Conversation not found or unauthorized');
        navigate(basePath);
      });
    } else {
      setActiveConv(null);
      setMessages([]);
    }
  }, [conversationId, navigate, basePath, fetchUnreadChatCount]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();

        // Mark as read if it's not from us
        if (msg.senderId !== user._id) {
          socket.emit('mark_read', { messageId: msg._id, conversationId });
          setConversations(prev => prev.map(c =>
            c._id === conversationId ? { ...c, lastMessage: msg, unread: 0 } : c
          ));
        }
      } else {
        // Update unread count in sidebar for other conversations
        setConversations(prev => prev.map(c =>
          c._id === msg.conversationId ? { ...c, lastMessage: msg, unread: (c.unread || 0) + 1 } : c
        ));
      }
    };

    const handleReadReceipt = ({ messageId, readAt }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isRead: true, readAt } : m
      ));
    };

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        if (isTyping) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleReadReceipt);
    socket.on('user:typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleReadReceipt);
      socket.off('user:typing', handleTyping);
    };
  }, [socket, conversationId, user._id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !conversationId) return;

    socket.emit('typing_start', conversationId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_end', conversationId);
    }, 2000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !conversationId || !socket) return;

    try {
      socket.emit('send_message', {
        conversationId,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      socket.emit('typing_end', conversationId);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !socket) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size exceeds 5MB limit');
    }

    setUploading(true);
    try {
      const res = await chatService.uploadAttachment(file);
      const attachment = res.data.attachment; // Assuming backend returns standard attachment object

      socket.emit('send_message', {
        conversationId,
        content: `Shared a file: ${file.name}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        attachment
      });

    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearConversation = async () => {
    if (!window.confirm('Are you sure you want to clear this conversation? This will hide all messages from your view.')) {
      return;
    }
    try {
      await chatService.clearConversation(conversationId);
      setMessages([]);
      toast.success('Conversation cleared');
      setShowMenu(false);
    } catch (error) {
      toast.error('Failed to clear conversation');
    }
  };

  const getOtherParticipant = (conv) => {
    return conv?.participants?.find(p => p._id !== user._id) || {};
  };

  const otherUser = getOtherParticipant(activeConv);
  const isOtherTyping = typingUsers.has(otherUser?._id);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-surface shadow-sm relative">

      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full sm:w-80 lg:w-96 flex flex-col border-r border-border bg-surface-primary absolute sm:relative h-full z-10 transition-transform duration-300 ease-in-out",
        conversationId ? "-translate-x-full sm:translate-x-0" : "translate-x-0"
      )}>
        <div className="p-4 border-b border-border bg-surface-primary">
          <h2 className="text-xl font-bold text-heading mb-4">Messages</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              className="w-full bg-surface-secondary border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-heading placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-2 px-2">
              {['all', 'unread', 'doctor', 'patient', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                    filterRole === role
                      ? "bg-brand-primary text-white"
                      : "bg-surface-secondary text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-muted">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-primary mb-2" />
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p>
                {filterRole === 'unread' ? "No unread conversations." :
                  filterRole === 'doctor' ? "No registered doctors available." :
                    filterRole === 'patient' ? "No registered patients available." :
                      searchQuery ? "No users match your search." :
                        "No conversations found."}
              </p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isSelected = conv._id === conversationId;

              return (
                <div
                  key={conv._id}
                  onClick={() => handleConversationClick(conv)}
                  className={cn(
                    "p-4 flex items-center gap-3 cursor-pointer border-b border-border transition-all hover:bg-brand-primary/5",
                    isSelected ? "bg-brand-primary/10 border-l-4 border-l-brand-primary" : "border-l-4 border-l-transparent bg-surface-primary"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={other.avatar?.url || other.avatar}
                      name={other.name}
                      role={other.role}
                      size="lg"
                      className="border-2 border-white shadow-sm shrink-0"
                    />
                    {other.isActive && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-heading truncate">{other.name}</h4>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                        {conv.lastActivity ? timeAgo(conv.lastActivity).replace('about ', '') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={cn(
                        "text-sm truncate pr-2",
                        conv.unread > 0 ? "text-heading font-semibold" : "text-slate-500"
                      )}>
                        {conv.lastMessage?.type === 'image' ? '🖼️ Image' :
                          conv.lastMessage?.type === 'file' ? '📎 Attachment' :
                            conv.lastMessage?.content || "Started a conversation"}
                      </p>
                      {conv.unread > 0 && (
                        <span className="bg-brand-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-sm">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-secondary relative w-full">
        {!conversationId ? (
          <div className="hidden sm:flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-heading font-heading">Secure Messaging</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              End-to-end encrypted communication between patients and doctors. Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-border bg-surface-primary flex items-center justify-between shrink-0 shadow-sm z-10 relative">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(basePath)}
                  className="p-2 sm:hidden -ml-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div
                  className="flex items-center gap-3 cursor-pointer group hover:bg-surface-secondary p-1.5 -ml-1.5 rounded-xl transition-colors"
                  onClick={() => {
                    if (isDoctor) {
                      navigate(`/doctor/patients/${otherUser._id}`);
                    } else if (isAdmin) {
                      if (otherUser.role === 'doctor') navigate(`/admin/doctors`);
                      else navigate(`/admin/patients`);
                    } else if (activeConv?.appointmentId?.doctorId) {
                      navigate(`/patient/find-doctor/${activeConv.appointmentId.doctorId}`);
                    }
                  }}
                  title="View Profile"
                >
                  <div className="relative">
                    <Avatar
                      src={otherUser.avatar?.url || otherUser.avatar}
                      name={otherUser.name}
                      role={otherUser.role || 'patient'}
                      size="md"
                      className="group-hover:ring-2 group-hover:ring-brand-primary/20 transition-all shrink-0"
                    />
                    {otherUser.isActive && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-sm md:text-base leading-tight group-hover:text-brand-primary transition-colors">{otherUser.name}</h3>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      {otherUser.isActive ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Context Actions based on Role */}
                {activeConv?.appointmentId && (
                  <div className="hidden md:flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                    {isDoctor ? (
                      <>
                        <Link to={`/doctor/patients/${otherUser._id}`} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors group relative" title="View Patient Profile">
                          <User className="w-5 h-5" />
                        </Link>
                        <Link to={`/doctor/appointments/${activeConv.appointmentId._id}`} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors group relative" title="View Appointment">
                          <Calendar className="w-5 h-5" />
                        </Link>
                        <Link to={`/doctor/prescriptions/write/${activeConv.appointmentId._id}`} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors group relative" title="Write Prescription">
                          <FileText className="w-5 h-5" />
                        </Link>
                      </>
                    ) : isAdmin ? (
                      <>
                        <Link to={`/admin/appointments`} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors group relative" title="View Appointments">
                          <Calendar className="w-5 h-5" />
                        </Link>
                      </>
                    ) : (
                      <Link to={`/patient/appointments`} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors group relative" title="View Appointments">
                        <Calendar className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                )}

                {!isConnected && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full animate-pulse">Reconnecting...</span>}

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-lg py-1 z-50 overflow-hidden animate-fade-in">
                      <button
                        onClick={handleClearConversation}
                        className="w-full text-left px-4 py-2.5 text-sm text-status-error hover:bg-status-error/10 flex items-center gap-2 transition-colors font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">

              {/* Appointment Context Banner */}
              {activeConv?.appointmentId && (
                <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 flex flex-col items-center justify-center text-sm max-w-md mx-auto mb-8 shadow-sm">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm mb-2">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-brand-primary mb-1 text-center">Consultation Thread</p>
                  <p className="text-slate-500 text-center">
                    Regarding appointment on {new Date(activeConv.appointmentId.date).toLocaleDateString()} at {formatSlotTime(activeConv.appointmentId.slotTime)}
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user._id;
                const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                return (
                  <div key={msg._id} className={cn("flex gap-3 max-w-[85%] md:max-w-[75%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                    {showAvatar ? (
                      <Avatar
                        src={isMe ? (user.avatar?.url || user.avatar) : (otherUser.avatar?.url || otherUser.avatar)}
                        name={isMe ? user.name : otherUser.name}
                        role={isMe ? user.role : (otherUser.role || 'patient')}
                        size="sm"
                        className="shrink-0 mt-auto mb-1 border border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-8 shrink-0" />
                    )}

                    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl shadow-sm text-[15px] relative group leading-relaxed max-w-full",
                        isMe ? "bg-brand-primary text-white rounded-br-sm" : "bg-white border border-border text-heading rounded-bl-sm",
                        msg.type === 'image' && "p-2 bg-transparent border-none shadow-none"
                      )}>

                        {/* Rendering different message types */}
                        {msg.type === 'image' ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={msg.attachment?.url} alt="Shared Image" className="max-w-xs md:max-w-sm rounded-xl object-cover hover:opacity-95 transition-opacity cursor-pointer" />
                          </div>
                        ) : msg.type === 'file' ? (
                          <div className={cn("flex items-center gap-3 p-2 rounded-xl border border-transparent", isMe ? "bg-white/10" : "bg-brand-primary/5 border-brand-primary/10")}>
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isMe ? "bg-white/20" : "bg-brand-primary/10 text-brand-primary")}>
                              <File className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className={cn("font-medium text-sm truncate", isMe ? "text-white" : "text-heading")}>{msg.attachment?.name || 'Document'}</p>
                              <p className={cn("text-[10px]", isMe ? "text-white/80" : "text-slate-500")}>{Math.round((msg.attachment?.size || 0) / 1024)} KB</p>
                            </div>
                            <a href={msg.attachment?.url} target="_blank" rel="noopener noreferrer" className={cn("p-2 rounded-full transition-colors shrink-0", isMe ? "hover:bg-white/20 text-white" : "hover:bg-brand-primary/10 text-brand-primary")}>
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ) : (
                          <p className="break-words">{msg.content}</p>
                        )}

                      </div>

                      {/* Timestamp & Status */}
                      <span className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-brand-primary" /> : <Check className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isOtherTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <Avatar
                    src={otherUser.avatar?.url || otherUser.avatar}
                    name={otherUser.name}
                    role={otherUser.role || 'patient'}
                    size="sm"
                    className="shrink-0 mt-auto mb-1 border border-white shadow-sm opacity-50"
                  />
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center h-10">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-border shrink-0 z-10 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleSend} className="flex items-center gap-2 bg-surface-secondary rounded-full border border-border pr-2 pl-2 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:bg-white transition-all shadow-sm">

                {/* File Attachment */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors disabled:opacity-50"
                  title="Attach File"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message securely..."
                  className="flex-1 py-3.5 bg-transparent border-none focus:ring-0 text-[15px] text-heading placeholder-slate-400"
                  value={newMessage}
                  onChange={handleTyping}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected || uploading}
                  className="w-11 h-11 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-brand-primary-hover hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-md shrink-0"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
