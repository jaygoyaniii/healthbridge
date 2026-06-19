import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionById,
  getPrescriptions,
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.use(protect);

router.post('/', roleGuard('doctor'), createPrescription);
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);

export default router;
