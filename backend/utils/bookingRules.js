const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPendingHoldMinutes = () => parsePositiveInt(process.env.BOOKING_PENDING_HOLD_MINUTES, 15);
const WORK_DAY_START_MINUTES = 9 * 60;
const WORK_DAY_END_MINUTES = 18 * 60;
const SLOT_INTERVAL_MINUTES = 30;

const activeAppointmentStatusSql = (paramRef, alias = '') => {
    const prefix = alias ? `${alias}.` : '';

    return `(
        ${prefix}status = 'confirmed'
        OR (
            ${prefix}status = 'pending'
            AND ${prefix}created_at > CURRENT_TIMESTAMP - (${paramRef} * INTERVAL '1 minute')
        )
    )`;
};

const timeStringToParts = (time) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(time);
    if (!match) {
        return null;
    }

    return {
        hours: Number(match[1]),
        minutes: Number(match[2]),
        seconds: match[3] ? Number(match[3]) : 0
    };
};

const validateBookableSlot = ({ appointmentDate, startTime, durationMins, now = new Date() }) => {
    const timeParts = timeStringToParts(startTime);
    if (!timeParts) {
        return { valid: false, error: 'Invalid appointment date or start time' };
    }

    if (timeParts.seconds !== 0) {
        return { valid: false, error: 'Appointment start time must use a 30-minute slot' };
    }

    const startMinutes = timeParts.hours * 60 + timeParts.minutes;
    if (startMinutes % SLOT_INTERVAL_MINUTES !== 0) {
        return { valid: false, error: 'Appointment start time must use a 30-minute slot' };
    }

    const endMinutes = startMinutes + Number(durationMins);
    if (startMinutes < WORK_DAY_START_MINUTES || endMinutes > WORK_DAY_END_MINUTES) {
        return { valid: false, error: 'Appointment must fit within working hours' };
    }

    const normalizedStartTime = `${String(timeParts.hours).padStart(2, '0')}:${String(timeParts.minutes).padStart(2, '0')}:00`;
    const startDateTime = new Date(`${appointmentDate}T${normalizedStartTime}`);
    if (Number.isNaN(startDateTime.getTime())) {
        return { valid: false, error: 'Invalid appointment date or start time' };
    }

    if (startDateTime <= now) {
        return { valid: false, error: 'Appointment start time must be in the future' };
    }

    return { valid: true };
};

module.exports = {
    getPendingHoldMinutes,
    activeAppointmentStatusSql,
    WORK_DAY_START_MINUTES,
    WORK_DAY_END_MINUTES,
    SLOT_INTERVAL_MINUTES,
    validateBookableSlot
};
