import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Scissors, ShieldCheck, Clock, Star } from 'lucide-react';
import { preloadBookingRoute } from '../../../routes/lazyRoutes';

const HeroSection: React.FC = () => (
  <section id="home" className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center text-center">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-medium tracking-wider uppercase mb-8 backdrop-blur-sm animate-pulse">
      <Star className="w-3.5 h-3.5 fill-amber-400" />
      The Ultimate Grooming Experience
    </div>

    {/* Title */}
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-tight">
      Precision Cuts.<br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
        Uncompromising Style.
      </span>
    </h1>

    {/* Subtitle */}
    <p className="mt-6 text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
      Step into a premium grooming sanctuary. From precision haircuts and expert coloring to traditional straight razor shaves—tailored excellence for the modern gentleman. No account required.
    </p>

    {/* CTA Buttons */}
    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Link
        to="/book"
        onMouseEnter={preloadBookingRoute}
        onFocus={preloadBookingRoute}
        className="group relative px-8 py-4 rounded-xl font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 text-base"
      >
        <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        Book Your Appointment
      </Link>
      <a
        href="#services"
        className="px-8 py-4 rounded-xl font-semibold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-300 text-base"
      >
        View Shop Catalog
      </a>
    </div>

    {/* Core Value Props */}
    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
      <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md flex items-start gap-4 text-left hover:border-zinc-700/80 transition-all duration-300">
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Scissors className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Elite Barbers</h3>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Master craftsmen dedicated to perfecting your personalized style and profile details.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md flex items-start gap-4 text-left hover:border-zinc-700/80 transition-all duration-300">
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Secure Downpayments</h3>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Book with total peace of mind using our trusted PayMongo integrated portal.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md flex items-start gap-4 text-left hover:border-zinc-700/80 transition-all duration-300">
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Flexible Rescheduling</h3>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Need to adjust? Use your secure email management link to reschedule in seconds.</p>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
