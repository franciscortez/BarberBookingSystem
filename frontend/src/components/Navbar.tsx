import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Calendar, LogIn, LogOut, ChevronDown } from "lucide-react";
import { preloadBookingRoute, preloadLoginRoute } from "../routes/lazyRoutes";
import { useAuth } from "../hooks/useAuth";

type HomeSection = "home" | "services" | "team";

const sectionIds: HomeSection[] = ["home", "services", "team"];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [visibleHomeSection, setVisibleHomeSection] =
    useState<HomeSection>("home");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const activeSection = location.pathname === "/" ? visibleHomeSection : null;

  // Scroll effect to make navbar more solid on scroll
  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleScroll = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const shouldBeScrolled = window.scrollY > 20;
        setScrolled((current) =>
          current === shouldBeScrolled ? current : shouldBeScrolled,
        );
        animationFrameId = null;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Track which home page section is currently under the fixed navbar
  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    let animationFrameId: number | null = null;

    const updateActiveSection = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const navbarOffset = 120;
        const scrollPosition = window.scrollY + navbarOffset;
        let currentSection: HomeSection = "home";

        sectionIds.forEach((sectionId) => {
          const element = document.getElementById(sectionId);
          if (element && element.offsetTop <= scrollPosition) {
            currentSection = sectionId;
          }
        });

        setVisibleHomeSection((current) =>
          current === currentSection ? current : currentSection,
        );
        animationFrameId = null;
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [location.pathname]);

  // Handle hash scrolling across routes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to ensure page components are fully mounted
        const timer = setTimeout(() => {
          if (sectionIds.includes(id as HomeSection)) {
            setVisibleHomeSection(id as HomeSection);
          }
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    setIsOpen(false);
    setVisibleHomeSection(sectionId as HomeSection);

    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        navigate(`/#${sectionId}`);
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    setVisibleHomeSection("home");

    if (location.pathname === "/") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={handleHomeClick}
          className="flex items-center gap-3 text-white hover:text-amber-400 transition-colors duration-300 group shrink-0 min-w-0"
        >
          <img
            src="/favicon.svg"
            alt="Gentlemen's Quarters Logo"
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-300 shrink-0"
          />
          <span className="font-bold text-sm sm:text-base md:text-lg tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300 group-hover:from-white group-hover:to-amber-400 transition-all duration-300 truncate max-w-[180px] sm:max-w-none">
            Gentlemen's Quarters
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link
            to="/"
            onClick={handleHomeClick}
            className={`text-sm font-medium transition-colors duration-300 ${
              activeSection === "home"
                ? "text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Home
          </Link>
          <a
            href="#services"
            onClick={(e) => handleNavClick(e, "services")}
            className={`text-sm font-medium transition-colors duration-300 ${
              activeSection === "services"
                ? "text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Services
          </a>
          <a
            href="#team"
            onClick={(e) => handleNavClick(e, "team")}
            className={`text-sm font-medium transition-colors duration-300 ${
              activeSection === "team"
                ? "text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Team
          </a>

          <span className="h-5 w-[1px] bg-zinc-800" />

          {/* Auth / User Menu */}
          {!loading &&
            (user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-xl py-1 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-300 truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {user.role}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onMouseEnter={preloadLoginRoute}
                onFocus={preloadLoginRoute}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            ))}

          {/* Call to Action Book Now */}
          <Link
            to="/book"
            onMouseEnter={preloadBookingRoute}
            onFocus={preloadBookingRoute}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" /> Book Now
          </Link>
        </div>

        {/* Mobile Hamburger toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white lg:hidden transition-colors shrink-0"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile navigation drawer menu */}
      {isOpen && (
        <div className="lg:hidden animate-slideDown border-b border-zinc-900 bg-zinc-950 px-4 sm:px-6 py-6 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`text-sm font-medium py-1.5 transition-colors ${
                activeSection === "home" ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              Home
            </Link>
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, "services")}
              className={`text-sm font-medium py-1.5 transition-colors ${
                activeSection === "services"
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              Services
            </a>
            <a
              href="#team"
              onClick={(e) => handleNavClick(e, "team")}
              className={`text-sm font-medium py-1.5 transition-colors ${
                activeSection === "team" ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              Team
            </a>

            <hr className="border-zinc-900 my-2" />

            {!loading &&
              (user ? (
                <>
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-zinc-300">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 capitalize">
                      ({user.role})
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="py-2 text-left text-sm text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="py-3 rounded-xl text-sm font-medium text-zinc-300 border border-zinc-800 text-center flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Register
                </Link>
              ))}

            <Link
              to="/book"
              onClick={() => setIsOpen(false)}
              onMouseEnter={preloadBookingRoute}
              onFocus={preloadBookingRoute}
              className="py-3 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <Calendar className="w-4 h-4" /> Book Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
