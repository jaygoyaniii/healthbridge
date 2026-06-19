import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

/**
 * POST /api/reviews
 * Create a new review (Patient only)
 */
export const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    // Check if appointment exists and belongs to patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this appointment' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed appointments' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this appointment' });
    }

    // Create review
    const review = await Review.create({
      patientId: req.user._id,
      doctorId: appointment.doctorId,
      appointmentId,
      rating,
      comment,
    });

    // Mark appointment as reviewed
    appointment.isReviewed = true;
    await appointment.save();

    // Update doctor's average rating and total reviews
    const stats = await Review.aggregate([
      { $match: { doctorId: appointment.doctorId } },
      { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Doctor.findByIdAndUpdate(appointment.doctorId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].numReviews,
      });
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/reviews/:id/reply
 * Doctor replies to a review
 */
export const replyToReview = async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.id).populate('doctorId');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Verify doctor owns this review
    if (review.doctorId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this review' });
    }

    review.reply = { text, repliedAt: new Date() };
    await review.save();

    res.json({ success: true, message: 'Reply added successfully', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/reviews/:id/helpful
 * Mark review as helpful
 */
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete a review (Patient or Admin)
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const doctorId = review.doctorId;
    const appointmentId = review.appointmentId;

    await Review.findByIdAndDelete(req.params.id);

    // Update appointment
    await Appointment.findByIdAndUpdate(appointmentId, { isReviewed: false });

    // Recalculate doctor ratings
    const stats = await Review.aggregate([
      { $match: { doctorId } },
      { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Doctor.findByIdAndUpdate(doctorId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].numReviews,
      });
    } else {
      await Doctor.findByIdAndUpdate(doctorId, { rating: 0, totalReviews: 0 });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
