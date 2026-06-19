import { Router } from 'express';
import {
  bookAppointment,
  getAppointments,
  getUpcomingAppointments,
  getTodayAppointments,
  getAppointmentById,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  rescheduleAppointment,
  markNoShow,
  updateNotes,
  getReceipt,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

// All appointment routes require authentication
router.use(protect);

router.post('/', roleGuard('patient'), bookAppointment);
router.get('/', getAppointments);
router.get('/upcoming', getUpcomingAppointments);
router.get('/today', getTodayAppointments);
router.get('/:id', getAppointmentById);

/* ─── Status Updates ─── */
router.put('/:id/confirm', roleGuard('doctor', 'admin'), confirmAppointment);
router.put('/:id/complete', roleGuard('doctor', 'admin'), completeAppointment);
router.put('/:id/cancel', cancelAppointment); // Both can cancel
router.put('/:id/reschedule', roleGuard('patient', 'admin'), rescheduleAppointment);
router.put('/:id/no-show', roleGuard('doctor', 'admin'), markNoShow);

/* ─── Misc ─── */
router.put('/:id/notes', roleGuard('doctor'), updateNotes);
router.get('/:id/receipt', getReceipt);

export default router;
