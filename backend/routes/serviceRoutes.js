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

// Public endpoints
router.get('/', getServices);
router.get('/:id', getService);

// Protected routes (Admin only)
router.post('/', authMiddleware, addService);
router.put('/:id', authMiddleware, editService);
router.delete('/:id', authMiddleware, removeService);

module.exports = router;
