import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false,
      sparse: true,
      unique: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Validation: exactly 2 participants ─── */
conversationSchema.pre('validate', function (next) {
  if (this.participants && this.participants.length !== 2) {
    this.invalidate('participants', 'A conversation must have exactly 2 participants');
  }
  next();
});

/* ─── Indexes ─── */
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

/* ─── Method: get unread count for a user ─── */
conversationSchema.methods.getUnreadFor = function (userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

/* ─── Method: increment unread for a user ─── */
conversationSchema.methods.incrementUnread = function (userId) {
  const key = userId.toString();
  const current = this.unreadCount.get(key) || 0;
  this.unreadCount.set(key, current + 1);
};

/* ─── Method: reset unread for a user ─── */
conversationSchema.methods.resetUnread = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
