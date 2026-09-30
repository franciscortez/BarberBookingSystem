import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  preloadBookingRoute,
  preloadLoginRoute,
} from "../../../routes/lazyRoutes";

const LandingNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountToggleRef = useRef<HTMLButtonElement>(null);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (accountOpen) {
        setAccountOpen(false);
        accountToggleRef.current?.focus();
      }
    };
    const handleOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !accountRef.current?.contains(event.target)
      )
        setAccountOpen(false);
    };
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = () => setMenuOpen(false);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutside);
    breakpoint.addEventListener("change", handleBreakpoint);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutside);
      breakpoint.removeEventListener("change", handleBreakpoint);
    };
  }, [menuOpen, accountOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-72px 0px -60% 0px", threshold: 0 },
    );
    ["home", "services", "team"].forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    const frame = window.requestAnimationFrame(() => target?.scrollIntoView());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    setAccountOpen(false);
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="landing-header">
      <div className="landing-container landing-nav-bar">
        <a href="#home" className="landing-brand" onClick={closeMenu}>
          <img src="/favicon.svg" width="36" height="36" alt="" />
          <span>Gentlemen’s Quarters</span>
        </a>
        <nav className="landing-desktop-nav" aria-label="Main navigation">
          <a
            href="#home"
            aria-current={activeSection === "home" ? "location" : undefined}
          >
            Home
          </a>
          <a
            href="#services"
            aria-current={activeSection === "services" ? "location" : undefined}
          >
            Services
          </a>
          <a
            href="#team"
            aria-current={activeSection === "team" ? "location" : undefined}
          >
            Team
          </a>
          <div
            className="landing-account"
            ref={accountRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setAccountOpen(false);
            }}
          >
            {loading ? (
              <span className="landing-auth-loading" role="status">
                <span className="sr-only">Loading account</span>
              </span>
            ) : user ? (
              <>
                <button
                  type="button"
                  className="landing-account-toggle"
                  aria-expanded={accountOpen}
                  aria-controls="landing-account-options"
                  onClick={() => setAccountOpen(!accountOpen)}
                  ref={accountToggleRef}
                >
                  <span>{user.name}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {accountOpen && (
                  <div
                    id="landing-account-options"
                    className="landing-account-options"
                  >
                    <p>
                      {user.name}
                      <span>{user.role}</span>
                    </p>
                    <button type="button" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                onMouseEnter={preloadLoginRoute}
                onFocus={preloadLoginRoute}
              >
                Sign In
              </Link>
            )}
          </div>
          <Link
            to="/book"
            className="landing-button"
            onMouseEnter={preloadBookingRoute}
            onFocus={preloadBookingRoute}
          >
            Book Now <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
        <button
          ref={toggleRef}
          type="button"
          className="landing-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={24} aria-hidden="true" />
          ) : (
            <Menu size={24} aria-hidden="true" />
          )}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="landing-mobile-nav"
          className="landing-mobile-nav"
          aria-label="Mobile navigation"
        >
          <a href="#home" onClick={closeMenu}>
            Home
          </a>
          <a href="#services" onClick={closeMenu}>
            Services
          </a>
          <a href="#team" onClick={closeMenu}>
            Team
          </a>
          {loading ? (
            <span role="status">Loading account…</span>
          ) : user ? (
            <div className="landing-mobile-account">
              <p>{user.name}</p>
              <button type="button" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              onMouseEnter={preloadLoginRoute}
              onFocus={preloadLoginRoute}
            >
              Sign In
            </Link>
          )}
          <Link
            to="/book"
            className="landing-button"
            onClick={closeMenu}
            onMouseEnter={preloadBookingRoute}
            onFocus={preloadBookingRoute}
          >
            Book Now <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </header>
  );
};

export default LandingNavbar;
