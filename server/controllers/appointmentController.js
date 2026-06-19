import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Slot from '../models/Slot.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import { lockSlot, unlockSlot, normalizeDate, generateTimeSlots, getDayFromDate } from '../utils/slotHelper.js';
import { notifyAdmins } from '../utils/notifyAdmins.js';

/**
 * POST /api/appointments
 * Book a new appointment (patient)
 */
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slotTime, type, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (!doctor.isApproved || !doctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Doctor is not available' });
    }

    const dateStr = normalizeDate(date);

    // 1. Check if date is blocked (exceptionDates)
    const isException = doctor.exceptionDates?.some((ex) => normalizeDate(ex.date) === dateStr);
    if (isException) {
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date' });
    }

    // 2. Check if slotTime is within doctor's active weekly schedule
    const dayName = getDayFromDate(dateStr);
    const dayAvailability = doctor.availability?.find((a) => a.day === dayName && a.isActive);
    if (!dayAvailability) {
      return res.status(400).json({ success: false, message: 'Doctor is not available on this day of the week' });
    }

    let validSlots = [];
    if (dayAvailability.timeSlots && dayAvailability.timeSlots.length > 0) {
      dayAvailability.timeSlots.forEach(ts => {
        validSlots.push(...generateTimeSlots(ts.startTime, ts.endTime, doctor.slotDuration));
      });
    } else if (dayAvailability.startTime && dayAvailability.endTime) {
      validSlots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime, doctor.slotDuration);
    }

    if (!validSlots.includes(slotTime)) {
      return res.status(400).json({ success: false, message: "The requested slot is outside the doctor's active schedule" });
    }

    // Check for duplicate booking
    const existingAppt = await Appointment.findOne({
      patientId: req.user._id,
      doctorId: doctor._id,
      date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 86400000) },
      slotTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existingAppt) {
      return res.status(400).json({ success: false, message: 'You already have a booking for this slot' });
    }

    // Lock the slot
    const lockResult = await lockSlot(doctor._id.toString(), dateStr, slotTime, req.user._id);
    if (!lockResult.locked) {
      return res.status(409).json({ success: false, message: 'This slot is currently being booked by someone else' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      date: new Date(dateStr),
      slotTime,
      slotEndTime: req.body.slotEndTime || '',
      type: type || 'in-person',
      fees: doctor.fees,
      symptoms,
    });

    // Update slot document
    await Slot.findOneAndUpdate(
      { doctorId: doctor._id, date: new Date(dateStr) },
      { $addToSet: { bookedTimes: slotTime } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Unlock Redis slot (now booked in DB)
    await unlockSlot(doctor._id.toString(), dateStr, slotTime);

    // Create notification for doctor
    await Notification.create({
      userId: doctor.userId,
      title: 'New Appointment',
      message: `${req.user.name} booked an appointment on ${dateStr} at ${slotTime}`,
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      action: { label: 'View', url: `/doctor/appointments/${appointment._id}` },
    });

    // Emit real-time notification
    if (global.io) {
      global.io.to(`user:${doctor.userId}`).emit('notification:new', {
        title: 'New Appointment',
        message: `${req.user.name} booked an appointment`,
      });
    }

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email avatar phone')
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email avatar' }, { path: 'specialization', select: 'name' }] })
      .lean();

    notifyAdmins({
      title: 'New Appointment Booked',
      message: `${req.user.name} booked an appointment with Dr. ${populated.doctorId.userId.name} on ${dateStr} at ${slotTime}.`,
      type: 'appointment',
      priority: 'low',
      relatedId: appointment._id,
      relatedModel: 'Appointment'
    });



    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/appointments
 * Get appointments (role-filtered)
 */
export const getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, dateFrom, dateTo, patientId } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      filter.doctorId = doctor._id;
    }

    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patientId', 'name email avatar phone gender dateOfBirth')
        .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email avatar' }, { path: 'specialization', select: 'name' }] })
        .populate('prescription')
        .sort({ date: -1, slotTime: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      appointments,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/appointments/upcoming
 */
export const getUpcomingAppointments = async (req, res) => {
  try {
    const filter = { date: { $gte: new Date() }, status: { $in: ['pending', 'confirmed'] } };

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email avatar phone')
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'specialization', select: 'name' }] })
      .sort({ date: 1, slotTime: 1 })
      .limit(10)
      .lean();

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/appointments/today
 */
export const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = { date: { $gte: today, $lt: tomorrow } };
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    } else {
      filter.patientId = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email avatar phone gender dateOfBirth')
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'specialization', select: 'name' }] })
      .sort({ slotTime: 1 })
      .lean();

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/appointments/:id
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email avatar phone gender dateOfBirth address healthProfile')
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email avatar phone' }, { path: 'specialization', select: 'name' }] })
      .populate('prescription')
      .lean();

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/confirm
 */
