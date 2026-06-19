import { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Send, Paperclip, Image as ImageIcon, FileText,
  MoreVertical, Search, Check, CheckCheck, Clock,
  User, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import chatService from '../../services/chatService';
import { formatTime, formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const PatientChat = () => {
  const { user, token } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('message:new', (message) => {
      setMessages((prev) => [...prev, message]);

      // Update last message in conversation list
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

      // If active conversation, mark read
      if (activeConversation && message.conversationId === activeConversation._id && message.senderId !== user?._id) {
        newSocket.emit('mark_read', { messageId: message._id, conversationId: activeConversation._id });
      }
    });

    newSocket.on('user:typing', ({ conversationId, isTyping, userId }) => {
      if (activeConversation && activeConversation._id === conversationId && userId !== user?._id) {
        setOtherTyping(isTyping);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, activeConversation, user?._id]);

  // Fetch Conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data } = await chatService.getConversations();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to load conversations:', error);
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

        // Reset unread count locally
        setConversations(prev => prev.map(c =>
          c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
        ));

        // Join socket room
        if (socket) {
          socket.emit('join_conversation', activeConversation._id);
        }
      } catch (error) {
        toast.error('Failed to load messages');
      }
    };

    fetchMessages();
  }, [activeConversation, socket]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length) || !activeConversation) return;

    // Fast optimistic UI response using socket emit
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

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const otherParticipant = c.participants.find(p => p._id !== user?._id);
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageTransition className="max-w-7xl mx-auto h-[calc(100vh-120px)] min-h-[600px]">
      <div className="bg-white rounded-2xl shadow-sm border border-border flex h-full overflow-hidden">

        {/* LEFT SIDEBAR: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border bg-slate-50/50">
            <h2 className="text-xl font-bold text-heading mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="input-base w-full pl-9 h-10 bg-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No conversations found</p>
                <p className="text-sm mt-1">Book an appointment to chat with a doctor.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const doctor = conv.participants.find(p => p._id !== user?._id) || {};
                const isActive = activeConversation?._id === conv._id;
                const unread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-4 border-b border-slate-50 transition-colors flex items-start gap-3 hover:bg-slate-50 ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar src={doctor.avatar?.url} name={doctor.name} role="doctor" size="lg" className="border border-slate-200" />
                      {doctor.isActive && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-10"></div>}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`font-semibold truncate ${unread ? 'text-heading' : 'text-slate-700'}`}>Dr. {doctor.name}</h4>
                        {conv.lastActivity && (
                          <span className={`text-xs whitespace-nowrap ml-2 ${unread ? 'text-primary font-bold' : 'text-slate-400'}`}>
                            {formatTime(conv.lastActivity)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-sm truncate ${unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                          {conv.lastMessage?.type === 'image' ? '📷 Image' :
                            conv.lastMessage?.type === 'document' ? '📄 Document' :
                              conv.lastMessage?.content || 'Started a conversation'}
                        </p>
                        {unread && (
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">

            {/* Chat Header */}
            {(() => {
              const doctor = activeConversation.participants.find(p => p._id !== user?._id) || {};
              return (
                <div className="h-16 px-4 md:px-6 border-b border-border bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Mobile Back Button */}
                    <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setActiveConversation(null)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>

                    <Avatar src={doctor.avatar?.url} name={doctor.name} role="doctor" size="md" className="border border-slate-200 shadow-sm" />
                    <div>
                      <h3 className="font-bold text-heading leading-tight">Dr. {doctor.name}</h3>
                      <p className="text-xs text-emerald-600 font-medium">Available for Consultation</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-10 h-10 p-0 text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></Button>
                </div>
              );
            })()}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?._id;
                const showDateMarker = index === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                return (
                  <div key={msg._id}>
                    {showDateMarker && (
                      <div className="flex justify-center my-6">
                        <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group
                        ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'}`}
                      >
                        {msg.type === 'text' && (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}

                        {msg.type === 'image' && msg.attachment && (
                          <div className="space-y-2">
                            <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                              <img src={msg.attachment.url} alt="Attachment" className="rounded-lg max-w-full h-auto max-h-60 object-cover" />
                            </a>
                            {msg.content && <p className="text-sm">{msg.content}</p>}
                          </div>
                        )}

                        {msg.type === 'document' && msg.attachment && (
                          <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-primary-dark/20 border-primary-light/30' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} transition-colors`}>
                            <FileText className={`w-8 h-8 ${isMe ? 'text-white' : 'text-blue-500'}`} />
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{msg.attachment.name}</p>
                              <p className={`text-xs ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>{(msg.attachment.size / 1024).toFixed(1)} KB • PDF/DOC</p>
                            </div>
                          </a>
                        )}

                        {/* Timestamp & Read Receipt */}
                        <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isMe ? 'text-blue-100 justify-end' : 'text-slate-400'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : <Check className="w-3 h-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {otherTyping && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="w-12 h-12 p-0 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl flex items-center px-4 py-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <textarea
                    placeholder="Type your message..."
                    className="w-full bg-transparent border-none focus:outline-none resize-none py-3 max-h-32 text-sm text-slate-800"
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
                  className="w-12 h-12 p-0 shrink-0 rounded-full shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                >
                  <Send className="w-5 h-5 ml-1" />
                </Button>
              </form>
            </div>

          </div>
        ) : (
          /* Empty State (Desktop) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 p-8 text-center border-l border-border">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-2xl font-bold text-heading mb-2">Your Messages</h3>
            <p className="text-muted max-w-md">
              Select a conversation from the sidebar to view your message history or start a new secure chat with your healthcare provider.
            </p>
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default PatientChat;
