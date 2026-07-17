import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as StaffService from "../services/staff.services";
import {
  AppointmentFiltersSchema,
  AppointmentStatusSchema,
  StaffRescheduleSchema,
  BarberProfileSchema,
  ActiveStateSchema,
  InviteBarberSchema,
  AcceptInvitationSchema,
  InvitationTokenSchema,
  ReplaceWorkingHoursSchema,
  AvailabilityBlockSchema,
  WalkinBookingSchema,
  DirectCreateBarberSchema,
  UpdatePasswordSchema,
} from "../validation/staff.validation";

const barberId = (req: Request) =>
  StaffService.resolveBarberId((req as AuthenticatedRequest).user!.id);
export const adminDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getDashboard());
  } catch (e) {
    next(e);
  }
};
export const barberDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getDashboard(await barberId(req)));
  } catch (e) {
    next(e);
  }
};
export const adminAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.listAppointments(
        AppointmentFiltersSchema.parse(req.query),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const barberAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.listAppointments(
        AppointmentFiltersSchema.parse(req.query),
        await barberId(req),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const adminAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getAppointment(req.params.id as string));
  } catch (e) {
    next(e);
  }
};
export const barberAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.getAppointment(
        req.params.id as string,
        await barberId(req),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const adminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = AppointmentStatusSchema.parse(req.body);
    res.json(await StaffService.changeStatus(req.params.id as string, status));
  } catch (e) {
    next(e);
  }
};
export const barberStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = AppointmentStatusSchema.parse(req.body);
    res.json(
      await StaffService.changeStatus(
        req.params.id as string,
        status,
        await barberId(req),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const adminReschedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.reschedule(
        req.params.id as string,
        StaffRescheduleSchema.parse(req.body),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const barberReschedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.reschedule(
        req.params.id as string,
        StaffRescheduleSchema.parse(req.body),
        await barberId(req),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const listBarbers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.listBarbers());
  } catch (e) {
    next(e);
  }
};
export const getBarber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getBarber(req.params.id as string));
  } catch (e) {
    next(e);
  }
};
export const updateBarber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.updateBarber(
        req.params.id as string,
        BarberProfileSchema.parse(req.body),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const setBarberActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { is_active } = ActiveStateSchema.parse(req.body);
    res.json(
      await StaffService.setBarberActive(req.params.id as string, is_active),
    );
  } catch (e) {
    next(e);
  }
};
export const deleteBarber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await StaffService.deleteBarber(req.params.id as string);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};

export const payments = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.listPayments());
  } catch (e) {
    next(e);
  }
};
export const adminAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getAvailability(req.params.barberId as string));
  } catch (e) {
    next(e);
  }
};
export const barberAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getAvailability(await barberId(req)));
  } catch (e) {
    next(e);
  }
};
export const adminHours = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { hours } = ReplaceWorkingHoursSchema.parse(req.body);
    res.json(
      await StaffService.replaceWorkingHours(
        req.params.barberId as string,
        hours,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const barberHours = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { hours } = ReplaceWorkingHoursSchema.parse(req.body);
    res.json(
      await StaffService.replaceWorkingHours(await barberId(req), hours),
    );
  } catch (e) {
    next(e);
  }
};
export const adminAddBlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res
      .status(201)
      .json(
        await StaffService.addAvailabilityBlock(
          req.params.barberId as string,
          AvailabilityBlockSchema.parse(req.body),
        ),
      );
  } catch (e) {
    next(e);
  }
};
export const barberAddBlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res
      .status(201)
      .json(
        await StaffService.addAvailabilityBlock(
          await barberId(req),
          AvailabilityBlockSchema.parse(req.body),
        ),
      );
  } catch (e) {
    next(e);
  }
};
export const adminDeleteBlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await StaffService.deleteAvailabilityBlock(
      req.params.barberId as string,
      req.params.id as string,
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
export const barberDeleteBlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await StaffService.deleteAvailabilityBlock(
      await barberId(req),
      req.params.id as string,
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
export const profile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.getBarber(await barberId(req)));
  } catch (e) {
    next(e);
  }
};
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.updateBarber(
        await barberId(req),
        BarberProfileSchema.parse(req.body),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const invitations = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.listInvitations());
  } catch (e) {
    next(e);
  }
};
export const invite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res
      .status(201)
      .json(
        await StaffService.inviteBarber(
          InviteBarberSchema.parse(req.body),
          (req as AuthenticatedRequest).user!.id,
        ),
      );
  } catch (e) {
    next(e);
  }
};
export const revoke = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await StaffService.revokeInvitation(req.params.id as string);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
export const resend = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await StaffService.resendInvitation(req.params.id as string));
  } catch (e) {
    next(e);
  }
};
export const validateInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await StaffService.validateInvitation(
        InvitationTokenSchema.parse(req.query).token,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = AcceptInvitationSchema.parse(req.body);
    res.status(201).json({
      user: await StaffService.acceptInvitation(data.token, data.password),
    });
  } catch (e) {
    next(e);
  }
};

export const adminCreateWalkin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = WalkinBookingSchema.parse(req.body);
    const appointment = await StaffService.createWalkinAppointment(data);
    res.status(201).json({
      message: "Walk-in booking created successfully",
      appointment,
    });
  } catch (e) {
    next(e);
  }
};

export const createBarber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = DirectCreateBarberSchema.parse(req.body);
    const barber = await StaffService.createBarberDirect(data);
    res.status(201).json(barber);
  } catch (e) {
    next(e);
  }
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const data = UpdatePasswordSchema.parse(req.body);
    await StaffService.updateBarberPassword(userId, data);
    res.json({ message: "Password updated successfully" });
  } catch (e) {
    next(e);
  }
};
