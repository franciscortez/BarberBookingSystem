const Availability = require('../model/Availability');

/**
 * Get available time slots for a barber on a specific date
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAvailability = async (req, res) => {
    try {
        const { barberId, date, serviceId } = req.query;

        if (!barberId || !date) {
            return res.status(400).json({ error: 'barberId and date are required' });
        }

        // 1. Define working hours (Fixed for now: 09:00 to 18:00)
        const START_HOUR = 9;
        const END_HOUR = 18;
        const SLOT_INTERVAL = 30; // 30-minute intervals for start times

        // 2. Fetch occupied slots and requested service duration concurrently.
        const [appointments, serviceDuration] = await Promise.all([
            Availability.getOccupiedSlots(barberId, date),
            serviceId ? Availability.getServiceDuration(serviceId) : Promise.resolve(null)
        ]);

        // 3. Determine duration (from service if provided, else default 30 mins)
        const duration = serviceDuration || 30;

        // 4. Generate possible slots
        const availableSlots = [];
        const slots = [];
        let current = new Date(`${date}T${String(START_HOUR).padStart(2, '0')}:00:00`);
        const end = new Date(`${date}T${String(END_HOUR).padStart(2, '0')}:00:00`);
        const now = new Date();

        while (current < end) {
            const slotStart = current.toTimeString().substring(0, 5); // "HH:MM"
            const slotEndDate = new Date(current.getTime() + duration * 60000);

            // Check if slot ends after working hours
            if (slotEndDate > end) break;

            const slotEnd = slotEndDate.toTimeString().substring(0, 5);
            const slotStartDate = new Date(`${date}T${slotStart}:00`);

            // Check for overlaps with existing appointments
            const isOverlap = appointments.some(app => {
                const appStart = app.start_time.substring(0, 5);
                const appEnd = app.end_time.substring(0, 5);

                return (slotStart < appEnd && slotEnd > appStart);
            });

            const isPast = slotStartDate <= now;
            const isAvailable = !isOverlap && !isPast;

            slots.push({
                start: slotStart,
                end: slotEnd,
                available: isAvailable,
                unavailableReason: isAvailable ? undefined : isPast ? 'past' : 'booked'
            });

            if (isAvailable) {
                availableSlots.push({
                    start: slotStart,
                    end: slotEnd
                });
            }

            // Move to next interval
            current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
        }

        res.json({
            barberId,
            date,
            serviceId: serviceId,
            duration,
            slots,
            availableSlots
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching availability' });
    }
};

module.exports = {
    getAvailability
};
