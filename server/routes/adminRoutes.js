import { Router } from "express";
import {
  getDashboardStats,
  getPublicStats,
  getAnalyticsData,
  getAllDoctors,
  getAllPatients,
  deletePatient,
  getAllAppointments,
  getDoctorApprovals,
  approveDoctor,
  rejectDoctor,
  getSpecializations,
  createSpecialization,
  deleteSpecialization,
  updateSpecialization,
  getDoctorById,
  getPatientById,
  getContactInquiries,
  getContactInquiryById,
  updateContactInquiry,
  deleteContactInquiry,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

// Publicly available specialization route (for home page / register page)
router.get("/specializations", getSpecializations);
router.get("/public-stats", getPublicStats);

// Admin only routes
router.use(protect, roleGuard("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalyticsData);
router.get("/doctors", getAllDoctors);
router.get("/doctors/approvals", getDoctorApprovals);
router.get("/doctors/:id", getDoctorById);
router.get("/patients", getAllPatients);
router.get("/patients/:id", getPatientById);
router.delete("/patients/:id", deletePatient);
router.get("/appointments", getAllAppointments);
router.put("/doctors/:id/approve", approveDoctor);
router.put("/doctors/:id/reject", rejectDoctor);

router.post("/specializations", createSpecialization);
router.put("/specializations/:id", updateSpecialization);
router.delete("/specializations/:id", deleteSpecialization);

router.get("/contact-inquiries", getContactInquiries);
router.get("/contact-inquiries/:id", getContactInquiryById);
router.patch("/contact-inquiries/:id", updateContactInquiry);
router.delete("/contact-inquiries/:id", deleteContactInquiry);

export default router;