export const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    if (appointment.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot confirm — status is ${appointment.status}` });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    // Auto-create conversation for chat
    const existingConv = await Conversation.findOne({ appointmentId: appointment._id });
    if (!existingConv) {
      const doctor = await Doctor.findById(appointment.doctorId);
      await Conversation.create({
        appointmentId: appointment._id,
        participants: [appointment.patientId, doctor.userId],
      });
    }

    // Notify patient
    await Notification.create({
      userId: appointment.patientId,
      title: 'Appointment Confirmed',
      message: `Your appointment on ${normalizeDate(appointment.date)} at ${appointment.slotTime} has been confirmed.`,
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
    });

    if (global.io) {
      global.io.to(`user:${appointment.patientId}`).emit('notification:new', {
        title: 'Appointment Confirmed',
      });
    }

    res.json({ success: true, message: 'Appointment confirmed', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/complete
 */
export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed appointments can be completed' });
    }

    appointment.status = 'completed';
    appointment.paymentStatus = 'paid';
    await appointment.save();

    // Update doctor stats
    await Doctor.findByIdAndUpdate(appointment.doctorId, { $inc: { totalPatients: 1 } });

    await Notification.create({
      userId: appointment.patientId,
      title: 'Appointment Completed',
      message: 'Your appointment has been completed. You can now leave a review.',
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
    });

    res.json({ success: true, message: 'Appointment completed', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/cancel
 */
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel — status is ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelReason = req.body.reason || 'No reason provided';
    await appointment.save();

    // Free up the slot
    const dateStr = normalizeDate(appointment.date);
    await Slot.findOneAndUpdate(
      { doctorId: appointment.doctorId, date: new Date(dateStr) },
      { $pull: { bookedTimes: appointment.slotTime } }
    );

    // Notify the other party
    const doctor = await Doctor.findById(appointment.doctorId);
    const notifyUserId = req.user._id.toString() === appointment.patientId.toString()
      ? doctor.userId : appointment.patientId;

    await Notification.create({
      userId: notifyUserId,
      title: 'Appointment Cancelled',
      message: `Appointment on ${dateStr} at ${appointment.slotTime} has been cancelled.`,
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
    });

    res.json({ success: true, message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/reschedule
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, slotTime } = req.body;
    const oldAppointment = await Appointment.findById(req.params.id);
    if (!oldAppointment) return res.status(404).json({ success: false, message: 'Not found' });

    // Cancel old appointment
    oldAppointment.status = 'cancelled';
    oldAppointment.cancelReason = 'Rescheduled';
    oldAppointment.cancelledBy = req.user._id;
    await oldAppointment.save();

    // Free old slot
    const oldDateStr = normalizeDate(oldAppointment.date);
    await Slot.findOneAndUpdate(
      { doctorId: oldAppointment.doctorId, date: new Date(oldDateStr) },
      { $pull: { bookedTimes: oldAppointment.slotTime } }
    );

    // Create new appointment
    const newDateStr = normalizeDate(date);
    const newAppointment = await Appointment.create({
      patientId: oldAppointment.patientId,
      doctorId: oldAppointment.doctorId,
      date: new Date(newDateStr),
      slotTime,
      type: oldAppointment.type,
      fees: oldAppointment.fees,
      symptoms: oldAppointment.symptoms,
      rescheduledFrom: oldAppointment._id,
    });

    // Book new slot
    await Slot.findOneAndUpdate(
      { doctorId: oldAppointment.doctorId, date: new Date(newDateStr) },
      { $addToSet: { bookedTimes: slotTime } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Appointment rescheduled', appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/no-show
 */
export const markNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    appointment.status = 'no-show';
    await appointment.save();

    res.json({ success: true, message: 'Marked as no-show', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/appointments/:id/notes
 */
export const updateNotes = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { notes: req.body.notes },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/appointments/:id/receipt
 */
export const getReceipt = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'specialization', select: 'name' }] })
      .lean();

    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, receipt: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
