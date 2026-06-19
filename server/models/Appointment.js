import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    slotTime: {
      type: String,
      required: [true, 'Slot time is required'],
    },
    slotEndTime: {
      type: String,
    },
    type: {
      type: String,
      enum: {
        values: ['in-person', 'video', 'chat'],
        message: '{VALUE} is not a valid consultation type',
      },
      default: 'in-person',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
        message: '{VALUE} is not a valid appointment status',
      },
      default: 'pending',
    },
    fees: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fees cannot be negative'],
    },
    symptoms: {
      type: String,
      trim: true,
      maxlength: [1000, 'Symptoms description cannot exceed 1000 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    meetingLink: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Indexes ─── */
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ createdAt: -1 });

/* ─── Virtual: isPast ─── */
appointmentSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

/* ─── Virtual: isToday ─── */
appointmentSchema.virtual('isToday').get(function () {
  const today = new Date();
  const apptDate = new Date(this.date);
  return (
    apptDate.getFullYear() === today.getFullYear() &&
    apptDate.getMonth() === today.getMonth() &&
    apptDate.getDate() === today.getDate()
  );
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
