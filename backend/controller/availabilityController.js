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

        // 1. Fetch barber's occupied slots from model
        const appointments = await Availability.getOccupiedSlots(barberId, date);

        // 2. Define working hours (Fixed for now: 09:00 to 18:00)
        const START_HOUR = 9;
        const END_HOUR = 18;
        const SLOT_INTERVAL = 30; // 30-minute intervals for start times

        // 3. Determine duration (from service if provided, else default 30 mins)
        let duration = 30;
        if (serviceId) {
            const serviceDuration = await Availability.getServiceDuration(serviceId);
            if (serviceDuration) {
                duration = serviceDuration;
            }
        }

        // 4. Generate possible slots
        const availableSlots = [];
        let current = new Date(`${date}T${String(START_HOUR).padStart(2, '0')}:00:00`);
        const end = new Date(`${date}T${String(END_HOUR).padStart(2, '0')}:00:00`);

        while (current < end) {
            const slotStart = current.toTimeString().substring(0, 5); // "HH:MM"
            const slotEndDate = new Date(current.getTime() + duration * 60000);

            // Check if slot ends after working hours
            if (slotEndDate > end) break;

            const slotEnd = slotEndDate.toTimeString().substring(0, 5);

            // Check for overlaps with existing appointments
            const isOverlap = appointments.some(app => {
                const appStart = app.start_time.substring(0, 5);
                const appEnd = app.end_time.substring(0, 5);

                return (slotStart < appEnd && slotEnd > appStart);
            });

            if (!isOverlap) {
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
