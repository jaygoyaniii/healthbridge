import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';

/**
 * POST /api/prescriptions
 * Doctor creates a prescription
 */
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, diagnosis, advice, followUpDate, isDraft } = req.body;

    // Verify appointment belongs to this doctor
    const appointment = await Appointment.findById(appointmentId).populate('patientId', 'name');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== req.user.doctorId?.toString() && req.user.role !== 'admin') {
       // Need to fetch Doctor profile to match IDs since req.user is User model
       const Doctor = (await import('../models/Doctor.js')).default;
       const doc = await Doctor.findOne({ userId: req.user._id });
       if (!doc || doc._id.toString() !== appointment.doctorId.toString()) {
         return res.status(403).json({ success: false, message: 'Not authorized' });
       }
    }

    // Check if prescription already exists
    const existing = await Prescription.findOne({ appointmentId });
    if (existing && !existing.isDraft) {
      return res.status(400).json({ success: false, message: 'Prescription already finalized' });
    }

    let prescription;
    if (existing) {
      existing.medicines = medicines;
      existing.diagnosis = diagnosis;
      existing.advice = advice;
      existing.followUpDate = followUpDate;
      existing.isDraft = isDraft || false;
      await existing.save();
      prescription = existing;
    } else {
      prescription = await Prescription.create({
        appointmentId,
        doctorId: req.user._id, // User ID of doctor
        patientId: appointment.patientId._id,
        medicines,
        diagnosis,
        advice,
        followUpDate,
        isDraft: isDraft || false,
      });
      
      // Link to appointment
      appointment.prescription = prescription._id;
      await appointment.save();
    }

    // Notify patient if finalized
    if (!isDraft) {
      await Notification.create({
        userId: appointment.patientId._id,
        title: 'New Prescription',
        message: `Dr. ${req.user.name} has added a prescription for your appointment on ${new Date(appointment.date).toLocaleDateString()}`,
        type: 'system',
        relatedId: prescription._id,
        relatedModel: 'Prescription',
        action: { label: 'View', url: `/patient/prescriptions/${prescription._id}` }
      });
    }

    res.status(201).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/prescriptions/:id
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name avatar')
      .populate('patientId', 'name email phone gender dateOfBirth')
      .populate({
        path: 'appointmentId',
        select: 'date type',
      });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Auth check
    if (req.user.role === 'patient' && prescription.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/prescriptions
 */
export const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const filter = { isDeleted: false, isDraft: false };

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
      if (patientId) filter.patientId = patientId;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate('doctorId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Prescription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      prescriptions,
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
