const express = require('express');
const router = express.Router();
const appointmentController = require('../controller/appointmentController');
const { bookingMutationLimiter } = require('../middleware/rateLimiters');

// POST /api/appointments
router.post('/', bookingMutationLimiter, appointmentController.createBooking);
router.get('/manage', appointmentController.getManagedBooking);
router.post('/reschedule', bookingMutationLimiter, appointmentController.rescheduleBooking);
router.post('/cancel', bookingMutationLimiter, appointmentController.cancelBooking);

module.exports = router;
