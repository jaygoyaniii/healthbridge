import { create } from 'zustand';
import { io } from 'socket.io-client';

/**
 * Global Socket Connection State
 */
const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  unreadChatCount: 0,
  
  setUnreadChatCount: (count) => set({ unreadChatCount: count }),
  incrementUnreadChat: () => set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  decrementUnreadChat: (count = 1) => set((state) => ({ unreadChatCount: Math.max(0, state.unreadChatCount - count) })),

  fetchUnreadChatCount: async () => {
    try {
      // Need to dynamically import chatService to avoid circular dependencies if any
      const { default: chatService } = await import('../services/chatService.js');
      const res = await chatService.getUnreadCount();
      set({ unreadChatCount: res.data.count || 0 });
    } catch (error) {
      console.error('Failed to fetch unread chat count:', error);
    }
  },

  // Initialize Socket.io connection with JWT
  connect: (token) => {
    // Prevent multiple connections
    if (get().socket?.connected) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    newSocket.on('user:status', ({ userId, status }) => {
      set((state) => {
        const updated = new Set(state.onlineUsers);
        if (status === 'online') {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return { onlineUsers: updated };
      });
    });

    set({ socket: newSocket });
  },

  // Disconnect manually (e.g. on logout)
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: new Set() });
    }
  },
}));

export default useSocketStore;
