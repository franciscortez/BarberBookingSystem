import { Link } from "react-router-dom";
import type { useBookingStatus } from "../../../hooks/useBookingStatus";
import {
  formatDate,
  formatOptionalPrice,
  formatTime,
} from "../../../utils/booking";
import BookingDetails from "../common/BookingDetails";

const SuccessSection = (props: ReturnType<typeof useBookingStatus>) => {
  const result = props.result;
  if (props.noToken || props.status === "invalid")
    return (
      <section className="task-state">
        <div>
          <h1>We couldn’t find this booking.</h1>
          <p className="task-muted">
            Use the link from your payment checkout or confirmation email. If
            you have paid, check your email for the receipt.
          </p>
        </div>
        <Link className="task-link" to="/">
          Back to home
        </Link>
      </section>
    );
  if (props.status === "delayed")
    return (
      <section className="task-state">
        <div>
          <h1>Confirmation is taking longer.</h1>
          <p className="task-muted">
            We haven’t verified your booking yet. Your payment may still be
            processing. Check your email or try checking again.
          </p>
        </div>
        <div className="task-actions">
          <button type="button" className="task-button" onClick={props.retry}>
            Check again
          </button>
          <Link className="task-link" to="/">
            Back to home
          </Link>
        </div>
      </section>
    );
  if (props.status === "verifying" || !result)
    return (
      <section className="task-state" aria-busy="true">
        <div role="status">
          <h1>Checking your booking.</h1>
          <p className="task-muted">
            We’re waiting for payment verification before confirming your
            appointment.
          </p>
        </div>
        <div className="task-skeleton" aria-hidden="true" />
        <div className="task-skeleton" aria-hidden="true" />
      </section>
    );
  const appointment = result.appointment;
  const failed =
    result.payment_status === "failed" || appointment.status === "cancelled";
  const title = failed
    ? "This appointment is not confirmed."
    : appointment.status === "completed"
      ? "Your appointment is complete."
      : appointment.status === "no_show"
        ? "Your appointment was marked no-show."
        : appointment.status === "checked_in"
          ? "You’re checked in."
          : "Your booking is confirmed.";
  return (
    <section className="task-state">
      <div role="status">
        <h1>{title}</h1>
        <p className="task-muted">
          {failed
            ? result.payment_status === "paid"
              ? "Payment was received, but this appointment is cancelled. Keep your payment receipt."
              : "This booking was cancelled or its payment failed."
            : "Your downpayment has been verified. Here are your appointment details."}
        </p>
      </div>
      <div className="task-receipt">
        <BookingDetails
          rows={[
            { label: "Status", value: appointment.status.replaceAll("_", " ") },
            {
              label: "Barber",
              value: appointment.barber_name ?? "Not available",
            },
            {
              label: "Service",
              value: appointment.service_name ?? "Not available",
            },
            { label: "Date", value: formatDate(appointment.appointment_date) },
            {
              label: "Time",
              value:
                formatTime(appointment.start_time) +
                " - " +
                formatTime(appointment.end_time),
            },
            { label: "Name", value: appointment.customer_name },
            {
              label: "Payment reference",
              value: appointment.payment_reference_number ?? "Not available",
            },
            {
              label:
                result.payment_status === "paid"
                  ? "Downpayment paid"
                  : "Downpayment",
              value: formatOptionalPrice(appointment.downpayment_amount),
            },
          ]}
        />
      </div>
      {!failed && (
        <p className="task-notice">
          Check {appointment.customer_email} for confirmation and management
          links. No sign-in is required. Cancellation and rescheduling require
          at least 2 hours’ notice.
        </p>
      )}
      <Link className="task-link" to="/">
        Back to home
      </Link>
    </section>
  );
};
export default SuccessSection;
