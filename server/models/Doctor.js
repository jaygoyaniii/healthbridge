import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialization',
      required: [true, 'Specialization is required'],
    },
    qualifications: [
      {
        degree: { type: String, required: true, trim: true },
        institution: { type: String, required: true, trim: true },
        year: { type: Number, required: true },
      },
    ],
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    fees: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fees cannot be negative'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true,
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    clinicName: {
      type: String,
      trim: true,
    },
    clinicAddress: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    consultationType: [
      {
        type: String,
        enum: {
          values: ['in-person', 'video', 'chat'],
          message: '{VALUE} is not a valid consultation type',
        },
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        timeSlots: [
          {
            startTime: {
              type: String,
              required: true,
              match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
            },
            endTime: {
              type: String,
              required: true,
              match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
            }
          }
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    slotDuration: {
      type: Number,
      default: 30,
      enum: {
        values: [15, 30, 45, 60],
        message: 'Slot duration must be 15, 30, 45, or 60 minutes',
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    documents: [
      {
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
      },
    ],
    exceptionDates: [
      {
        date: { type: Date },
        reason: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Indexes ─── */
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ city: 1 });
doctorSchema.index({ isApproved: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ fees: 1 });

/* ─── Virtual: availableDays ─── */
doctorSchema.virtual('availableDays').get(function () {
  if (!this.availability) return [];
  return this.availability
    .filter((a) => a.isActive)
    .map((a) => a.day);
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
