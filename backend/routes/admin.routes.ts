import { Router } from "express";
import { authMiddleware, authorize } from "../middleware/authMiddleware";
import * as c from "../controller/staff.controller";
import {
  getServices,
  getService,
  addService,
  editService,
  removeService,
} from "../controller/service.controller";

const router = Router();

router.use(authMiddleware, authorize("admin"));

router.get("/dashboard", c.adminDashboard);

router.get("/appointments", c.adminAppointments);
router.post("/appointments", c.adminCreateWalkin);
router.get("/appointments/:id", c.adminAppointment);
router.patch("/appointments/:id/status", c.adminStatus);
router.patch("/appointments/:id/schedule", c.adminReschedule);

router.get("/barbers", c.listBarbers);
router.post("/barbers", c.createBarber);
router.get("/barbers/:id", c.getBarber);
router.patch("/barbers/:id", c.updateBarber);
router.patch("/barbers/:id/active", c.setBarberActive);
router.delete("/barbers/:id", c.deleteBarber);

router.get("/barber-invitations", c.invitations);
router.post("/barber-invitations", c.invite);
router.post("/barber-invitations/:id/resend", c.resend);
router.delete("/barber-invitations/:id", c.revoke);

router.get("/availability/:barberId", c.adminAvailability);
router.put("/availability/:barberId/hours", c.adminHours);
router.post("/availability/:barberId/blocks", c.adminAddBlock);
router.delete("/availability/:barberId/blocks/:id", c.adminDeleteBlock);

router.get("/payments", c.payments);

router.get("/services", getServices);
router.get("/services/:id", getService);
router.post("/services", addService);
router.put("/services/:id", editService);
router.delete("/services/:id", removeService);

export = router;
