import { Router } from 'express';
import {
  getDoctors,
  searchDoctors,
  getDoctorById,
  registerDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
  updateSlotSchedule,
  deleteSlotsForDate,
  getDoctorAppointments,
  getDoctorPatients,
  getDoctorPatientById,
  getDoctorReviews,
  getDoctorEarnings,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

/* ─── Public Routes ─── */
router.get('/', getDoctors);
router.get('/search', searchDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);
router.get('/:id/reviews', getDoctorReviews);

/* ─── Protected Routes ─── */
router.post('/register', protect, registerDoctor);
router.put('/:id', protect, roleGuard('doctor', 'admin'), updateDoctor);
router.delete('/:id', protect, roleGuard('doctor', 'admin'), deleteDoctor);

/* ─── Doctor Dashboard Routes ─── */
router.post('/:id/slots', protect, roleGuard('doctor'), updateSlotSchedule);
router.delete('/:id/slots/:date', protect, roleGuard('doctor'), deleteSlotsForDate);
router.get('/:id/appointments', protect, roleGuard('doctor'), getDoctorAppointments);
router.get('/:id/patients', protect, roleGuard('doctor'), getDoctorPatients);
router.get('/:id/patients/:patientId', protect, roleGuard('doctor'), getDoctorPatientById);
router.get('/:id/earnings', protect, roleGuard('doctor'), getDoctorEarnings);

export default router;
