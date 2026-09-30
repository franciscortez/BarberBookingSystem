import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { preloadBookingRoute } from "../../../routes/lazyRoutes";

const HeroSection = () => (
  <section id="home" className="landing-hero" aria-labelledby="hero-title">
    <div className="landing-hero-image">
      <img
        src="/images/landing/interior-1600.jpg"
        srcSet="/images/landing/interior-800.jpg 800w, /images/landing/interior-1600.jpg 1600w"
        sizes="100vw"
        width="1600"
        height="1066"
        alt="An empty leather barber chair in a warmly lit grooming interior"
        fetchPriority="high"
      />
    </div>
    <div className="landing-container landing-hero-content">
      <h1 id="hero-title">
        A cut above.
        <br />
        Time well spent.
      </h1>
      <p>
        Choose your barber, find your service, and book your next visit. No
        account required.
      </p>
      <div className="landing-actions">
        <Link
          to="/book"
          className="landing-button"
          onMouseEnter={preloadBookingRoute}
          onFocus={preloadBookingRoute}
        >
          Book Now <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <a href="#services" className="landing-button landing-button-outline">
          View Services
        </a>
      </div>
    </div>
    <span className="landing-image-note">Illustrative interior</span>
  </section>
);

export default HeroSection;
