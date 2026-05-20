const express = require('express');
const router = express.Router();
const {
    getServices,
    getService,
    addService,
    editService,
    removeService
} = require('../controller/serviceController');

const authMiddleware = require('../middleware/authMiddleware');
const { catalogReadLimiter } = require('../middleware/rateLimiters');

// Public endpoints
router.get('/', catalogReadLimiter, getServices);
router.get('/:id', catalogReadLimiter, getService);

// Protected routes (Admin only)
router.post('/', authMiddleware, addService);
router.put('/:id', authMiddleware, editService);
router.delete('/:id', authMiddleware, removeService);

module.exports = router;
