import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Appointment } from "../../../types";
import {
  formatDate,
  formatOptionalPrice,
  formatTime,
} from "../../../utils/booking";
import ManagementState from "../common/ManagementState";
import BookingDetails from "../common/BookingDetails";

interface Props {
  token: string | null;
  appointment: Appointment | null;
  loadingBooking: boolean;
  bookingError: string | null;
  cancelled: boolean;
  submitting: boolean;
  submitError: string | null;
  onCancelSubmit: (event: FormEvent) => void;
  onRetry?: () => void;
}
const CancelSection = (props: Props) => {
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
  if (props.cancelled)
    return (
      <section className="task-state">
        <div role="status">
          <h1>Your appointment is cancelled.</h1>
          <p className="task-muted">
            The appointment has been cancelled. Your downpayment is not
            refunded. Check your email for the cancellation confirmation.
          </p>
        </div>
        <Link className="task-link" to="/">
          Back to home
        </Link>
      </section>
    );
  const appointment = props.appointment;
  return (
    <section className="task-state">
      <div>
        <h1>Cancel your appointment?</h1>
        <p className="task-muted">
          Review your appointment before cancelling. This action cannot be
          undone.
        </p>
      </div>
      <div className="task-receipt">
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
            { label: "Date", value: formatDate(appointment.appointment_date) },
            { label: "Time", value: formatTime(appointment.start_time) },
            { label: "Name", value: appointment.customer_name },
          ]}
        />
      </div>
      <p className="task-notice error">
        Your downpayment of{" "}
        {formatOptionalPrice(appointment.downpayment_amount)} is forfeited when
        you cancel and will not be refunded. Cancellation requires at least 2
        hours’ notice.
      </p>
      {props.submitError && (
        <p className="task-notice error" role="alert">
          {props.submitError}
        </p>
      )}
      <form
        onSubmit={props.onCancelSubmit}
        className="task-actions"
        aria-busy={props.submitting}
      >
        <button
          className="task-button danger"
          type="submit"
          disabled={props.submitting}
        >
          {props.submitting ? "Cancelling appointment" : "Cancel appointment"}
        </button>
        {props.submitting ? (
          <span className="task-muted" role="status">
            Please wait
          </span>
        ) : (
          <Link className="task-button secondary" to="/">
            Keep my booking
          </Link>
        )}
      </form>
    </section>
  );
};
export default CancelSection;
