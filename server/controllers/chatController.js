import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';

/**
 * POST /api/chat/conversations
 * Create a new conversation between two users
 */
export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }

    if (participantId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId]
      });
    }

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar role lastSeen')
      .lean();

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/chat/conversations
 * Get all conversations for the authenticated user
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'name email avatar role lastSeen')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .lean();

    // Map unread count for current user
    const formatted = conversations.map((conv) => {
      const unread = conv.unreadCount ? (conv.unreadCount[req.user._id.toString()] || 0) : 0;
      return {
        ...conv,
        unread,
      };
    });

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/chat/unread-count
 * Get total unread message count across all active conversations
 */
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    }).select('unreadCount');

    let totalUnread = 0;
    const userIdStr = req.user._id.toString();

    conversations.forEach((conv) => {
      if (conv.unreadCount) {
        totalUnread += (conv.unreadCount.get(userIdStr) || 0);
      }
    });

    res.json({ success: true, count: totalUnread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/chat/conversations/:id
 * Get a specific conversation and its messages
 */
export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar role lastSeen')
      .populate({
        path: 'appointmentId',
        select: 'date slotTime status type doctorId',
      });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Reset unread count for this user
    conversation.resetUnread(req.user._id);
    await conversation.save();

    const { page = 1, limit = 50 } = req.query;
    
    const [messages, total] = await Promise.all([
      Message.find({ 
        conversationId: conversation._id,
        deletedBy: { $ne: req.user._id }
      })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Message.countDocuments({ 
        conversationId: conversation._id,
        deletedBy: { $ne: req.user._id }
      }),
    ]);

    res.json({
      success: true,
      conversation,
      messages: messages.reverse(), // Send chronological order for UI
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/chat/messages
 * Send a message via HTTP (fallback for sockets or for attachments)
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', attachment } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content,
      type,
      attachment,
    });

    // Update conversation lastMessage and activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();

    // Increment unread count for other participants
    conversation.participants.forEach((p) => {
      if (p.toString() !== req.user._id.toString()) {
        conversation.incrementUnread(p);
      }
    });

    await conversation.save();

    // Emit via socket if available
    if (global.io) {
      global.io.to(`conversation:${conversationId}`).emit('message:new', message);
      
      // Notify other participants
      conversation.participants.forEach((p) => {
        if (p.toString() !== req.user._id.toString()) {
          global.io.to(`user:${p}`).emit('conversation:update', {
            conversationId,
            lastMessage: message,
            unreadCount: conversation.getUnreadFor(p),
          });
        }
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/chat/upload
 * Upload an attachment for chat
 */
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Process file upload (Cloudinary logic will go here in Phase 6)
    // For now, return a mock response
    const mockUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
    
    res.json({
      success: true,
      attachment: {
        url: mockUrl,
        publicId: 'sample',
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/chat/messages/:id/read
 * Mark a specific message as read
 */
export const markMessageRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!message.isRead && message.senderId.toString() !== req.user._id.toString()) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      if (global.io) {
        global.io.to(`conversation:${conversation._id}`).emit('message:read', {
          messageId: message._id,
          conversationId: conversation._id,
          readAt: message.readAt,
        });
      }
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/chat/conversations/:id/clear
 * Clear the chat history for the current user
 */
export const clearConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Append the user's ID to deletedBy array for all messages in this conversation
    await Message.updateMany(
      { 
        conversationId: conversation._id,
        deletedBy: { $ne: req.user._id }
      },
      { 
        $addToSet: { deletedBy: req.user._id } 
      }
    );

    res.json({ success: true, message: 'Conversation cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
