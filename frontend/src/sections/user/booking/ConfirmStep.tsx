import type { Barber, Service } from "../../../types";
import {
  formatDate,
  formatPrice,
  formatTime,
  parseAmount,
} from "../../../utils/booking";
import BookingDetails from "../common/BookingDetails";

interface Props {
  selectedBarber: Barber;
  selectedService: Service;
  selectedDate: string;
  selectedSlot: { start: string; end: string };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onEdit?: (step: number) => void;
  submitting?: boolean;
}
const ConfirmStep = (props: Props) => (
  <div className="booking-step">
    <h2 id="booking-step-heading" tabIndex={-1} className="booking-step-title">
      Review your appointment
    </h2>
    <div className="booking-review">
      <section className="booking-review-group">
        <div className="booking-review-heading">
          <h3>Barber and service</h3>
          <button
            type="button"
            disabled={props.submitting}
            onClick={() => props.onEdit?.(1)}
          >
            Edit selection
          </button>
        </div>
        <BookingDetails
          rows={[
            { label: "Barber", value: props.selectedBarber.name },
            { label: "Service", value: props.selectedService.name },
            {
              label: "Duration",
              value: props.selectedService.duration_mins + " minutes",
            },
          ]}
        />
      </section>
      <section className="booking-review-group">
        <div className="booking-review-heading">
          <h3>Date and time</h3>
          <button
            type="button"
            disabled={props.submitting}
            onClick={() => props.onEdit?.(2)}
          >
            Edit date and time
          </button>
        </div>
        <BookingDetails
          rows={[
            { label: "Date", value: formatDate(props.selectedDate) },
            {
              label: "Time",
              value:
                formatTime(props.selectedSlot.start) +
                " - " +
                formatTime(props.selectedSlot.end),
            },
          ]}
        />
      </section>
      <section className="booking-review-group">
        <div className="booking-review-heading">
          <h3>Contact details</h3>
          <button
            type="button"
            disabled={props.submitting}
            onClick={() => props.onEdit?.(3)}
          >
            Edit contact details
          </button>
        </div>
        <BookingDetails
          rows={[
            { label: "Name", value: props.customerName },
            { label: "Email", value: props.customerEmail },
            { label: "Phone", value: props.customerPhone },
          ]}
        />
      </section>
      <BookingDetails
        rows={[
          {
            label: "Total",
            value: formatPrice(props.selectedService.total_price),
          },
          {
            label: "Downpayment due now",
            value: formatPrice(props.selectedService.downpayment_amount),
          },
          {
            label: "Remaining balance",
            value: formatPrice(
              parseAmount(props.selectedService.total_price) -
                parseAmount(props.selectedService.downpayment_amount),
            ),
          },
        ]}
      />
      <p className="task-notice">
        PayMongo processes your downpayment. Your booking is confirmed after
        payment is verified. Downpayments are non-refundable.
      </p>
    </div>
  </div>
);
export default ConfirmStep;
