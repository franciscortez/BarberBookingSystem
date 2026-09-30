import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { Service } from "../../../types";
import {
  formatDate,
  formatTime,
  getStartOfToday,
  type SlotOption,
} from "../../../utils/booking";

interface Props {
  disabled?: boolean;
  selectedDate: string;
  selectedDateObject: Date | undefined;
  selectedSlot: { start: string; end: string } | null;
  slotOptions: SlotOption[];
  loadingSlots: boolean;
  availabilityError: string | null;
  isSelectedDateFullyBooked: boolean;
  availableSlotCount: number;
  selectedService?: Service | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectSlot: (slot: SlotOption) => void;
  onRetry?: () => void;
}
const DateTimeStep = (props: Props) => (
  <div className="booking-step">
    <h2 id="booking-step-heading" tabIndex={-1} className="booking-step-title">
      Choose a date and time
    </h2>
    <div className="booking-datetime">
      <section className="booking-calendar" aria-label="Appointment date">
        <DayPicker
          mode="single"
          selected={props.selectedDateObject}
          onSelect={props.onSelectDate}
          disabled={props.disabled || { before: getStartOfToday() }}
          weekStartsOn={1}
        />
        {props.selectedDate && (
          <p className="task-muted">
            {formatDate(props.selectedDate)}
            {props.selectedService
              ? " · " +
                props.selectedService.duration_mins +
                "-minute appointment"
              : ""}
          </p>
        )}
      </section>
      <section aria-label="Appointment times" className="booking-step">
        <h3>Available times</h3>
        {!props.selectedDate ? (
          <p className="task-notice">Choose a date to see available times.</p>
        ) : props.loadingSlots ? (
          <div role="status" aria-busy="true">
            <p>Loading available times</p>
            <div className="task-skeleton" />
          </div>
        ) : props.availabilityError ? (
          <div className="task-notice error" role="alert">
            <p>{props.availabilityError}</p>
            {props.onRetry && (
              <button
                type="button"
                className="task-button secondary"
                disabled={props.disabled}
                onClick={props.onRetry}
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <>
            <p role="status" className="task-muted">
              {props.availableSlotCount
                ? props.availableSlotCount +
                  (props.availableSlotCount === 1
                    ? " available time."
                    : " available times.")
                : "No times are available on this date. Choose another date."}
            </p>
            <div className="booking-slots">
              {props.slotOptions.map((slot) => (
                <button
                  type="button"
                  key={slot.start}
                  className="booking-slot"
                  aria-pressed={
                    props.selectedSlot?.start === slot.start && slot.available
                  }
                  disabled={props.disabled || !slot.available}
                  onClick={() => props.onSelectSlot(slot)}
                >
                  <strong>{formatTime(slot.start)}</strong>
                  <span>
                    {slot.available
                      ? "until " + formatTime(slot.end)
                      : slot.unavailableReason === "past"
                        ? "Past"
                        : slot.unavailableReason === "blocked"
                          ? "Blocked"
                          : slot.unavailableReason === "outside_hours"
                            ? "Outside hours"
                            : slot.unavailableReason === "booked"
                              ? "Booked"
                              : "Unavailable"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  </div>
);
export default DateTimeStep;
