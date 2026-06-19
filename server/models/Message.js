import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['text', 'image', 'file', 'prescription'],
        message: '{VALUE} is not a valid message type',
      },
      default: 'text',
    },
    attachment: {
      url: { type: String },
      publicId: { type: String },
      name: { type: String, trim: true },
      size: { type: Number },
      type: { type: String, trim: true },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* ─── Validation: content required for text messages ─── */
messageSchema.pre('validate', function (next) {
  if (this.type === 'text' && (!this.content || this.content.trim() === '')) {
    this.invalidate('content', 'Content is required for text messages');
  }
  if (['image', 'file', 'prescription'].includes(this.type) && !this.attachment?.url) {
    this.invalidate('attachment', 'Attachment URL is required for file messages');
  }
  next();
});

/* ─── Indexes ─── */
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ conversationId: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
