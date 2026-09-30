import type { useBooking } from "../../../hooks/useBooking";
import { formatPrice, parseAmount } from "../../../utils/booking";
import { getBarberInitials } from "../home/teamUtils";

type Props = Pick<
  ReturnType<typeof useBooking>,
  | "barbers"
  | "loadingBarbers"
  | "loadingServices"
  | "selectedBarber"
  | "selectedService"
  | "servicesByBarber"
  | "visibleServiceGroups"
> & {
  onSelectBarber: ReturnType<typeof useBooking>["handleSelectBarber"];
  onSelectService: ReturnType<typeof useBooking>["handleSelectService"];
};

const BarberServiceStep = (props: Props) => (
  <div className="booking-step">
    <h2 id="booking-step-heading" tabIndex={-1} className="booking-step-title">
      Choose your barber and service
    </h2>
    <p className="task-muted">
      Select a barber, or choose a service to select its barber.
    </p>
    <div className="booking-choices">
      <fieldset className="booking-choice-group">
        <legend>Barber</legend>
        <div className="booking-choice-list" aria-busy={props.loadingBarbers}>
          {props.loadingBarbers ? (
            <>
              <p role="status" className="sr-only">
                Loading barbers
              </p>
              <div className="task-skeleton" />
              <div className="task-skeleton" />
            </>
          ) : props.barbers.length === 0 ? (
            <p className="task-notice">
              No barbers are accepting bookings right now.
            </p>
          ) : (
            props.barbers.map((barber) => (
              <button
                type="button"
                key={barber.id}
                className="booking-option booking-barber"
                aria-pressed={props.selectedBarber?.id === barber.id}
                onClick={() => props.onSelectBarber(barber)}
              >
                <span className="booking-initials" aria-hidden="true">
                  {getBarberInitials(barber.name)}
                </span>
                <span>
                  <strong>{barber.name}</strong>
                  <span className="task-muted">
                    {" "}
                    · {props.servicesByBarber.get(barber.id)?.length ?? 0}{" "}
                    {(props.servicesByBarber.get(barber.id)?.length ?? 0) === 1
                      ? "service"
                      : "services"}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </fieldset>
      <fieldset className="booking-choice-group">
        <legend>Service</legend>
        <div className="booking-choice-list" aria-busy={props.loadingServices}>
          {props.loadingServices ? (
            <>
              <p role="status" className="sr-only">
                Loading services
              </p>
              <div className="task-skeleton" />
              <div className="task-skeleton" />
            </>
          ) : props.visibleServiceGroups.length === 0 ? (
            <p className="task-notice">
              {props.selectedBarber
                ? "This barber has no services available. Please choose another barber."
                : "No services are available right now."}
            </p>
          ) : (
            props.visibleServiceGroups.map((group) => (
              <div className="booking-service-group" key={group.barber.id}>
                {!props.selectedBarber && <h3>{group.barber.name}</h3>}
                {group.services.map((service) => (
                  <button
                    type="button"
                    className="booking-option"
                    key={service.id}
                    aria-pressed={props.selectedService?.id === service.id}
                    onClick={() => props.onSelectService(service)}
                  >
                    <strong>{service.name}</strong>
                    {service.description && (
                      <span className="booking-option-description">
                        {service.description}
                      </span>
                    )}
                    <span className="booking-option-meta">
                      <span>{service.duration_mins} min</span>
                      <span>
                        Total{" "}
                        <strong>{formatPrice(service.total_price)}</strong>
                      </span>
                      <span>
                        Due now{" "}
                        <strong>
                          {formatPrice(service.downpayment_amount)}
                        </strong>
                      </span>
                    </span>
                    <span className="task-muted">
                      Remaining after downpayment:{" "}
                      {formatPrice(
                        parseAmount(service.total_price) -
                          parseAmount(service.downpayment_amount),
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </fieldset>
    </div>
    <p className="task-notice">
      Downpayments are non-refundable. Review your selection before payment.
    </p>
  </div>
);
export default BarberServiceStep;
