import { Router } from 'express';
import { login } from '../controller/authController';
import { authLimiter } from '../middleware/rateLimiters';

const router = Router();

// Auth endpoints
router.post('/login', authLimiter, login);

export = router;
