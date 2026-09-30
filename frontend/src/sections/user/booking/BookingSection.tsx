import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { useBooking } from "../../../hooks/useBooking";
import {
  formatDate,
  formatPrice,
  formatTime,
  toLocalISODate,
} from "../../../utils/booking";
import BarberServiceStep from "./BarberServiceStep";
import DateTimeStep from "./DateTimeStep";
import ContactStep from "./ContactStep";
import ConfirmStep from "./ConfirmStep";
import BookingDetails from "../common/BookingDetails";

const BookingSection = (booking: ReturnType<typeof useBooking>) => {
  const previousStep = useRef(booking.currentStep);
  useEffect(() => {
    if (previousStep.current === booking.currentStep) return;
    previousStep.current = booking.currentStep;
    document.getElementById("booking-step-heading")?.focus();
  }, [booking.currentStep]);
  const labels = [
    "Barber & service",
    "Date & time",
    "Contact details",
    "Review & pay",
  ];
  return (
    <div className="task-container task-content">
      <div className="task-intro">
        <h1>Make time for a fresh cut.</h1>
        <p>
          Choose your barber, find a time, and book with a downpayment. No
          account needed.
        </p>
      </div>
      {booking.catalogError ? (
        <div className="task-notice error" role="alert">
          <h2>Booking is taking a moment.</h2>
          <p>{booking.catalogError}</p>
          <div className="task-actions">
            <button
              type="button"
              className="task-button"
              onClick={booking.retryCatalog}
            >
              Try again
            </button>
            <Link className="task-link" to="/">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <div className="booking-layout">
          <div className="booking-main">
            <ol className="booking-steps" aria-label="Booking progress">
              {labels.map((label, index) => (
                <li
                  key={label}
                  aria-current={
                    booking.currentStep === index + 1 ? "step" : undefined
                  }
                >
                  <button
                    type="button"
                    disabled={
                      booking.submitting || index + 1 > booking.currentStep
                    }
                    onClick={() => booking.goToStep(index + 1)}
                  >
                    {index + 1}. {label}
                  </button>
                </li>
              ))}
            </ol>
            {booking.currentStep === 1 && (
              <BarberServiceStep
                {...booking}
                onSelectBarber={booking.handleSelectBarber}
                onSelectService={booking.handleSelectService}
              />
            )}
            {booking.currentStep === 2 && (
              <DateTimeStep
                {...booking}
                onSelectDate={(date) =>
                  booking.selectDate(date ? toLocalISODate(date) : "")
                }
                onSelectSlot={booking.selectSlot}
                onRetry={booking.retrySlots}
              />
            )}
            {booking.currentStep === 3 && (
              <ContactStep
                {...booking}
                errors={booking.contactErrors}
                onChangeName={(value) => booking.changeContact("name", value)}
                onChangeEmail={(value) => booking.changeContact("email", value)}
                onChangePhone={(value) => booking.changeContact("phone", value)}
              />
            )}
            {booking.currentStep === 4 &&
              booking.selectedBarber &&
              booking.selectedService &&
              booking.selectedSlot && (
                <ConfirmStep
                  {...booking}
                  selectedBarber={booking.selectedBarber}
                  selectedService={booking.selectedService}
                  selectedSlot={booking.selectedSlot}
                  onEdit={booking.goToStep}
                />
              )}
            {booking.error && (
              <p className="task-notice error" role="alert">
                {booking.error}
              </p>
            )}
            <div className="booking-navigation">
              <button
                type="button"
                className="task-button secondary"
                disabled={booking.currentStep === 1 || booking.submitting}
                onClick={booking.handleBack}
              >
                Back
              </button>
              {booking.currentStep < 4 ? (
                <button
                  type="button"
                  className="task-button"
                  disabled={
                    booking.submitting ||
                    (booking.currentStep !== 3 && !booking.canProceed)
                  }
                  onClick={booking.handleNext}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="task-button"
                  disabled={booking.submitting}
                  onClick={() => void booking.handleSubmitBooking()}
                >
                  {booking.submitting
                    ? "Opening checkout"
                    : "Continue to PayMongo"}
                </button>
              )}
            </div>
            <span className="sr-only" role="status">
              {booking.submitting
                ? "Creating your appointment and opening PayMongo. Please wait."
                : ""}
            </span>
          </div>
          <aside className="booking-summary" aria-label="Appointment summary">
            <h2>Your appointment</h2>
            <BookingDetails
              rows={[
                {
                  label: "Barber",
                  value: booking.selectedBarber?.name ?? "Choose a barber",
                },
                {
                  label: "Service",
                  value: booking.selectedService?.name ?? "Choose a service",
                },
                {
                  label: "Date",
                  value: booking.selectedDate
                    ? formatDate(booking.selectedDate)
                    : "Choose a date",
                },
                {
                  label: "Time",
                  value: booking.selectedSlot
                    ? formatTime(booking.selectedSlot.start)
                    : "Choose a time",
                },
              ]}
            />
            {booking.selectedService && (
              <>
                <p className="task-muted">Downpayment due now</p>
                <p className="task-price">
                  {formatPrice(booking.selectedService.downpayment_amount)}
                </p>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
export default BookingSection;
