const transporter = require('../config/email');
require('dotenv').config();

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
        management_token
    } = appointment;

    // Use ngrok URL for now or a placeholder if not set
    const baseUrl = process.env.FRONTEND_URL;
    const manageUrl = `${baseUrl}/manage-booking?token=${management_token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: customer_email,
        subject: 'Booking Confirmed - Barber Booking System',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #333;">Booking Confirmed!</h2>
                <p>Hello ${customer_name},</p>
                <p>Your appointment has been successfully confirmed. We look forward to seeing you!</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Barber:</strong> ${barber_name}</p>
                    <p><strong>Service:</strong> ${service_name}</p>
                    <p><strong>Date:</strong> ${appointment_date}</p>
                    <p><strong>Time:</strong> ${start_time}</p>
                </div>
                
                <p>If you need to reschedule or cancel your booking, you can manage it here:</p>
                <p><a href="${manageUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Booking</a></p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
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

module.exports = {
    sendConfirmationEmail
};
