const express = require('express');
const router = express.Router();
const {
    getBarbers,
    getBarber,
    addBarber,
    editBarber,
    removeBarber
} = require('../controller/barberController');

const authMiddleware = require('../middleware/authMiddleware');
const { catalogReadLimiter } = require('../middleware/rateLimiters');

// Barber endpoints
router.get('/', catalogReadLimiter, getBarbers);
router.get('/:id', catalogReadLimiter, getBarber);

// Protected routes
router.post('/', authMiddleware, addBarber);
router.put('/:id', authMiddleware, editBarber);
router.delete('/:id', authMiddleware, removeBarber);

module.exports = router;
