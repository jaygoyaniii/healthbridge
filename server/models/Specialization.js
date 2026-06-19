import mongoose from 'mongoose';

const specializationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    doctorCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

specializationSchema.index({ isActive: 1, sortOrder: 1 });

const Specialization = mongoose.model('Specialization', specializationSchema);
export default Specialization;
