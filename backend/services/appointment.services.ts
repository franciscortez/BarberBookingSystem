import { z } from 'zod';
import crypto from 'crypto';
import pool = require('../config/database');
import * as AppointmentModel from '../model/appointment.model';
import * as PaymentModel from '../model/payment.model';
import * as ServiceModel from '../model/service.model';
import * as paymongoConfig from '../config/paymongo';
import { enqueueEmailJob } from '../utils/emailQueue';
import { validateBookableSlot } from '../utils/bookingRules';
import { AppError } from '../utils/AppError';
import { Appointment, AppointmentDetails } from '../types';
import {
    CreateBookingSchema,
    RescheduleBookingSchema,
    CancelBookingSchema,
    buildEndTime
} from '../validation/appointment.validation';

export { CreateBookingSchema, RescheduleBookingSchema, CancelBookingSchema };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildFrontendUrl = (path: string): string => {
    const baseUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
    return `${baseUrl}${path}`;
};

const createPayMongoCheckout = async (
    amount: number,
    description: string,
    customer_email: string,
    customer_name: string,
    customer_phone: string,
    referenceNumber: string,
    managementToken: string
): Promise<any> => {
    const authHeader = `Basic ${Buffer.from(`${paymongoConfig.secretKey}:`).toString('base64')}`;

    const payload = {
        data: {
            attributes: {
                billing: { email: customer_email, name: customer_name, phone: customer_phone },
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
                line_items: [{
                    currency: 'PHP',
                    amount: Math.round(amount * 100),
                    description,
                    name: 'Barber Appointment Downpayment',
                    quantity: 1
                }],
                payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
                description,
                success_url: buildFrontendUrl(`/success?token=${encodeURIComponent(managementToken)}`),
                cancel_url: buildFrontendUrl('/book'),
                reference_number: referenceNumber
            }
        }
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw AppError.badGateway(
            'Booking recorded but failed to initialize payment gateway',
            `PayMongo API error: ${JSON.stringify(errorData)}`
        );
    }

    const data = await response.json() as any;
    return data.data;
};

// ─── Service Functions ───────────────────────────────────────────────────────

export interface CreateBookingResult {
    appointment: Appointment;
    checkout_url: string;
}

export const createBooking = async (
    input: z.infer<typeof CreateBookingSchema>
): Promise<CreateBookingResult> => {
    const { customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time } = input;

    const service = await ServiceModel.getServiceById(service_id);
    if (!service) throw AppError.notFound('Service not found');
    if (service.barber_id !== barber_id) throw AppError.badRequest('Service does not belong to the selected barber');

    const end_time = buildEndTime(appointment_date, start_time, service.duration_mins);

    const slotValidation = validateBookableSlot({ appointmentDate: appointment_date, startTime: start_time, durationMins: service.duration_mins });
    if (!slotValidation.valid) throw AppError.badRequest(slotValidation.error!);

    // DB transaction — use finally to guarantee client release
    const client = await pool.connect();
    let released = false;
    let newAppointment!: Appointment;
    let newPayment: any;

    try {
        await client.query('BEGIN');
        await AppointmentModel.lockBarber(barber_id, client);

        const isAvailable = await AppointmentModel.isSlotAvailable(barber_id, appointment_date, start_time, end_time, client);
        if (!isAvailable) {
            await client.query('ROLLBACK');
            released = true;
            client.release();
            throw AppError.conflict('The requested time slot is no longer available');
        }

        const managementToken = crypto.randomUUID();
        newAppointment = await AppointmentModel.createAppointment({
            customer_name, customer_phone, customer_email,
            barber_id, service_id, appointment_date, start_time, end_time,
            management_token: managementToken
        }, client);

        newPayment = await PaymentModel.createPayment({
            appointment_id: newAppointment.id,
            amount: service.downpayment_amount,
            idempotency_key: crypto.randomUUID()
        }, client);

        await client.query('COMMIT');
    } catch (dbErr: any) {
        if (!released) {
            await client.query('ROLLBACK');
            client.release();
        }
        if (dbErr instanceof AppError) throw dbErr;
        throw AppError.internal('Failed to process booking in database', dbErr.message);
    }

    // Only reaches here if transaction succeeded — client already released above in catch
    // So manually release here (not in a finally that would double-release)
    client.release();

    // Call PayMongo outside transaction
    try {
        const description = `Downpayment for ${service.name} on ${appointment_date} at ${start_time}`;
        const checkoutSession = await createPayMongoCheckout(
            Number(service.downpayment_amount),
            description,
            customer_email, customer_name, customer_phone,
            newPayment.id,
            newAppointment.management_token
        );

        await PaymentModel.updatePayment(newPayment.id, { paymongo_checkout_id: checkoutSession.id });

        return { appointment: newAppointment, checkout_url: checkoutSession.attributes.checkout_url };
    } catch (paymongoErr: any) {
        await PaymentModel.updatePayment(newPayment.id, { status: 'failed' });
        await AppointmentModel.updateAppointmentStatus(newAppointment.id, 'cancelled');
        if (paymongoErr instanceof AppError) throw paymongoErr;
        throw AppError.badGateway('Booking recorded but failed to initialize payment gateway', paymongoErr.message);
    }
};

