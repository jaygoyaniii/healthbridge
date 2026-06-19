import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    medicines: [
      {
        name: {
          type: String,
          required: [true, 'Medicine name is required'],
          trim: true,
        },
        dosage: {
          type: String,
          required: [true, 'Dosage is required'],
          trim: true,
        },
        frequency: {
          type: String,
          required: [true, 'Frequency is required'],
          trim: true,
        },
        duration: {
          type: String,
          required: [true, 'Duration is required'],
          trim: true,
        },
        instructions: {
          type: String,
          trim: true,
        },
      },
    ],
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
      maxlength: [1000, 'Diagnosis cannot exceed 1000 characters'],
    },
    advice: {
      type: String,
      trim: true,
      maxlength: [2000, 'Advice cannot exceed 2000 characters'],
    },
    followUpDate: {
      type: Date,
    },
    pdfUrl: {
      type: String,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Indexes ─── */
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ createdAt: -1 });

/* ─── Virtual: medicine count ─── */
prescriptionSchema.virtual('medicineCount').get(function () {
  return this.medicines ? this.medicines.length : 0;
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
