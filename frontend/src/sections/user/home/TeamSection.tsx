import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Barber } from "../../../types";
import { preloadBookingRoute } from "../../../routes/lazyRoutes";
import { getBarberInitials } from "./teamUtils";

interface TeamSectionProps {
  loading?: boolean;
  barbers: Barber[];
  error?: string | null;
  preview?: boolean;
}

const TeamSection = ({
  loading = false,
  barbers,
  error = null,
  preview = false,
}: TeamSectionProps) => (
  <section
    id="team"
    className="landing-section landing-container"
    aria-labelledby="team-title"
  >
    <div className="landing-team-layout">
      <div className="landing-section-heading">
        <h2 id="team-title">
          Your chair.
          <br />
          Your choice.
        </h2>
        <p>
          Choose a barber, explore their services, and find a time that works
          for you.
        </p>
        {preview && (
          <p className="landing-demo-note">
            Demo roster. Booking uses the live shop catalog.
          </p>
        )}
      </div>
      <div className="landing-roster" aria-busy={loading}>
        {loading ? (
          <div className="landing-skeleton-list" role="status">
            <span className="sr-only">Loading barbers</span>
            {[0, 1].map((item) => (
              <div className="landing-skeleton-row" key={item}>
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="landing-roster-message">
            The team will appear when the live catalog is available. Use Try
            Again in the services section to reload.
          </p>
        ) : barbers.length === 0 ? (
          <p className="landing-roster-message">
            No barbers are currently available. Check back soon.
          </p>
        ) : (
          <ul>
            {barbers.map((barber) => (
              <li key={barber.id}>
                <span className="landing-initials" aria-hidden="true">
                  {getBarberInitials(barber.name)}
                </span>
                <div className="landing-barber-name">
                  <h3>{barber.name}</h3>
                  <span>Barber</span>
                </div>
                <Link
                  to={
                    preview
                      ? "/book"
                      : "/book?barberId=" + encodeURIComponent(barber.id)
                  }
                  className="landing-barber-link"
                  onMouseEnter={preloadBookingRoute}
                  onFocus={preloadBookingRoute}
                  aria-label={
                    preview ? "Open booking" : "Book with " + barber.name
                  }
                >
                  {preview ? "Book Now" : "Book"}{" "}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </section>
);

export default TeamSection;
