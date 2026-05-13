const express = require('express');
const router = express.Router();
const appointmentController = require('../controller/appointmentController');

// POST /api/appointments
router.post('/', appointmentController.createBooking);

module.exports = router;
