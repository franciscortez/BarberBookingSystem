import { Request, Response, NextFunction } from 'express';
import * as AppointmentService from '../services/appointment.services';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AppointmentService.CreateBookingSchema.parse(req.body);
        const userId = (req as AuthenticatedRequest).user?.id;
        const result = await AppointmentService.createBooking(data, userId);
        res.status(201).json({
            message: 'Booking created and checkout session initialized',
            appointment: result.appointment,
            checkout_url: result.checkout_url
        });
    } catch (err) {
        next(err);
    }
};

export const getManagedBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.query.token as string | undefined;
        if (!token) {
            res.status(400).json({ error: 'Management token is required' });
            return;
        }
        const details = await AppointmentService.getManagedBooking(token);
        res.json(details);
    } catch (err) {
        next(err);
    }
};

export const rescheduleBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AppointmentService.RescheduleBookingSchema.parse(req.body);
        const details = await AppointmentService.rescheduleBooking(data);
        res.json({ message: 'Appointment rescheduled successfully', appointment: details });
    } catch (err) {
        next(err);
    }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AppointmentService.CancelBookingSchema.parse(req.body);
        const details = await AppointmentService.cancelBooking(data);
        res.json({
            message: 'Appointment cancelled successfully. Down payment is not refunded.',
            appointment: details
        });
    } catch (err) {
        next(err);
    }
};
