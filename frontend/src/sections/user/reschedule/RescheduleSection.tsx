import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Appointment } from "../../../types";
import {
  formatDate,
  formatTime,
  parseLocalISODate,
  type SlotOption,
} from "../../../utils/booking";
import DateTimeStep from "../booking/DateTimeStep";
import BookingDetails from "../common/BookingDetails";
import ManagementState from "../common/ManagementState";

interface Props {
  token: string | null;
  appointment: Appointment | null;
  updatedAppointment: Appointment | null;
  loadingBooking: boolean;
  bookingError: string | null;
  rescheduled: boolean;
  submitting: boolean;
  submitError: string | null;
  selectedDate: string;
  slotOptions: SlotOption[];
  loadingSlots: boolean;
  selectedSlot: { start: string; end: string } | null;
  availabilityError: string | null;
  isSelectedDateFullyBooked: boolean;
  onSelectDate: (date: Date | undefined) => void;
  onSelectSlot: (slot: SlotOption) => void;
  onRescheduleSubmit: (event: FormEvent) => void;
  onRetry?: () => void;
  onRetrySlots?: () => void;
}
const RescheduleSection = (props: Props) => {
  if (
    !props.token ||
    props.loadingBooking ||
    props.bookingError ||
    !props.appointment
  )
    return (
      <ManagementState
        token={props.token}
        loading={props.loadingBooking}
        error={props.bookingError}
        onRetry={props.onRetry}
      />
    );
  if (props.rescheduled && props.updatedAppointment)
    return (
      <section className="task-state">
        <div role="status">
          <h1>Your appointment is rescheduled.</h1>
          <p className="task-muted">
            Your downpayment is preserved. Check your email for the updated
            confirmation.
          </p>
        </div>
        <div className="task-receipt">
          <BookingDetails
            rows={[
              {
                label: "Barber",
                value:
                  props.updatedAppointment.barber_name ??
                  props.appointment.barber_name ??
                  "Not available",
              },
              {
                label: "Service",
                value:
                  props.updatedAppointment.service_name ??
                  props.appointment.service_name ??
                  "Not available",
              },
              {
                label: "New date",
                value: formatDate(props.updatedAppointment.appointment_date),
              },
              {
                label: "New time",
                value: formatTime(props.updatedAppointment.start_time),
              },
            ]}
          />
        </div>
        <Link className="task-link" to="/">
          Back to home
        </Link>
      </section>
    );
  const appointment = props.appointment;
  return (
    <div className="task-container task-content">
      <div className="task-intro">
        <h1>Find a new time.</h1>
        <p>
          Choose another date and time for this appointment. Your downpayment is
          preserved. Rescheduling requires at least 2 hours’ notice.
        </p>
      </div>
      <div className="management-layout">
        <aside className="booking-summary">
          <h2>Current appointment</h2>
          <BookingDetails
            rows={[
              {
                label: "Barber",
                value: appointment.barber_name ?? "Not available",
              },
              {
                label: "Service",
                value: appointment.service_name ?? "Not available",
              },
              {
                label: "Date",
                value: formatDate(appointment.appointment_date),
              },
              { label: "Time", value: formatTime(appointment.start_time) },
            ]}
          />
        </aside>
        <div className="management-main">
          <DateTimeStep
            {...props}
            disabled={props.submitting}
            selectedDateObject={parseLocalISODate(props.selectedDate)}
            availableSlotCount={
              props.slotOptions.filter((slot) => slot.available).length
            }
            onSelectDate={(date) => {
              if (!props.submitting) props.onSelectDate(date);
            }}
            onSelectSlot={(slot) => {
              if (!props.submitting) props.onSelectSlot(slot);
            }}
            onRetry={props.onRetrySlots}
          />
          <form
            onSubmit={props.onRescheduleSubmit}
            className="task-form"
            aria-busy={props.submitting}
          >
            {props.selectedDate && props.selectedSlot && (
              <div className="task-notice">
                <h3>New appointment time</h3>
                <p>
                  {formatDate(props.selectedDate)} at{" "}
                  {formatTime(props.selectedSlot.start)} -{" "}
                  {formatTime(props.selectedSlot.end)}
                </p>
              </div>
            )}
            {props.submitError && (
              <p role="alert" className="task-notice error">
                {props.submitError}
              </p>
            )}
            <button
              type="submit"
              className="task-button"
              disabled={
                props.submitting || !props.selectedDate || !props.selectedSlot
              }
            >
              {props.submitting ? "Updating appointment" : "Confirm reschedule"}
            </button>
            {props.submitting && (
              <p role="status">Please wait while we update your appointment.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
export default RescheduleSection;
