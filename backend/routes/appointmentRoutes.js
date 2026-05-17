const express = require('express');
const router = express.Router();
const appointmentController = require('../controller/appointmentController');

// POST /api/appointments
router.post('/', appointmentController.createBooking);
router.get('/manage', appointmentController.getManagedBooking);
router.post('/reschedule', appointmentController.rescheduleBooking);
router.post('/cancel', appointmentController.cancelBooking);

module.exports = router;
