import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Send a notification to all admin users.
 * 
 * @param {Object} options 
 * @param {String} options.title
 * @param {String} options.message
 * @param {String} options.type enum: ['appointment', 'message', 'review', 'system', 'reminder', 'approval', 'security']
 * @param {String} options.relatedId (optional) mongoose ObjectId
 * @param {String} options.relatedModel (optional) String
 * @param {String} options.priority enum: ['low', 'medium', 'high']
 */
export const notifyAdmins = async ({ title, message, type = 'system', relatedId, relatedModel, priority = 'low' }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    if (admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      userId: admin._id,
      title,
      message,
      type,
      priority,
      relatedId,
      relatedModel,
      isRead: false,
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
