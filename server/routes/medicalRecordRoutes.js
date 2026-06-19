import { Router } from 'express';
import {
  uploadRecord,
  getRecords,
  deleteRecord,
  updateSharing,
} from '../controllers/medicalRecordController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', upload.single('file'), uploadRecord);
router.get('/', getRecords);
router.delete('/:id', deleteRecord);
router.put('/:id/share', updateSharing);

export default router;
