jest.mock('../config/email', () => ({
    sendMail: jest.fn(() => Promise.resolve())
}));

const transporter = require('../config/email');
const {
    sendConfirmationEmail,
    sendRescheduleConfirmationEmail,
    sendCancellationConfirmationEmail
} = require('../utils/emailService');

describe('Email service booking management content', () => {
    const appointment = {
        customer_email: 'customer@example.com',
        customer_name: 'Customer',
        barber_name: 'Test Barber',
        service_name: 'Haircut',
        appointment_date: '2027-01-02',
        start_time: '11:00:00',
        management_token: '550e8400-e29b-41d4-a716-446655440099'
    };

    beforeAll(() => {
        process.env.FRONTEND_URL = 'https://frontend.example.com';
        process.env.EMAIL_FROM = 'bookings@example.com';
    });

    beforeEach(() => {
        transporter.sendMail.mockClear();
    });

    it('includes direct reschedule and cancel links in the confirmation email', async () => {
        await sendConfirmationEmail(appointment);

        const mailOptions = transporter.sendMail.mock.calls[0][0];
        expect(mailOptions.html).toContain('https://frontend.example.com/reschedule-booking?token=550e8400-e29b-41d4-a716-446655440099');
        expect(mailOptions.html).toContain('https://frontend.example.com/cancel-booking?token=550e8400-e29b-41d4-a716-446655440099');
    });

    it('includes direct management links in the reschedule confirmation email', async () => {
        await sendRescheduleConfirmationEmail(appointment);

        const mailOptions = transporter.sendMail.mock.calls[0][0];
        expect(mailOptions.subject).toBe('Booking Rescheduled - Barber Booking System');
        expect(mailOptions.html).toContain('https://frontend.example.com/reschedule-booking?token=550e8400-e29b-41d4-a716-446655440099');
        expect(mailOptions.html).toContain('https://frontend.example.com/cancel-booking?token=550e8400-e29b-41d4-a716-446655440099');
    });

    it('states that cancellation does not refund the down payment', async () => {
        await sendCancellationConfirmationEmail(appointment);

        const mailOptions = transporter.sendMail.mock.calls[0][0];
        expect(mailOptions.subject).toBe('Booking Cancelled - Barber Booking System');
        expect(mailOptions.html).toContain('cancellation does not refund the down payment');
    });
});
