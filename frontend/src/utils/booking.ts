export type SlotOption = {
  start: string;
  end: string;
  available: boolean;
  unavailableReason?: 'booked' | 'past';
};

export const parseAmount = (price: number | string): number => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return Number.isFinite(num) ? num : 0;
};

export const formatPrice = (price: number | string): string => {
  const num = parseAmount(price);
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
};

export const formatDate = (dateStr: string, includeWeekday = false): string => {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    ...(includeWeekday ? { weekday: 'long' as const } : {}),
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalISODate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getStartOfToday = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

export const buildSlotOptions = (
  date: string,
  duration: number,
  slots: { start: string; end: string; available?: boolean; unavailableReason?: 'booked' | 'past' }[]
): SlotOption[] => {
  const START_HOUR = 9;
  const END_HOUR = 18;
  const SLOT_INTERVAL = 30;
  const hasAvailabilityMetadata = slots.some(slot => typeof slot.available === 'boolean');

  if (hasAvailabilityMetadata) {
    return slots.map(slot => ({
      start: slot.start.substring(0, 5),
      end: slot.end.substring(0, 5),
      available: Boolean(slot.available),
      unavailableReason: slot.unavailableReason
    }));
  }

  const availableStarts = new Set(slots.map(slot => slot.start.substring(0, 5)));
  const options: SlotOption[] = [];
  let current = new Date(`${date}T${String(START_HOUR).padStart(2, '0')}:00:00`);
  const end = new Date(`${date}T${String(END_HOUR).padStart(2, '0')}:00:00`);
  const now = new Date();

  while (current < end) {
    const slotStart = current.toTimeString().substring(0, 5);
    const slotEndDate = new Date(current.getTime() + duration * 60000);

    if (slotEndDate > end) break;

    const slotEnd = slotEndDate.toTimeString().substring(0, 5);
    const slotStartDate = new Date(`${date}T${slotStart}:00`);
    const isPast = slotStartDate <= now;
    const isAvailableFromServer = availableStarts.has(slotStart);

    options.push({
      start: slotStart,
      end: slotEnd,
      available: isAvailableFromServer && !isPast,
      unavailableReason: isPast ? 'past' : isAvailableFromServer ? undefined : 'booked'
    });

    current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
  }

  return options;
};
