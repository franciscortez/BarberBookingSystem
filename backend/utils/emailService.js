const transporter = require('../config/email');
require('dotenv').config();

const buildFrontendUrl = (path) => {
    const baseUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
    return `${baseUrl}${path}`;
};

const escapeHtml = (value) => {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
};

const buildManagementUrls = (managementToken) => {
    const encodedToken = encodeURIComponent(managementToken);

    return {
        rescheduleUrl: buildFrontendUrl(`/reschedule-booking?token=${encodedToken}`),
        cancelUrl: buildFrontendUrl(`/cancel-booking?token=${encodedToken}`)
    };
};

/**
 * Send booking confirmation email
 * @param {Object} appointment - Full appointment details
 */
const sendConfirmationEmail = async (appointment) => {
    const {
        customer_email,
        customer_name,
        barber_name,
        service_name,
        appointment_date,
        start_time,
        payment_reference_number,
        management_token
    } = appointment;

    const { rescheduleUrl, cancelUrl } = buildManagementUrls(management_token);
    const safeCustomerName = escapeHtml(customer_name);
    const safeBarberName = escapeHtml(barber_name);
    const safeServiceName = escapeHtml(service_name);
    const safeAppointmentDate = escapeHtml(appointment_date);
    const safeStartTime = escapeHtml(start_time);
    const safePaymentReferenceNumber = payment_reference_number ? escapeHtml(payment_reference_number) : 'N/A';

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: customer_email,
        subject: 'Booking Confirmed - Gentlemen\'s Quarters',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #fbbf24; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Gentlemen's Quarters</h1>
                </div>
                
                <h2 style="color: #fafafa; font-size: 22px; margin-top: 0;">Booking Confirmed!</h2>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Hello ${safeCustomerName},</p>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Your downpayment has been verified and your premium grooming session has been successfully secured. We look forward to seeing you.</p>
                
                <div style="background-color: #18181b; padding: 25px; border-radius: 8px; border: 1px solid #27272a; margin: 30px 0;">
                    <h3 style="color: #fbbf24; margin-top: 0; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reservation Details</h3>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Barber:</strong> ${safeBarberName}</p>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Service:</strong> ${safeServiceName}</p>
                    <p style="margin: 10px 0; color: #fbbf24;"><strong style="color: #71717a; display: inline-block; width: 100px;">Date:</strong> ${safeAppointmentDate}</p>
                    <p style="margin: 10px 0; color: #fbbf24;"><strong style="color: #71717a; display: inline-block; width: 100px;">Time:</strong> ${safeStartTime}</p>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Reference:</strong> ${safePaymentReferenceNumber}</p>
                </div>
                
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px; margin-bottom: 20px;">If you need to adjust your schedule, please use your secure management links below:</p>
                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${rescheduleUrl}" style="background: linear-gradient(to right, #fbbf24, #f59e0b); color: #09090b; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 5px; font-size: 15px;">Reschedule Booking</a>
                    <a href="${cancelUrl}" style="background-color: transparent; border: 1px solid #3f3f46; color: #d4d4d8; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 5px; font-size: 15px;">Cancel Booking</a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;">
                <p style="font-size: 12px; color: #71717a; text-align: center;">This is an automated message from Gentlemen's Quarters. Please do not reply directly to this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to: ${customer_email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // We don't throw error here to avoid breaking the webhook flow if email fails
    }
};

/**
 * Send booking reschedule confirmation email
 * @param {Object} appointment - Full appointment details
 */
