import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Specialization from "../models/Specialization.js";
import Notification from "../models/Notification.js";
import ContactInquiry from "../models/ContactInquiry.js";
import { sendDoctorApprovalEmail } from "../utils/sendEmail.js";

/**
 * GET /api/admin/dashboard
 * Get high-level system metrics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      revenueStats,
      recentAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      Doctor.countDocuments({ isApproved: true }),
      Doctor.countDocuments({
        isApproved: false,
        rejectionReason: { $exists: false },
      }),
      Appointment.countDocuments(),
      Appointment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$fees" } } },
      ]),
      Appointment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("patientId", "name avatar")
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name" },
        })
        .lean(),
    ]);

    const platformRevenue = (revenueStats[0]?.total || 0) * 0.1; // Platform takes 10%

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        platformRevenue,
      },
      recentAppointments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/public-stats
 * Get high-level system metrics for public homepage
 */
export const getPublicStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalAppointments] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      Doctor.countDocuments({ isApproved: true }),
      Appointment.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        // Mock a reasonable base number plus actual DB data for a robust feel,
        // or just return the DB numbers directly.
        totalConsultations: totalAppointments * 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch public stats",
    });
  }
};

/**
 * GET /api/admin/doctors
 * Get all doctors
 */
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name email phone gender avatar isBlocked createdAt")
      .populate("specialization", "name")
      .sort({ createdAt: -1 })
      .lean();

    const activeDoctors = doctors.filter((d) => d.userId);

    res.json({ success: true, doctors: activeDoctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/patients
 * Get all patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/patients/:id
 * Get a specific patient by ID for admin
 */
export const getPatientById = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select("-password");
    if (!patient || patient.role !== "patient") {
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
 * GET /api/admin/doctors/:id
 * Get a specific doctor by ID for admin
 */
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.id }).populate(
      "userId",
      "-password",
    );
    if (!doctor) {
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
 * DELETE /api/admin/patients/:id
 * Delete a patient and their data
 */
export const deletePatient = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "patient") {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Delete related appointments
    await Appointment.deleteMany({ patientId: req.params.id });

    // Delete the user record
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/appointments
 * Get all appointments
 */
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name email phone avatar")
      .populate({
        path: "doctorId",
        populate: [
          { path: "userId", select: "name avatar" },
          { path: "specialization", select: "name" },
        ],
      })
      .sort({ date: -1, startTime: -1 })
      .lean();

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics
 * Get advanced analytics data based on time filters
 */
export const getAnalyticsData = async (req, res) => {
  try {
    const timeFilter = req.query.timeRange || "month"; // 'week', 'month', 'year', 'all'
    const now = new Date();
    let startDate = new Date();

    if (timeFilter === "week") startDate.setDate(now.getDate() - 7);
    else if (timeFilter === "month") startDate.setMonth(now.getMonth() - 1);
    else if (timeFilter === "year")
      startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0); // all time

    const dateQuery = { createdAt: { $gte: startDate } };
    const appointmentDateQuery = { date: { $gte: startDate } };

    // Basic KPIs
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      rejectedDoctors,
      appointmentsList,
    ] = await Promise.all([
      User.countDocuments({ role: "patient", ...dateQuery }),
      Doctor.countDocuments({ isApproved: true, ...dateQuery }),
      Doctor.countDocuments({
        isApproved: false,
        rejectionReason: { $exists: false },
        ...dateQuery,
      }),
      Doctor.countDocuments({
        isApproved: false,
        rejectionReason: { $exists: true },
        ...dateQuery,
      }),
      Appointment.find(appointmentDateQuery).lean(),
    ]);

    // Derived appointment metrics
    const totalAppointments = appointmentsList.length;
    let completed = 0,
      cancelled = 0,
      pending = 0,
      confirmed = 0;
    let totalRevenue = 0;

    appointmentsList.forEach((appt) => {
      if (appt.status === "completed") {
        completed++;
        totalRevenue += appt.fees || 0;
      } else if (appt.status === "cancelled") cancelled++;
      else if (appt.status === "pending") pending++;
      else if (appt.status === "confirmed") confirmed++;
    });

    const appointmentStatusData = [
      { name: "Completed", value: completed },
      { name: "Cancelled", value: cancelled },
      { name: "Pending", value: pending },
      { name: "Confirmed", value: confirmed },
    ].filter((item) => item.value > 0);

    // Get time series data for growth
    let groupByFormat = timeFilter === "year" ? "%Y-%m" : "%Y-%m-%d";

    const timeSeriesData = await Appointment.aggregate([
      { $match: appointmentDateQuery },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$date" } },
          appointments: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$fees", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = timeSeriesData.map((item) => ({
      date: item._id,
      appointments: item.appointments,
      revenue: item.revenue * 0.1, // 10% platform fee
    }));

    // Specializations distribution
    const doctors = await Doctor.find({ isApproved: true })
      .populate("specialization", "name")
      .lean();
    const specCount = {};
    doctors.forEach((doc) => {
      const specName = doc.specialization?.name || "General";
      specCount[specName] = (specCount[specName] || 0) + 1;
    });

    const specializationData = Object.keys(specCount)
      .map((key) => ({
        name: key,
        value: specCount[key],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5

    res.json({
      success: true,
      kpis: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        rejectedDoctors,
        totalAppointments,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        platformRevenue: totalRevenue * 0.1,
      },
      appointmentStatusData,
      specializationData,
      trends,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/doctors/approvals
 */
export const getDoctorApprovals = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      isApproved: false,
      rejectionReason: { $exists: false },
    })
      .populate("userId", "name email phone gender")
      .populate("specialization", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/doctors/:id/approve
 */
export const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "name email",
    );
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    doctor.isApproved = true;
    doctor.approvedAt = new Date();
    doctor.approvedBy = req.user._id;
    doctor.rejectionReason = undefined;
    await doctor.save();

    await Notification.create({
      userId: doctor.userId._id,
      title: "Account Approved",
      message:
        "Your doctor account has been approved. You can now set up your schedule.",
      type: "approval",
    });

    sendDoctorApprovalEmail(doctor.userId, true).catch(console.error);

    res.json({ success: true, message: "Doctor approved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/doctors/:id/reject
 */
export const rejectDoctor = async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "name email",
    );

    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    doctor.isApproved = false;
    doctor.rejectionReason = reason;
    await doctor.save();

    await Notification.create({
      userId: doctor.userId._id,
      title: "Account Verification Failed",
      message: `Your doctor account verification failed. Reason: ${reason}`,
      type: "approval",
    });

    sendDoctorApprovalEmail(doctor.userId, false, reason).catch(console.error);

    res.json({ success: true, message: "Doctor application rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── Specializations Management ─── */

export const getSpecializations = async (req, res) => {
  try {
    const specs = await Specialization.aggregate([
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "specialization",
          as: "doctorsList"
        }
      },
      {
        $addFields: {
          doctorCount: {
            $size: {
              $filter: {
                input: "$doctorsList",
                as: "doc",
                cond: { $eq: ["$$doc.isApproved", true] }
              }
            }
          }
        }
      },
      {
        $project: {
          doctorsList: 0
        }
      },
      {
        $sort: { sortOrder: 1 }
      }
    ]);
    res.json({ success: true, specializations: specs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSpecialization = async (req, res) => {
  try {
    const spec = await Specialization.create(req.body);
    res.status(201).json({ success: true, specialization: spec });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Specialization name already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSpecialization = async (req, res) => {
  try {
    const specId = req.params.id;
    const spec = await Specialization.findByIdAndDelete(specId);
    if (!spec) {
      return res
        .status(404)
        .json({ success: false, message: "Specialization not found" });
    }
    res.json({ success: true, message: "Specialization deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSpecialization = async (req, res) => {
  try {
    const specId = req.params.id;
    const { name, description, icon } = req.body;
    const spec = await Specialization.findByIdAndUpdate(
      specId,
      { name, description, icon },
      { new: true, runValidators: true },
    );

    if (!spec) {
      return res
        .status(404)
        .json({ success: false, message: "Specialization not found" });
    }

    res.json({
      success: true,
      specialization: spec,
      message: "Specialization updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Specialization name already exists",
        });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── Contact Inquiries Management ─── */

export const getContactInquiries = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const inquiries = await ContactInquiry.find(query).sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContactInquiryById = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContactInquiry = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'Read') updateData.readAt = new Date();
    
    const inquiry = await ContactInquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContactInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
