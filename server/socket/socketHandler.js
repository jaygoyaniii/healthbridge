import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const socketHandler = (io) => {
  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('_id name role');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 User connected: ${userId} (${socket.user.name})`);

    // Join personal user room for targeted notifications
    socket.join(`user:${userId}`);

    // Update last seen status online
    User.findByIdAndUpdate(userId, { isActive: true, lastSeen: new Date() }).catch(console.error);
    io.emit('user:status', { userId, status: 'online' });

    /* ─── Room Management ─── */
    socket.on('join_conversation', async (conversationId) => {
      // Verify user is part of conversation
      try {
        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });
        
        if (conv) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
          
          // Reset unread count when joining active view
          conv.resetUnread(userId);
          await conv.save();

          // Notify all of this user's tabs to update global unread count
          io.to(`user:${userId}`).emit('conversation:read', { conversationId });
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    /* ─── Messaging ─── */
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', attachment } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) return;

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          type,
          attachment,
        });

        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();

        conversation.participants.forEach((p) => {
          if (p.toString() !== userId) {
            conversation.incrementUnread(p);
          }
        });

        await conversation.save();

        // Broadcast to everyone in conversation (including sender)
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send unread counts to others
        conversation.participants.forEach((p) => {
          if (p.toString() !== userId) {
            io.to(`user:${p}`).emit('conversation:update', {
              conversationId,
              lastMessage: message,
              unreadCount: conversation.getUnreadFor(p),
            });
          }
        });
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    /* ─── Typing Indicators ─── */
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_end', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    /* ─── Read Receipts ─── */
    socket.on('mark_read', async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.senderId.toString() !== userId && !message.isRead) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          // Also reset conversation unread count
          const conv = await Conversation.findById(conversationId);
          if (conv) {
            conv.resetUnread(userId);
            await conv.save();
          }

          io.to(`conversation:${conversationId}`).emit('message:read', {
            messageId,
            conversationId,
            readAt: message.readAt,
            readBy: userId,
          });

          // Notify all of this user's tabs to update global unread count
          io.to(`user:${userId}`).emit('conversation:read', { conversationId });
        }
      } catch (error) {
        console.error('Socket mark_read error:', error);
      }
    });

    /* ─── Disconnect ─── */
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${userId}`);
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(console.error);
      io.emit('user:status', { userId, status: 'offline', lastSeen: new Date() });
    });
  });
};