const sendRescheduleConfirmationEmail = async (appointment) => {
    const {
        customer_email,
        customer_name,
        barber_name,
        service_name,
        appointment_date,
        start_time,
        management_token
    } = appointment;
    const { rescheduleUrl, cancelUrl } = buildManagementUrls(management_token);
    const safeCustomerName = escapeHtml(customer_name);
    const safeBarberName = escapeHtml(barber_name);
    const safeServiceName = escapeHtml(service_name);
    const safeAppointmentDate = escapeHtml(appointment_date);
    const safeStartTime = escapeHtml(start_time);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: customer_email,
        subject: 'Booking Rescheduled - Gentlemen\'s Quarters',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #fbbf24; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Gentlemen's Quarters</h1>
                </div>
                
                <h2 style="color: #fafafa; font-size: 22px; margin-top: 0;">Booking Rescheduled</h2>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Hello ${safeCustomerName},</p>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Your appointment has been successfully rescheduled. Your new date and time are confirmed.</p>
                
                <div style="background-color: #18181b; padding: 25px; border-radius: 8px; border: 1px solid #27272a; margin: 30px 0;">
                    <h3 style="color: #fbbf24; margin-top: 0; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Updated Details</h3>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Barber:</strong> ${safeBarberName}</p>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Service:</strong> ${safeServiceName}</p>
                    <p style="margin: 10px 0; color: #fbbf24;"><strong style="color: #71717a; display: inline-block; width: 100px;">Date:</strong> ${safeAppointmentDate}</p>
                    <p style="margin: 10px 0; color: #fbbf24;"><strong style="color: #71717a; display: inline-block; width: 100px;">Time:</strong> ${safeStartTime}</p>
                </div>
                
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px; margin-bottom: 20px;">If you need to make further adjustments, please use your secure management links below:</p>
                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${rescheduleUrl}" style="background: linear-gradient(to right, #fbbf24, #f59e0b); color: #09090b; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 5px; font-size: 15px;">Reschedule Again</a>
                    <a href="${cancelUrl}" style="background-color: transparent; border: 1px solid #3f3f46; color: #d4d4d8; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 5px; font-size: 15px;">Cancel Booking</a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;">
                <p style="font-size: 12px; color: #71717a; text-align: center;">This is an automated message from Gentlemen's Quarters. Please do not reply directly to this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reschedule confirmation email sent to: ${customer_email}`);
    } catch (error) {
        console.error('Error sending reschedule confirmation email:', error);
    }
};

/**
 * Send booking cancellation confirmation email
 * @param {Object} appointment - Full appointment details
 */
const sendCancellationConfirmationEmail = async (appointment) => {
    const {
        customer_email,
        customer_name,
        barber_name,
        service_name,
        appointment_date,
        start_time
    } = appointment;
    const safeCustomerName = escapeHtml(customer_name);
    const safeBarberName = escapeHtml(barber_name);
    const safeServiceName = escapeHtml(service_name);
    const safeAppointmentDate = escapeHtml(appointment_date);
    const safeStartTime = escapeHtml(start_time);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: customer_email,
        subject: 'Booking Cancelled - Gentlemen\'s Quarters',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #fbbf24; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Gentlemen's Quarters</h1>
                </div>
                
                <h2 style="color: #ef4444; font-size: 22px; margin-top: 0;">Booking Cancelled</h2>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Hello ${safeCustomerName},</p>
                <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">This email confirms that your appointment has been permanently cancelled.</p>
                
                <div style="background-color: #18181b; padding: 25px; border-radius: 8px; border: 1px solid #450a0a; margin: 30px 0;">
                    <h3 style="color: #ef4444; margin-top: 0; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Cancelled Reservation</h3>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Barber:</strong> ${safeBarberName}</p>
                    <p style="margin: 10px 0; color: #d4d4d8;"><strong style="color: #71717a; display: inline-block; width: 100px;">Service:</strong> ${safeServiceName}</p>
                    <p style="margin: 10px 0; color: #ef4444; text-decoration: line-through;"><strong style="color: #71717a; display: inline-block; width: 100px; text-decoration: none;">Date:</strong> ${safeAppointmentDate}</p>
                    <p style="margin: 10px 0; color: #ef4444; text-decoration: line-through;"><strong style="color: #71717a; display: inline-block; width: 100px; text-decoration: none;">Time:</strong> ${safeStartTime}</p>
                </div>
                
                <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px;">
                    <p style="color: #f87171; line-height: 1.6; font-size: 14px; margin: 0;"><strong>Please Note:</strong> As per our policy, the downpayment for this reservation is non-refundable and has been forfeited.</p>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;">
                <p style="font-size: 12px; color: #71717a; text-align: center;">This is an automated message from Gentlemen's Quarters. Please do not reply directly to this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Cancellation confirmation email sent to: ${customer_email}`);
    } catch (error) {
        console.error('Error sending cancellation confirmation email:', error);
    }
};

module.exports = {
    sendConfirmationEmail,
    sendRescheduleConfirmationEmail,
    sendCancellationConfirmationEmail
};
