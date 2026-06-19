import ContactInquiry from '../models/ContactInquiry.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const createContactInquiry = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    const inquiry = await ContactInquiry.create({
      fullName,
      email,
      phone,
      subject,
      message,
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    const notifications = admins.map(admin => ({
      userId: admin._id,
      title: 'New Contact Inquiry',
      message: `New inquiry received from ${fullName}: ${subject}`,
      type: 'system',
      priority: 'high',
      action: {
        label: 'View Inquiry',
        url: `/admin/contact-inquiries/${inquiry._id}`,
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Emit socket event to admins
      if (global.io) {
        admins.forEach(admin => {
          global.io.to(`user_${admin._id}`).emit('newNotification', {
            title: 'New Contact Inquiry',
            message: `New inquiry received from ${fullName}`,
            type: 'system'
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully.',
      inquiryId: inquiry._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
