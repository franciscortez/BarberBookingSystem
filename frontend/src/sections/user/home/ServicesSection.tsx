import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { preloadBookingRoute } from "../../../routes/lazyRoutes";
import { formatPrice, parseAmount } from "../../../utils/booking";
import {
  formatPriceRange,
  normalizeBarberName,
  type GroupedService,
} from "./servicesUtils";

interface ServicesSectionProps {
  loading?: boolean;
  error?: string | null;
  groupedServices: GroupedService[];
  onRetry?: () => void;
  preview?: boolean;
}

const ServicesSection = ({
  loading = false,
  error = null,
  groupedServices,
  onRetry,
  preview = false,
}: ServicesSectionProps) => (
  <section
    id="services"
    className="landing-section landing-container"
    aria-labelledby="services-title"
  >
    <div className="landing-section-heading">
      <h2 id="services-title">Find your next service.</h2>
      <p>
        A fresh cut or a finishing touch. Explore the menu and compare prices by
        barber.
      </p>
      {preview && (
        <p className="landing-demo-note">
          Sample menu for preview. Prices and services are illustrative.
        </p>
      )}
    </div>
    <div className="landing-menu" aria-busy={loading}>
      {loading ? (
        <div className="landing-skeleton-list" role="status">
          <span className="sr-only">Loading services</span>
          {[0, 1, 2].map((item) => (
            <div className="landing-skeleton-row" key={item}>
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="landing-catalog-message" role="status">
          <h3>The menu is taking a moment.</h3>
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              className="landing-button landing-button-outline"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
        </div>
      ) : groupedServices.length === 0 ? (
        <div className="landing-catalog-message" role="status">
          <h3>No services available right now.</h3>
          <p>Check back soon for the latest menu.</p>
        </div>
      ) : (
        groupedServices.map((group) => (
          <details className="landing-service" key={group.name}>
            <summary>
              <span className="landing-service-copy">
                <span className="landing-service-name">{group.name}</span>
                <span className="landing-service-description">
                  {group.description ||
                    "Choose your barber to see service details."}
                </span>
              </span>
              <span className="landing-service-price">
                {formatPriceRange(group.minPrice, group.maxPrice)}
                <span>Pricing by barber</span>
              </span>
              <Plus
                className="landing-service-expand"
                size={20}
                aria-hidden="true"
              />
            </summary>
            <div className="landing-service-details">
              <p className="landing-menu-help">
                Your total and downpayment depend on the barber you choose.
              </p>
              <ul>
                {group.services.map((service) => (
                  <li key={service.id}>
                    <div>
                      <strong>
                        {normalizeBarberName(service.barber_name)}
                      </strong>
                      <span>
                        {service.duration_mins} min ·{" "}
                        {formatPrice(parseAmount(service.downpayment_amount))}{" "}
                        downpayment
                      </span>
                    </div>
                    <span className="landing-service-total">
                      {formatPrice(parseAmount(service.total_price))}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/book"
                className="landing-text-link"
                onMouseEnter={preloadBookingRoute}
                onFocus={preloadBookingRoute}
              >
                Book Now <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </details>
        ))
      )}
    </div>
  </section>
);

export default ServicesSection;
