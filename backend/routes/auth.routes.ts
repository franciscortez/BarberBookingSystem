import { Router } from 'express';
import { login, register, userLogin, barberLogin, logout, me } from '../controller/auth.controller';
import { authLimiter } from '../middleware/rateLimiters';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Admin login
router.post('/login', authLimiter, login);

// User (customer) registration and login
router.post('/register', authLimiter, register);
router.post('/user/login', authLimiter, userLogin);

// Barber login
router.post('/barber/login', authLimiter, barberLogin);

// Logout (clears cookie)
router.post('/logout', logout);

// Session check
router.get('/me', authMiddleware, me);

export = router;
