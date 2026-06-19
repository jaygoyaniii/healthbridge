import express from 'express';
import { createContactInquiry } from '../controllers/publicController.js';

const router = express.Router();

router.post('/contact', createContactInquiry);

export default router;
