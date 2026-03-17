import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import {
  getAllAnswers,
  getPublicAnswers,
  getAnswersBySlip,
  getAnswerById,
  createAnswer,
  updateAnswerStatus,
  deleteAnswer
} from '../controllers/answerController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getPublicAnswers);
router.get('/slip/:slipId', getAnswersBySlip);
router.post('/', createAnswer);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.get('/', admin, getAllAnswers);
router.get('/:id', admin, getAnswerById);
router.put('/:id', admin, updateAnswerStatus);
router.delete('/:id', admin, deleteAnswer);

export default router;