export const getManagedBooking = async (token: string): Promise<AppointmentDetails> => {
    const appointment = await AppointmentModel.getAppointmentByManagementToken(token);
    if (!appointment) throw AppError.notFound('Appointment not found');
    if (appointment.status !== 'confirmed') throw AppError.conflict('Only confirmed appointments can be managed');
    return (await AppointmentModel.getAppointmentDetails(appointment.id))!;
};

export const rescheduleBooking = async (
    input: z.infer<typeof RescheduleBookingSchema>
): Promise<AppointmentDetails> => {
    const { token, appointment_date, start_time } = input;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const appointment = await AppointmentModel.getAppointmentByManagementToken(token, client, true);
        if (!appointment) {
            await client.query('ROLLBACK');
            throw AppError.notFound('Appointment not found');
        }
        if (appointment.status !== 'confirmed') {
            await client.query('ROLLBACK');
            throw AppError.conflict('Only confirmed appointments can be managed');
        }

        const service = await ServiceModel.getServiceById(appointment.service_id as string);
        if (!service) {
            await client.query('ROLLBACK');
            throw AppError.notFound('Service not found');
        }

        const end_time = buildEndTime(appointment_date, start_time, service.duration_mins);

        const slotValidation = validateBookableSlot({ appointmentDate: appointment_date, startTime: start_time, durationMins: service.duration_mins });
        if (!slotValidation.valid) {
            await client.query('ROLLBACK');
            throw AppError.badRequest(slotValidation.error!);
        }

        await AppointmentModel.lockBarber(appointment.barber_id as string, client);

        const isAvailable = await AppointmentModel.isSlotAvailable(
            appointment.barber_id as string, appointment_date, start_time, end_time, client, appointment.id
        );
        if (!isAvailable) {
            await client.query('ROLLBACK');
            throw AppError.conflict('The requested time slot is no longer available');
        }

        const updated = await AppointmentModel.updateAppointmentSchedule(
            appointment.id, { appointment_date, start_time, end_time }, client
        );
        await client.query('COMMIT');

        const fullDetails = await AppointmentModel.getAppointmentDetails(updated!.id);
        if (fullDetails) enqueueEmailJob('rescheduleConfirmation', fullDetails);
        return fullDetails!;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
};

export const cancelBooking = async (
    input: z.infer<typeof CancelBookingSchema>
): Promise<AppointmentDetails> => {
    const { token } = input;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const appointment = await AppointmentModel.getAppointmentByManagementToken(token, client, true);
        if (!appointment) {
            await client.query('ROLLBACK');
            throw AppError.notFound('Appointment not found');
        }
        if (appointment.status !== 'confirmed') {
            await client.query('ROLLBACK');
            throw AppError.conflict('Only confirmed appointments can be managed');
        }

        const updated = await AppointmentModel.updateAppointmentStatus(appointment.id, 'cancelled', client);
        await client.query('COMMIT');

        const fullDetails = await AppointmentModel.getAppointmentDetails(updated!.id);
        if (fullDetails) enqueueEmailJob('cancellationConfirmation', fullDetails);
        return fullDetails!;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
};
