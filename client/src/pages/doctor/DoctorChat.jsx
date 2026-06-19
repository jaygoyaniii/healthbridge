import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
  Send, Paperclip, Image as ImageIcon, FileText,
  MoreVertical, Search, Check, CheckCheck, Clock,
  User, MessageSquare, Filter, Phone, Video,
  Calendar, FileSignature, FilePlus, ChevronRight, Activity, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import chatService from '../../services/chatService';
import { formatTime, formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const DoctorChat = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Socket Connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Connected to chat server'));

    newSocket.on('message:new', (message) => {
      setMessages((prev) => [...prev, message]);

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastActivity: new Date(),
              unreadCount: message.senderId !== user?._id && activeConversation?._id !== conv._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      );

      if (activeConversation && message.conversationId === activeConversation._id && message.senderId !== user?._id) {
        newSocket.emit('mark_read', { messageId: message._id, conversationId: activeConversation._id });
      }
    });

    newSocket.on('user:typing', ({ conversationId, isTyping, userId }) => {
      if (activeConversation && activeConversation._id === conversationId && userId !== user?._id) {
        setOtherTyping(isTyping);
      }
    });

    return () => newSocket.disconnect();
  }, [token, activeConversation, user?._id]);

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data } = await chatService.getConversations();
        setConversations(data.conversations || []);
      } catch (error) {
        toast.error('Could not load chats');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch Messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const { data } = await chatService.getConversationById(activeConversation._id);
        setMessages(data.messages || []);

        setConversations(prev => prev.map(c =>
          c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
        ));

        if (socket) socket.emit('join_conversation', activeConversation._id);
      } catch (error) {
        toast.error('Failed to load messages');
      }
    };

    fetchMessages();
  }, [activeConversation, socket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length) || !activeConversation) return;

    if (socket && newMessage.trim()) {
      socket.emit('send_message', {
        conversationId: activeConversation._id,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      handleTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConversation) return;

    const toastId = toast.loading('Uploading file...');
    try {
      const { data } = await chatService.uploadAttachment(file);

      if (socket) {
        socket.emit('send_message', {
          conversationId: activeConversation._id,
          content: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          attachment: {
            url: data.url,
            publicId: data.publicId,
            name: file.name,
            size: file.size
          }
        });
      }
      toast.success('Sent successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload file', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTyping = (isCurrentlyTyping) => {
    if (!socket || !activeConversation) return;

    if (isCurrentlyTyping && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', activeConversation._id);
    } else if (!isCurrentlyTyping && isTyping) {
      setIsTyping(false);
      socket.emit('typing_end', activeConversation._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_end', activeConversation._id);
      }, 2000);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const otherParticipant = c.participants.find(p => p._id !== user?._id);
      const matchesSearch = !searchQuery || otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || (filterType === 'unread' && c.unreadCount > 0);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filterType, user?._id]);

  // Derive active patient info
  const activePatient = useMemo(() => {
    if (!activeConversation) return null;
    return activeConversation.participants.find(p => p._id !== user?._id) || {};
  }, [activeConversation, user?._id]);

  return (
    <PageTransition className="max-w-[1600px] mx-auto h-[calc(100vh-120px)] min-h-[650px] relative">
      <div className="bg-white rounded-2xl shadow-sm border border-border flex h-full overflow-hidden">

        {/* LEFT SIDEBAR: Conversations List */}
        <div className={`w-full md:w-80 lg:w-[380px] border-r border-border flex flex-col shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-border bg-slate-50/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-heading flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Inbox
              </h2>
              <Badge variant="neutral">{conversations.length} total</Badge>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients, staff..."
                  className="input-base w-full pl-9 h-10 bg-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${filterType === 'unread' ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                >
                  Unread
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Filter className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-bold text-heading">No Conversations</p>
                <p className="text-xs mt-1 max-w-[200px]">Adjust your search or filters to find a patient.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConversations.map((conv) => {
                  const otherUser = conv.participants.find(p => p._id !== user?._id) || {};
                  const isActive = activeConversation?._id === conv._id;
                  const unread = conv.unreadCount > 0;

                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-slate-50 relative ${isActive ? 'bg-primary/5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={otherUser.avatar?.url} name={otherUser.name} role="patient" size="lg" className="border border-slate-200" />
                        {otherUser.isActive && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10"></div>}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={`font-bold truncate text-sm ${unread ? 'text-heading' : 'text-slate-700'}`}>{otherUser.name}</h4>
                          {conv.lastActivity && (
                            <span className={`text-[10px] whitespace-nowrap ml-2 font-semibold ${unread ? 'text-primary' : 'text-slate-400'}`}>
                              {formatTime(conv.lastActivity)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={`text-xs truncate ${unread ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                            {conv.lastMessage?.type === 'image' ? '📷 Image attached' :
                              conv.lastMessage?.type === 'document' ? '📄 Document attached' :
                                conv.lastMessage?.content || 'Started a conversation'}
                          </p>
                          {unread && (
                            <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANE: Active Chat */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative z-10 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
            {/* Chat Header */}
            <div className="h-[76px] px-4 md:px-6 border-b border-border bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setActiveConversation(null)}>
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <Avatar src={activePatient.avatar?.url} name={activePatient.name} role="patient" className="w-11 h-11 border border-slate-200 shrink-0" />
                <div>
                  <h3 className="font-black text-heading text-lg leading-tight">{activePatient.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Patient
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="w-10 h-10 p-0 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full lg:hidden" onClick={() => setShowRightSidebar(!showRightSidebar)}>
                  <Activity className="w-5 h-5" />
                </Button>
                <Button variant="ghost" className="w-10 h-10 p-0 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" className="w-10 h-10 p-0 text-slate-400 hover:text-slate-600 rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
              {/* Medical Context Warning Box */}
              <div className="flex justify-center mb-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-xl text-center max-w-md shadow-sm">
                  <span className="block mb-1">🏥 Secure Medical Communication Channel</span>
                  <span className="font-normal opacity-80">All messages and attachments shared here are encrypted and form part of the patient's permanent medical record.</span>
                </div>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?._id;
                const showDateMarker = index === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                return (
                  <div key={msg._id}>
                    {showDateMarker && (
                      <div className="flex justify-center my-6">
                        <span className="text-[10px] font-bold bg-slate-200/80 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-300/50">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group
                        ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}
                      >
                        {msg.type === 'text' && (
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                        )}

                        {msg.type === 'image' && msg.attachment && (
                          <div className="space-y-2">
                            <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="block relative group/img overflow-hidden rounded-lg">
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Search className="w-6 h-6 text-white" />
                              </div>
                              <img src={msg.attachment.url} alt="Medical Attachment" className="w-full h-auto max-h-64 object-cover" />
                            </a>
                            {msg.content && <p className="text-sm font-medium">{msg.content}</p>}
                          </div>
                        )}

                        {msg.type === 'document' && msg.attachment && (
                          <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-primary-dark/20 border-primary-light/30' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} transition-colors group/doc`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                              <FileText className={`w-5 h-5 ${isMe ? 'text-white' : ''}`} />
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-slate-800 group-hover/doc:text-blue-600'} transition-colors`}>{msg.attachment.name}</p>
                              <p className={`text-xs font-medium ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>{(msg.attachment.size / 1024).toFixed(1)} KB • Document</p>
                            </div>
                          </a>
                        )}

                        <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-bold tracking-wide ${isMe ? 'text-blue-100 justify-end' : 'text-slate-400'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : <Check className="w-3.5 h-3.5 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {otherTyping && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)] z-10">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 h-12 p-0 shrink-0 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl border-slate-200 shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Medical Report or File"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-white transition-all shadow-inner">
                  <textarea
                    placeholder="Type medical instruction or message..."
                    className="w-full bg-transparent border-none focus:outline-none resize-none py-2.5 max-h-32 text-[15px] font-medium text-slate-800"
                    rows="1"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 p-0 shrink-0 rounded-xl shadow-md shadow-primary/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Empty State (Desktop) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f8fafc] p-8 text-center relative z-10">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-border flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl"></div>
              <MessageSquare className="w-10 h-10 text-primary" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#f8fafc] flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-heading mb-3">Communication Center</h3>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed">
              Select a patient conversation from the left to access medical history, share prescriptions, and communicate securely.
            </p>
          </div>
        )}

        {/* RIGHT SIDEBAR: Patient Medical Context (Only visible when active and toggled on mobile/desktop) */}
        {activeConversation && showRightSidebar && (
          <div className="hidden lg:flex flex-col w-[340px] border-l border-border bg-white shrink-0 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] relative z-20">
            <div className="p-5 border-b border-border bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-heading">Patient Context</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowRightSidebar(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              {/* Profile Summary */}
              <div className="text-center">
                <Avatar src={activePatient.avatar?.url} name={activePatient.name} role="patient" size="xl" className="w-20 h-20 mx-auto border-2 border-white shadow-md mb-3" />
                <h3 className="font-black text-heading text-lg">{activePatient.name}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Patient ID: #{activePatient._id?.substring(0, 6) || 'UNK'}</p>
              </div>

              {/* Quick Vitals / Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Age</p>
                  <p className="font-bold text-heading">Adult</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Blood</p>
                  <p className="font-bold text-rose-600">N/A</p>
                </div>
              </div>

              {/* Quick Actions Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Medical Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold text-sm border border-blue-100 shadow-sm" onClick={() => navigate('/doctor/prescriptions')}>
                    <FileSignature className="w-4 h-4" /> Issue Prescription
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-sm border border-emerald-100 shadow-sm" onClick={() => navigate('/doctor/patients')}>
                    <FilePlus className="w-4 h-4" /> Add Clinical Note
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-bold text-sm border border-purple-100 shadow-sm" onClick={() => navigate('/doctor/appointments')}>
                    <Calendar className="w-4 h-4" /> Schedule Follow-up
                  </button>
                </div>
              </div>

              {/* Shared Files Stub */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Documents</h4>
                  <button className="text-xs font-bold text-primary hover:underline">View All</button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No documents shared yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Attachments will appear here.</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default DoctorChat;
