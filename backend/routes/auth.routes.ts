import { Router } from "express";
import {
  login,
  register,
  userLogin,
  barberLogin,
  refresh,
  logout,
  me,
} from "../controller/auth.controller";
import { authLimiter } from "../middleware/rateLimiters";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateInvite, acceptInvite } from "../controller/staff.controller";

const router = Router();

// Admin login
router.post("/login", authLimiter, login);

// User (customer) registration and login
router.post("/register", authLimiter, register);
router.post("/user/login", authLimiter, userLogin);

// Barber login
router.post("/barber/login", authLimiter, barberLogin);

// Token refresh
router.post("/refresh", authLimiter, refresh);

// Logout (clears cookie)
router.post("/logout", logout);

// Session check
router.get("/me", authMiddleware, me);
router.get("/barber-invitations/validate", validateInvite);
router.post("/barber-invitations/accept", authLimiter, acceptInvite);

export = router;
