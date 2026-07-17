import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar } from 'lucide-react';
import type { Service } from '../../../types';
import { bookingDayPickerClassNames, bookingDayPickerModifiersClassNames } from '../../../utils/dayPicker';
import {
  formatDate,
  formatTime,
  getStartOfToday,
  toLocalISODate,
  type SlotOption
} from '../../../utils/booking';

interface DateTimeStepProps {
  selectedDate: string;
  selectedDateObject: Date | undefined;
  selectedSlot: { start: string; end: string } | null;
  slotOptions: SlotOption[];
  loadingSlots: boolean;
  availabilityError: string | null;
  isSelectedDateFullyBooked: boolean;
  availableSlotCount: number;
  selectedService: Service | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectSlot: (slot: SlotOption) => void;
}

const DateTimeStep: React.FC<DateTimeStepProps> = ({
  selectedDate,
  selectedDateObject,
  selectedSlot,
  slotOptions,
  loadingSlots,
  availabilityError,
  isSelectedDateFullyBooked,
  availableSlotCount,
  selectedService,
  onSelectDate,
  onSelectSlot,
}) => (
  <div>
    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-amber-400" />
      Select Appointment Date &amp; Time
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Date Picker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pick a Date</label>
          <span className="text-[10px] font-medium text-zinc-500">Today: {formatDate(toLocalISODate(getStartOfToday()))}</span>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <DayPicker
            mode="single"
            selected={selectedDateObject}
            onSelect={onSelectDate}
            disabled={{ before: getStartOfToday() }}
            weekStartsOn={1}
            className="booking-day-picker"
            modifiers={{
              fullyBooked: isSelectedDateFullyBooked ? selectedDateObject : []
            }}
            classNames={bookingDayPickerClassNames}
            modifiersClassNames={bookingDayPickerModifiersClassNames}
          />
        </div>
        {selectedDate && selectedService && (
          <p className="text-xs text-zinc-500 mt-3">
            Showing {selectedService.duration_mins}-minute slots for{' '}
            <span className="text-zinc-300">{formatDate(selectedDate)}</span>
          </p>
        )}
      </div>

      {/* Available Slots */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Available Slots</label>
        {!selectedDate ? (
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm min-h-[180px] flex items-center justify-center">
            Select a date to view available times.
          </div>
        ) : loadingSlots ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="py-2.5 px-2 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse h-11" />
            ))}
          </div>
        ) : availabilityError ? (
          <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-red-300 text-sm">
            {availabilityError}
          </div>
        ) : (
          <div className="space-y-3">
            {isSelectedDateFullyBooked && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                This date has no open slots. Booked and past times are shown with a slash.
              </div>
            )}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-zinc-400">
                {availableSlotCount} available {availableSlotCount === 1 ? 'time' : 'times'} for{' '}
                <span className="font-semibold text-amber-400">{formatDate(selectedDate)}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {slotOptions.map((slot, idx) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <button
                    type="button"
                    key={`${slot.start}-${idx}`}
                    disabled={!slot.available}
                    onClick={() => { if (slot.available) onSelectSlot(slot); }}
                    title={
                      slot.unavailableReason === 'past'
                        ? 'This time has already passed'
                        : slot.unavailableReason === 'booked'
                        ? 'This time is already booked'
                        : 'Available'
                    }
                    className={`relative min-h-14 overflow-hidden py-3 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                        : !slot.available
                        ? 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {!slot.available && (
                      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[145%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] bg-red-500/70" />
                    )}
                    <span className="relative block">{formatTime(slot.start)}</span>
                    <span className="relative mt-0.5 block text-[10px] font-normal opacity-70">
                      {slot.available
                        ? `until ${formatTime(slot.end)}`
                        : slot.unavailableReason === 'past'
                        ? 'Passed'
                        : 'Booked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DateTimeStep;
