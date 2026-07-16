import * as AvailabilityModel from '../model/availability.model';
import { AvailabilityQuerySchema, AvailabilityQueryInput } from '../validation/availability.validation';

export { AvailabilityQuerySchema, AvailabilityQueryInput };

export interface Slot {
    start: string;
    end: string;
    available: boolean;
    unavailableReason?: 'booked' | 'past';
}

export interface AvailabilityResult {
    barberId: string;
    date: string;
    serviceId?: string;
    duration: number;
    slots: Slot[];
    availableSlots: { start: string; end: string }[];
}

const START_HOUR = 9;
const END_HOUR = 18;
const SLOT_INTERVAL = 30;

export const getAvailability = async (
    query: AvailabilityQueryInput
): Promise<AvailabilityResult> => {

    const { barberId, date, serviceId } = query;

    const [appointments, serviceDuration] = await Promise.all([
        AvailabilityModel.getOccupiedSlots(barberId, date),
        serviceId ? AvailabilityModel.getServiceDuration(serviceId) : Promise.resolve(null)
    ]);

    const duration = serviceDuration || 30;
    const slots: Slot[] = [];
    const availableSlots: { start: string; end: string }[] = [];
    let current = new Date(`${date}T${String(START_HOUR).padStart(2, '0')}:00:00`);
    const end = new Date(`${date}T${String(END_HOUR).padStart(2, '0')}:00:00`);
    const now = new Date();

    while (current < end) {
        const slotStart = current.toTimeString().substring(0, 5);
        const slotEndDate = new Date(current.getTime() + duration * 60000);
        if (slotEndDate > end) break;

        const slotEnd = slotEndDate.toTimeString().substring(0, 5);
        const slotStartDate = new Date(`${date}T${slotStart}:00`);

        const isOverlap = appointments.some(app => {
            const appStart = app.start_time.substring(0, 5);
            const appEnd = app.end_time.substring(0, 5);
            return slotStart < appEnd && slotEnd > appStart;
        });

        const isPast = slotStartDate <= now;
        const isAvailable = !isOverlap && !isPast;

        slots.push({
            start: slotStart,
            end: slotEnd,
            available: isAvailable,
            unavailableReason: isAvailable ? undefined : isPast ? 'past' : 'booked'
        });

        if (isAvailable) availableSlots.push({ start: slotStart, end: slotEnd });

        current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
    }

    return { barberId, date, serviceId, duration, slots, availableSlots };
};
