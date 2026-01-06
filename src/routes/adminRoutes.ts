import { Router } from 'express';
import {
  loginAdmin,
  logoutAdmin,
} from '../controllers/adminController';
import { authenticateAdmin, isSuperAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', loginAdmin);

router.post('/logout', authenticateAdmin, logoutAdmin);

export default router;