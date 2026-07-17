import { Router } from "express";
import { getAvailability } from "../controller/availability.controller";
import { availabilityLimiter } from "../middleware/rateLimiters";

const router = Router();

// Public availability endpoint
router.get("/", availabilityLimiter, getAvailability);

export = router;
