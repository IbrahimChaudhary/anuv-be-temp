import { Router } from 'express';
import { getQuizzes, createQuiz } from '../controllers/quizController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateAdmin, getQuizzes);

router.post('/', createQuiz);

export default router;
