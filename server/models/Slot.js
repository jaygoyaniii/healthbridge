import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    times: [{ type: String }],
    bookedTimes: [{ type: String }],
    lockedTimes: [{ type: String }],
  },
  { timestamps: true }
);

/* ─── Compound unique index: one slot document per doctor per date ─── */
slotSchema.index({ doctorId: 1, date: 1 }, { unique: true });

/* ─── Virtual: available times ─── */
slotSchema.virtual('availableTimes').get(function () {
  const booked = new Set(this.bookedTimes || []);
  const locked = new Set(this.lockedTimes || []);
  return (this.times || []).filter((t) => !booked.has(t) && !locked.has(t));
});

slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

const Slot = mongoose.model('Slot', slotSchema);
export default Slot;
