import { Router } from 'express';
import * as appointmentController from '../controller/appointment.controller';
import { bookingMutationLimiter } from '../middleware/rateLimiters';

const router = Router();

// POST /api/appointments
router.post('/', bookingMutationLimiter, appointmentController.createBooking);
router.get('/manage', appointmentController.getManagedBooking);
router.post('/reschedule', bookingMutationLimiter, appointmentController.rescheduleBooking);
router.post('/cancel', bookingMutationLimiter, appointmentController.cancelBooking);

export = router;
