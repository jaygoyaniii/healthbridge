import { Router } from 'express';
import {
  createReview,
  replyToReview,
  markHelpful,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.put('/:id/helpful', markHelpful); // Public

router.use(protect);
router.post('/', roleGuard('patient'), createReview);
router.put('/:id/reply', roleGuard('doctor'), replyToReview);
router.delete('/:id', deleteReview);

export default router;
