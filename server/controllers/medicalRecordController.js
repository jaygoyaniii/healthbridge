import MedicalRecord from '../models/MedicalRecord.js';
import Doctor from '../models/Doctor.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * POST /api/medical-records
 * Upload a new medical record
 */
export const uploadRecord = async (req, res) => {
  try {
    const { title, type, description, sharedWith } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    // Determine resource type for Cloudinary
    const resourceType = req.file.mimetype === 'application/pdf' ? 'image' : 'auto';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'healthbridge/records', resourceType);

    // Parse sharedWith array if provided
    let isSharedWith = [];
    if (sharedWith) {
      isSharedWith = Array.isArray(sharedWith) ? sharedWith : [sharedWith];
    }

    const record = await MedicalRecord.create({
      patientId: req.user._id,
      title,
      type: type || 'other',
      description,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        name: req.file.originalname,
        size: req.file.size,
      },
      uploadedBy: req.user._id,
      isSharedWith,
    });

    res.status(201).json({ success: true, message: 'Record uploaded successfully', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/medical-records
 * Get patient's medical records
 */
export const getRecords = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    
    // Base filter: patient accessing their own OR doctor accessing shared records
    const filter = {};
    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile required' });
      // Doctor can see records explicitly shared with them
      filter.isSharedWith = req.user._id;
    }

    if (type) filter.type = type;

    // Check specific patient if admin or doctor viewing specific patient
    if (req.query.patientId && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      filter.patientId = req.query.patientId;
    }

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('uploadedBy', 'name role')
        .populate('isSharedWith', 'name')
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      MedicalRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      records,
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
 * DELETE /api/medical-records/:id
 */
export const deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Only owner or admin can delete
    if (record.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete from Cloudinary
    if (record.file?.publicId) {
      await deleteFromCloudinary(record.file.publicId);
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/medical-records/:id/share
 */
export const updateSharing = async (req, res) => {
  try {
    const { sharedWith } = req.body;
    
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patientId: req.user._id, // Only patient can manage sharing
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    record.isSharedWith = Array.isArray(sharedWith) ? sharedWith : [];
    await record.save();

    res.json({ success: true, message: 'Sharing updated', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
