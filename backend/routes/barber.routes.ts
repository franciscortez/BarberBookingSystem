import { Router } from "express";
import {
  getBarbers,
  getBarber,
  addBarber,
  editBarber,
  removeBarber,
} from "../controller/barber.controller";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware";
import { catalogReadLimiter } from "../middleware/rateLimiters";

const router = Router();

// Barber endpoints
router.get("/", catalogReadLimiter, getBarbers);
router.get("/:id", catalogReadLimiter, getBarber);

// Protected routes (Admin only)
router.post("/", authMiddleware, roleMiddleware("admin"), addBarber);
router.put("/:id", authMiddleware, roleMiddleware("admin"), editBarber);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), removeBarber);

export = router;
