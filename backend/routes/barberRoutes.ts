import { Router } from 'express';
import {
    getBarbers,
    getBarber,
    addBarber,
    editBarber,
    removeBarber
} from '../controller/barberController';
import authMiddleware from '../middleware/authMiddleware';
import { catalogReadLimiter } from '../middleware/rateLimiters';

const router = Router();

// Barber endpoints
router.get('/', catalogReadLimiter, getBarbers);
router.get('/:id', catalogReadLimiter, getBarber);

// Protected routes
router.post('/', authMiddleware, addBarber);
router.put('/:id', authMiddleware, editBarber);
router.delete('/:id', authMiddleware, removeBarber);

export = router;
