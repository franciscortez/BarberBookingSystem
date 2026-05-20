import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { preloadBookingRoute } from '../routes/lazyRoutes';

const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
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
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <footer className="relative mt-auto border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link 
              to="/" 
              onClick={handleHomeClick}
              className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors duration-300 group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 group-hover:scale-105 transition-transform duration-300">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300 group-hover:from-white group-hover:to-amber-400 transition-all duration-300">
                Gentlemen's Quarters
              </span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed pr-4">
              A premium grooming sanctuary dedicated to classic cuts, architectural fades, and traditional straight razor shaves. Redefining standards for the modern man.
            </p>
          </div>

          {/* Column 2: Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Hours of Operation</h4>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li className="flex items-center justify-between border-b border-zinc-900 pb-1.5 pr-2">
                <span>Monday - Friday</span>
                <span className="text-white font-medium">09:00 - 18:00</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-900 pb-1.5 pr-2">
                <span>Saturday</span>
                <span className="text-white font-medium">09:00 - 18:00</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-900 pb-1.5 pr-2">
                <span>Sunday</span>
                <span className="text-white font-medium">10:00 - 16:00</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Contact Us</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>123 Premium Grooming Blvd, Suite 101, Metro Manila, Philippines</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="tel:+63281234567" className="hover:text-white transition-colors">+63 (2) 8123-4567</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:appointments@gentlemensquarters.com" className="hover:text-white transition-colors">appointments@gentlemensquarters.com</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Quick Links</h4>
            <div className="flex flex-col gap-2.5 text-sm text-zinc-400">
              <Link to="/" onClick={handleHomeClick} className="hover:text-white hover:underline decoration-amber-400/50 transition-colors inline-flex items-center gap-1">
                Home <ArrowUpRight className="w-3 h-3 opacity-50" />
              </Link>
              <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="hover:text-white hover:underline decoration-amber-400/50 transition-colors inline-flex items-center gap-1">
                Services <ArrowUpRight className="w-3 h-3 opacity-50" />
              </a>
              <a href="#team" onClick={(e) => handleNavClick(e, 'team')} className="hover:text-white hover:underline decoration-amber-400/50 transition-colors inline-flex items-center gap-1">
                Team <ArrowUpRight className="w-3 h-3 opacity-50" />
              </a>
              <Link
                to="/book"
                onMouseEnter={preloadBookingRoute}
                onFocus={preloadBookingRoute}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1"
              >
                Book An Appointment <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-900 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Gentlemen's Quarters Co. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
