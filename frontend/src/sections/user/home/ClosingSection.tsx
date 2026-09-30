import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { preloadBookingRoute } from "../../../routes/lazyRoutes";

const ClosingSection = () => (
  <section
    className="landing-closing landing-container"
    aria-labelledby="closing-title"
  >
    <h2 id="closing-title">
      Your next cut
      <br />
      starts here.
    </h2>
    <div>
      <p>Choose your service. Make time for yourself.</p>
      <Link
        to="/book"
        className="landing-button"
        onMouseEnter={preloadBookingRoute}
        onFocus={preloadBookingRoute}
      >
        Book Now <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </div>
  </section>
);

export default ClosingSection;
