import { Router } from 'express';
import {
    getServices,
    getService,
    addService,
    editService,
    removeService
} from '../controller/service.controller';
import authMiddleware from '../middleware/authMiddleware';
import { catalogReadLimiter } from '../middleware/rateLimiters';

const router = Router();

// Public endpoints
router.get('/', catalogReadLimiter, getServices);
router.get('/:id', catalogReadLimiter, getService);

// Protected routes (Admin only)
router.post('/', authMiddleware, addService);
router.put('/:id', authMiddleware, editService);
router.delete('/:id', authMiddleware, removeService);

export = router;
