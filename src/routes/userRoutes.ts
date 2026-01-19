import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateAdmin, getUsers);

router.post('/', createUser);

export default router;
