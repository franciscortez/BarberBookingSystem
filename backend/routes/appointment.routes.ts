import { Router } from "express";
import * as appointmentController from "../controller/appointment.controller";
import { bookingMutationLimiter } from "../middleware/rateLimiters";
import { optionalAuthMiddleware } from "../middleware/authMiddleware";

const router = Router();

// POST /api/appointments — optionalAuth so logged-in users get user_id linked
router.post(
  "/",
  bookingMutationLimiter,
  optionalAuthMiddleware,
  appointmentController.createBooking,
);
router.get("/manage", appointmentController.getManagedBooking);
router.post(
  "/reschedule",
  bookingMutationLimiter,
  appointmentController.rescheduleBooking,
);
router.post(
  "/cancel",
  bookingMutationLimiter,
  appointmentController.cancelBooking,
);

export = router;
