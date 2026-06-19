import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['lab-report', 'xray', 'scan', 'prescription', 'other'],
      default: 'other',
    },
    description: { type: String, trim: true, maxlength: 1000 },
    file: {
      url: { type: String, required: true },
      publicId: String,
      name: { type: String, trim: true },
      size: Number,
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    isSharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ isSharedWith: 1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
