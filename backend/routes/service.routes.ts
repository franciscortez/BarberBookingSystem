import { Router } from 'express';
import {
    getServices,
    getService,
    addService,
    editService,
    removeService
} from '../controller/service.controller';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { catalogReadLimiter } from '../middleware/rateLimiters';

const router = Router();

// Public endpoints
router.get('/', catalogReadLimiter, getServices);
router.get('/:id', catalogReadLimiter, getService);

// Protected routes (Admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), addService);
router.put('/:id', authMiddleware, roleMiddleware('admin'), editService);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), removeService);

export = router;

