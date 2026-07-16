import { z } from 'zod';
import { AppError } from '../utils/AppError';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Validates that a YYYY-MM-DD string is a real calendar date (not e.g. 2024-02-30).
 * Used as a Zod superRefine to give a consistent error message.
 */
export const validateCalendarDate = (date: string): boolean => {
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(`${date}T00:00:00`);
    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
    );
};

export const CreateBookingSchema = z.object({
    customer_name: z.string().min(1, 'customer_name is required'),
    customer_phone: z.string().min(1, 'customer_phone is required'),
    customer_email: z.string().email('customer_email must be a valid email'),
    barber_id: z.string().uuid('barber_id must be a valid UUID'),
    service_id: z.string().uuid('service_id must be a valid UUID'),
    appointment_date: z
        .string()
        .regex(dateRegex, 'Invalid appointment date or start time')
        .refine(validateCalendarDate, 'Invalid appointment date or start time'),
    start_time: z
        .string()
        .regex(timeRegex, 'Invalid appointment date or start time')
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const RescheduleBookingSchema = z.object({
    token: z.string().min(1, 'token is required'),
    appointment_date: z
        .string()
        .regex(dateRegex, 'Invalid appointment date or start time')
        .refine(validateCalendarDate, 'Invalid appointment date or start time'),
    start_time: z
        .string()
        .regex(timeRegex, 'Invalid appointment date or start time')
});

export type RescheduleBookingInput = z.infer<typeof RescheduleBookingSchema>;

export const CancelBookingSchema = z.object({
    token: z.string().min(1, 'token is required')
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

/**
 * Builds the end time string from date + start time + duration.
 * Throws AppError.badRequest if the datetime is invalid.
 */
export const buildEndTime = (appointmentDate: string, startTime: string, durationMins: number): string => {
    const normalizedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const startDt = new Date(`${appointmentDate}T${normalizedStart}`);
    if (Number.isNaN(startDt.getTime())) {
        throw AppError.badRequest('Invalid appointment date or start time');
    }
    const endDt = new Date(startDt.getTime() + durationMins * 60000);
    return endDt.toTimeString().split(' ')[0];
};
