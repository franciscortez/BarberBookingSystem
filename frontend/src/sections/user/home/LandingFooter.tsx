import { Link } from "react-router-dom";

const LandingFooter = () => (
  <footer className="landing-footer">
    <div className="landing-container landing-footer-main">
      <a href="#home" className="landing-brand">
        <img src="/favicon.svg" width="36" height="36" alt="" />
        <span>Gentlemen’s Quarters</span>
      </a>
      <nav aria-label="Footer navigation">
        <a href="#home">Home</a>
        <a href="#services">Services</a>
        <a href="#team">Team</a>
        <Link to="/book">Book Now</Link>
      </nav>
    </div>
    <div className="landing-container landing-footer-bottom">
      <p>
        © {new Date().getFullYear()} Gentlemen’s Quarters. All rights reserved.
      </p>
      <p>Demonstration site. Imagery is illustrative.</p>
    </div>
  </footer>
);

export default LandingFooter;
