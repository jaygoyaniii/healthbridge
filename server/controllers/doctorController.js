import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Slot from "../models/Slot.js";
import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import Specialization from "../models/Specialization.js";
import Notification from "../models/Notification.js";
import { notifyAdmins } from "../utils/notifyAdmins.js";
import {
  generateTimeSlots,
  getDayFromDate,
  getLockedSlots,
  normalizeDate,
} from "../utils/slotHelper.js";

/**
 * GET /api/doctors
 * List doctors with pagination and filters
 */
export const getDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      city,
      gender,
      minFees,
      maxFees,
      minRating,
      sort,
      search,
      consultationType,
      availableToday,
    } = req.query;

    const filter = { isApproved: true, isAvailable: true };

    if (specialization && specialization !== "") {
      const specIds = specialization.split(",");
      filter.specialization = { $in: specIds };
    }
    if (city && city !== "") filter.city = { $regex: city, $options: "i" };
    if (consultationType && consultationType !== "")
      filter.consultationType = { $in: consultationType.split(",") };
    if ((minFees && minFees !== "") || (maxFees && maxFees !== "")) {
      filter.fees = {};
      if (minFees && minFees !== "") filter.fees.$gte = Number(minFees);
      if (maxFees && maxFees !== "") filter.fees.$lte = Number(maxFees);
    }
    if (minRating && minRating !== "")
      filter.rating = { $gte: Number(minRating) };

    // Gender filter needs join with User
    let userFilter = {};
    if (gender && gender !== "") userFilter.gender = gender;

    // Search by doctor name
    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
        role: "doctor",
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      // Also search specialization names
      const matchingSpecs = await Specialization.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const specIds = matchingSpecs.map((s) => s._id);

      filter.$or = [
        { userId: { $in: userIds } },
        { specialization: { $in: specIds } },
      ];
    }

    // Sort options
    let sortOption = { rating: -1 };
    if (sort === "fees-low") sortOption = { fees: 1 };
    if (sort === "fees-high") sortOption = { fees: -1 };
    if (sort === "experience") sortOption = { experience: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "reviews") sortOption = { totalReviews: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate("userId", "name email avatar phone gender")
        .populate("specialization", "name icon color")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    // Filter out orphaned doctors without a valid user account
    let filteredDoctors = doctors.filter((d) => d.userId);
    if (gender) {
      filteredDoctors = filteredDoctors.filter(
        (d) => d.userId.gender === gender,
      );
    }

    res.json({
      success: true,
      doctors: filteredDoctors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredDoctors.length,
        pages: Math.ceil(filteredDoctors.length / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/search
 * Search doctors with autocomplete
 */
export const searchDoctors = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const users = await User.find({
      name: { $regex: q, $options: "i" },
      role: "doctor",
    })
      .select("_id name")
      .limit(10)
      .lean();

    const specs = await Specialization.find({
      name: { $regex: q, $options: "i" },
    })
      .select("_id name")
      .limit(5)
      .lean();

    const userIds = users.map((u) => u._id);
    const doctors = await Doctor.find({
      userId: { $in: userIds },
      isApproved: true,
    })
      .populate("userId", "name avatar")
      .populate("specialization", "name")
      .select("userId specialization city fees rating")
      .limit(10)
      .lean();

    res.json({
      success: true,
      results: {
        doctors,
        specializations: specs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/:id
 * Get doctor full details
 */
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("userId", "name email avatar phone gender lastSeen")
      .populate("specialization", "name icon color")
      .lean();

    if (!doctor || !doctor.userId) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/doctors/register
 * Doctor self-register with documents (called from auth register)
 */
export const registerDoctor = async (req, res) => {
  try {
    const existing = await Doctor.findOne({ userId: req.user._id });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor profile already exists" });
    }

    const doctor = await Doctor.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/doctors/:id
 * Doctor updates own profile
 */
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    if (doctor.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this profile",
        });
    }

    const updatableFields = [
      "bio",
      "fees",
      "languages",
      "clinicName",
      "clinicAddress",
      "city",
      "consultationType",
      "availability",
      "slotDuration",
      "isAvailable",
      "qualifications",
      "exceptionDates",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    });

    await doctor.save();

    const updated = await Doctor.findById(doctor._id)
      .populate("userId", "name email avatar phone")
      .populate("specialization", "name icon color")
      .lean();

    res.json({ success: true, doctor: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/doctors/:id
 */
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    if (
      doctor.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Doctor.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(doctor.userId, { isActive: false });

    res.json({ success: true, message: "Doctor profile deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/:id/slots?date=2024-01-15
 * Get available slots for a specific date
 */
export const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.json({
        success: true,
        slots: [],
        message: "Cannot book past dates",
      });
    }

    // Check exception dates
    const isException = doctor.exceptionDates?.some(
      (ex) => normalizeDate(ex.date) === normalizeDate(date),
    );
    if (isException) {
      return res.json({
        success: true,
        slots: [],
        message: "Doctor unavailable on this date",
      });
    }

    // Find availability for the day of week
    const dayName = getDayFromDate(date);
    const dayAvailability = doctor.availability?.find(
      (a) => a.day === dayName && a.isActive,
    );

    if (!dayAvailability) {
      return res.json({
        success: true,
        slots: [],
        message: "Doctor not available on this day",
      });
    }

    // Generate all time slots
    let allSlots = [];
    if (dayAvailability.timeSlots && dayAvailability.timeSlots.length > 0) {
      dayAvailability.timeSlots.forEach((ts) => {
        const slots = generateTimeSlots(
          ts.startTime,
          ts.endTime,
          doctor.slotDuration,
        );
        allSlots.push(...slots);
      });
    } else if (dayAvailability.startTime && dayAvailability.endTime) {
      allSlots = generateTimeSlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        doctor.slotDuration,
      );
    }

    // Get booked slots from DB
    const dateStr = normalizeDate(date);
    let slotDoc = await Slot.findOne({
      doctorId: doctor._id,
      date: {
        $gte: new Date(dateStr),
        $lt: new Date(new Date(dateStr).getTime() + 86400000),
      },
    });

    const bookedTimes = slotDoc?.bookedTimes || [];
    const lockedTimes = await getLockedSlots(doctor._id.toString(), dateStr);

    // Build slot status
    const slots = allSlots.map((time) => ({
      time,
      status: bookedTimes.includes(time)
        ? "booked"
        : lockedTimes.includes(time)
          ? "locked"
          : "available",
    }));

    res.json({ success: true, slots, date: dateStr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/doctors/:id/slots
 * Create/update weekly slot schedule
 */
export const updateSlotSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    if (doctor.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { availability, slotDuration } = req.body;

    if (availability) {
      // Validate slots
      for (const daySchedule of availability) {
        if (daySchedule.timeSlots) {
          // Sort slots by start time
          daySchedule.timeSlots.sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );

          for (let i = 0; i < daySchedule.timeSlots.length; i++) {
            const slot = daySchedule.timeSlots[i];

            // Validate end time > start time
            if (slot.startTime >= slot.endTime) {
              return res
                .status(400)
                .json({
                  success: false,
                  message: `Invalid time range on ${daySchedule.day}: ${slot.startTime} - ${slot.endTime}. End time must be after start time.`,
                });
            }

            // Validate overlapping slots
            if (i > 0) {
              const prevSlot = daySchedule.timeSlots[i - 1];
              if (slot.startTime < prevSlot.endTime) {
                return res
                  .status(400)
                  .json({
                    success: false,
                    message: `Overlapping slots detected on ${daySchedule.day}. Please ensure slots do not overlap.`,
                  });
              }
            }
          }
        }
      }
      doctor.availability = availability;
    }

    if (slotDuration) {
      if (slotDuration < 10 || slotDuration > 120) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid slot duration. Must be between 10 and 120 minutes.",
          });
      }
      doctor.slotDuration = slotDuration;
    }

    await doctor.save();

    await notifyAdmins({
      title: "Doctor Schedule Updated",
      message: `Dr. ${req.user.name} has updated their weekly schedule/availability.`,
      type: "doctor",
      priority: "low",
    });

    res.json({
      success: true,
      message: "Schedule updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/doctors/:id/slots/:date
 * Delete slots for a specific date (mark as exception)
 */
export const deleteSlotsForDate = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    if (doctor.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const targetDate = new Date(req.params.date);
    doctor.exceptionDates.push({
      date: targetDate,
      reason: req.body.reason || "Unavailable",
    });
    await doctor.save();

    // Cancel existing appointments on this date
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const appointmentsToCancel = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["cancelled", "completed"] },
    });

    for (const appt of appointmentsToCancel) {
      appt.status = "cancelled";
      appt.cancelReason =
        req.body.reason || "Doctor unavailable due to leave/schedule change";
      appt.cancelledBy = req.user._id;
      await appt.save();

      // Notify the patient
      await Notification.create({
        user: appt.patientId,
        title: "Appointment Cancelled",
        message: `Your appointment on ${startOfDay.toLocaleDateString()} has been cancelled because the doctor is unavailable. Reason: ${appt.cancelReason}`,
        type: "appointment",
        appointment: appt._id,
      });
    }

    // Notify admins
    await notifyAdmins({
      title: "Schedule Blocked",
      message: `Dr. ${req.user.name} has blocked off ${startOfDay.toLocaleDateString()}. ${appointmentsToCancel.length} appointments were automatically cancelled.`,
      type: "doctor",
      priority: "medium",
    });

    res.json({
      success: true,
      message: "Date marked as unavailable and appointments cancelled",
      cancelledCount: appointmentsToCancel.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/:id/appointments
 */
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const filter = { doctorId: doctor._id };
    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patientId", "name email avatar phone gender dateOfBirth")
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      appointments,
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
 * GET /api/doctors/:id/patients
 */
export const getDoctorPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate("patientId", "name email avatar phone gender dateOfBirth")
      .sort({ date: -1 })
      .lean();

    // Deduplicate patients
    const patientMap = new Map();
    appointments.forEach((appt) => {
      const pid = appt.patientId?._id?.toString();
      if (pid && !patientMap.has(pid)) {
        patientMap.set(pid, {
          ...appt.patientId,
          totalAppointments: 0,
          lastVisit: appt.date,
        });
      }
      if (pid) patientMap.get(pid).totalAppointments++;
    });

    res.json({ success: true, patients: Array.from(patientMap.values()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/:id/patients/:patientId
 */
export const getDoctorPatientById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Verify doctor is the one requesting
    if (
      doctor.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Check if this patient has appointments with this doctor
    const hasAppointments = await Appointment.exists({
      doctorId: doctor._id,
      patientId: req.params.patientId,
    });

    if (!hasAppointments && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view this patient",
        });
    }

    const patient = await User.findById(req.params.patientId)
      .select(
        "-password -refreshToken -passwordResetToken -passwordResetExpires",
      )
      .lean();

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/doctors/:id/reviews
 */
export const getDoctorReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [reviews, total] = await Promise.all([
      Review.find({ doctorId: req.params.id })
        .populate("patientId", "name avatar")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ doctorId: req.params.id }),
    ]);

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { doctorId: Doctor.castId(req.params.id) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      success: true,
      reviews,
      breakdown,
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
 * GET /api/doctors/:id/earnings
 */
export const getDoctorEarnings = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthEarnings, lastMonthEarnings, monthlyData] =
      await Promise.all([
        Appointment.aggregate([
          {
            $match: {
              doctorId: doctor._id,
              status: "completed",
              date: { $gte: thisMonth },
            },
          },
          {
            $group: { _id: null, total: { $sum: "$fees" }, count: { $sum: 1 } },
          },
        ]),
        Appointment.aggregate([
          {
            $match: {
              doctorId: doctor._id,
              status: "completed",
              date: { $gte: lastMonth, $lt: thisMonth },
            },
          },
          {
            $group: { _id: null, total: { $sum: "$fees" }, count: { $sum: 1 } },
          },
        ]),
        Appointment.aggregate([
          { $match: { doctorId: doctor._id, status: "completed" } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
              total: { $sum: "$fees" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 12 },
        ]),
      ]);

    const current = thisMonthEarnings[0] || { total: 0, count: 0 };
    const previous = lastMonthEarnings[0] || { total: 0, count: 0 };
    const growth =
      previous.total > 0
        ? (((current.total - previous.total) / previous.total) * 100).toFixed(1)
        : 0;

    res.json({
      success: true,
      earnings: {
        thisMonth: current,
        lastMonth: previous,
        growth: Number(growth),
        monthly: monthlyData.reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
