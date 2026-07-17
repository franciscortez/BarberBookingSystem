import { Router } from "express";
import { authMiddleware, authorize } from "../middleware/authMiddleware";
import * as c from "../controller/staff.controller";

const router = Router();

router.use(authMiddleware, authorize("barber"));

router.get("/dashboard", c.barberDashboard);

router.get("/appointments", c.barberAppointments);
router.get("/appointments/:id", c.barberAppointment);
router.patch("/appointments/:id/status", c.barberStatus);
router.patch("/appointments/:id/schedule", c.barberReschedule);

router.get("/availability", c.barberAvailability);
router.post("/availability/blocks", c.barberAddBlock);
router.delete("/availability/blocks/:id", c.barberDeleteBlock);

router.get("/profile", c.profile);
router.patch("/profile", c.updateProfile);

export = router;
