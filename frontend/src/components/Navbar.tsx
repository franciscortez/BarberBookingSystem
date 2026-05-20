import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, Menu, X, Calendar } from 'lucide-react';
import { preloadBookingRoute } from '../routes/lazyRoutes';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll effect to make navbar more solid on scroll
  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleScroll = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const shouldBeScrolled = window.scrollY > 20;
        setScrolled(current => current === shouldBeScrolled ? current : shouldBeScrolled);
        animationFrameId = null;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle hash scrolling across routes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to ensure page components are fully mounted
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setIsOpen(false);

    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)]' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          onClick={handleHomeClick}
          className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors duration-300 group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 group-hover:scale-105 transition-transform duration-300">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300 group-hover:from-white group-hover:to-amber-400 transition-all duration-300">
            Gentlemen's Quarters
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            onClick={handleHomeClick}
            className={`text-sm font-medium transition-colors duration-300 ${
              location.pathname === '/' && !location.hash 
                ? 'text-amber-400' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Home
          </Link>
          <a 
            href="#services" 
            onClick={(e) => handleNavClick(e, 'services')}
            className={`text-sm font-medium transition-colors duration-300 ${
              location.hash === '#services' 
                ? 'text-amber-400' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Services
          </a>
          <a 
            href="#team" 
            onClick={(e) => handleNavClick(e, 'team')}
            className={`text-sm font-medium transition-colors duration-300 ${
              location.hash === '#team' 
                ? 'text-amber-400' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Team
          </a>
          
          <span className="h-5 w-[1px] bg-zinc-800" />

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
          className="p-2 rounded-lg text-zinc-400 hover:text-white md:hidden transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile navigation drawer menu */}
      {isOpen && (
        <div className="md:hidden animate-slideDown border-b border-zinc-900 bg-zinc-950 px-6 py-6 space-y-4">
          <div className="flex flex-col gap-4">
            <Link 
              to="/" 
              onClick={handleHomeClick}
              className={`text-sm font-medium py-1.5 transition-colors ${
                location.pathname === '/' && !location.hash ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              Home
            </Link>
            <a 
              href="#services" 
              onClick={(e) => handleNavClick(e, 'services')}
              className={`text-sm font-medium py-1.5 transition-colors ${
                location.hash === '#services' ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              Services
            </a>
            <a 
              href="#team" 
              onClick={(e) => handleNavClick(e, 'team')}
              className={`text-sm font-medium py-1.5 transition-colors ${
                location.hash === '#team' ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              Team
            </a>
            
            <hr className="border-zinc-900 my-2" />

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
