import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Calendar, ShieldCheck, Clock, Star, ArrowRight } from 'lucide-react';
import { getBarbers, getServices } from '../services/api';
import type { Barber, Service } from '../types';

// Helper to enrich database barbers with premium details
const getBarberVisuals = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('john') || lowercaseName.includes('cortez')) {
    return {
      initials: 'JD',
      specialty: 'Master Barber & Skin Fade Specialist (8+ Yrs Exp)',
      bio: 'John specializes in modern architectural fades, precision scissor contours, and luxury beard sculpting. Crafting tailored experiences since day one.',
      role: 'Founder'
    };
  } else if (lowercaseName.includes('jane') || lowercaseName.includes('smith')) {
    return {
      initials: 'JS',
      specialty: 'Traditional Shave Artist & Pompadour Expert',
      bio: 'Jane is our master of the classic straight razor. Renowned for meticulous hot lather layers, smooth skin shaves, and iconic classic styles.',
      role: 'Expert'
    };
  } else if (lowercaseName.includes('mike') || lowercaseName.includes('johnson')) {
    return {
      initials: 'MJ',
      specialty: 'Contour Artist & Hair Health Specialist',
      bio: 'Mike focuses on structural shear contours, organic hair treatments, and modern textured styling. Delivering precision care to every chair session.',
      role: 'Senior'
    };
  } else {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      initials,
      specialty: 'Expert Stylist & Shave Practitioner',
      bio: 'Dedicated to precision crafting, customized detailing profiles, and luxury styling experiences tailored to you.',
      role: 'Stylist'
    };
  }
};

const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getServiceBadge = (name: string) => {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('color') || lowercase.includes('shave') || lowercase.includes('facial')) {
    return 'Luxury';
  } else if (lowercase.includes('combo') || lowercase.includes('ritual') || lowercase.includes('massage')) {
    return 'Combo';
  }
  return 'Classic';
};

// Skeletons for Loading State
const ServiceSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="h-6 w-16 bg-zinc-800/80 rounded" />
      <div className="h-6 w-20 bg-zinc-800/80 rounded" />
    </div>
    <div className="h-7 w-3/4 bg-zinc-800/80 rounded mt-4" />
    <div className="space-y-2 mt-2">
      <div className="h-4 w-full bg-zinc-800/80 rounded" />
      <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
    </div>
    <div className="border-t border-zinc-900/80 pt-4 flex justify-between">
      <div className="h-4 w-16 bg-zinc-800/80 rounded" />
      <div className="h-4 w-24 bg-zinc-800/80 rounded" />
    </div>
  </div>
);

const BarberSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 animate-pulse flex flex-col md:flex-row gap-6">
    <div className="w-24 h-24 rounded-2xl bg-zinc-800/80 shrink-0" />
    <div className="flex-grow space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-32 bg-zinc-800/80 rounded" />
        <div className="h-4 w-12 bg-zinc-800/80 rounded-full" />
      </div>
      <div className="h-4 w-48 bg-zinc-800/80 rounded" />
      <div className="space-y-2 mt-2">
        <div className="h-4 w-full bg-zinc-800/80 rounded" />
        <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
      </div>
    </div>
  </div>
);

const Home: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [barbersList, servicesList] = await Promise.all([
          getBarbers(),
          getServices()
        ]);
        setBarbers(barbersList);
        setServices(servicesList);
        setError(null);
      } catch (err) {
        console.error('Error fetching landing data:', err);
        setError('Failed to sync catalog data with the server. Running in fallback mode.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center text-center">
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
          Step into a premium grooming sanctuary. Handcrafted haircuts, hot towel shaves, and top-tier service tailored to the modern gentleman. No account required.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/book"
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

      {/* Featured Services Section */}
      <section id="services" className="relative max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Premium Shop Offerings</h2>
          <p className="mt-4 text-zinc-400">Selected standard services, expertly curated by our active team of barbers.</p>
          {error && <p className="text-amber-500/70 text-xs mt-3 bg-amber-500/5 py-2 px-4 rounded-xl border border-amber-500/10 max-w-md mx-auto">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <>
              <ServiceSkeleton />
              <ServiceSkeleton />
              <ServiceSkeleton />
            </>
          ) : services.length > 0 ? (
            services.map((service) => (
              <div key={service.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                      {getServiceBadge(service.name)}
                    </span>
                    <span className="text-xl font-bold text-amber-400">{formatPrice(service.total_price)}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">{service.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{service.description || 'Professional grooming service.'}</p>
                </div>
                <div className="p-6 pt-0 mt-auto">
                  <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" /> {service.duration_mins} Mins
                    </span>
                    <span>Downpayment: {formatPrice(service.downpayment_amount)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No services currently seeded on the platform.
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors duration-300"
          >
            Schedule your appointment today <Calendar className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Team / Barbers Section */}
      <section id="team" className="relative max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Meet Our Master Craftsmen</h2>
          <p className="mt-4 text-zinc-400">Award-winning stylists dedicated to elevating your personal profile and style standards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {loading ? (
            <>
              <BarberSkeleton />
              <BarberSkeleton />
            </>
          ) : barbers.length > 0 ? (
            barbers.map((barber) => {
              const visuals = getBarberVisuals(barber.name);
              return (
                <div key={barber.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col md:flex-row gap-6 p-6">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-850 shrink-0 flex items-center justify-center font-bold text-3xl text-amber-400 border border-zinc-700 group-hover:scale-105 transition-transform duration-300">
                    {visuals.initials}
                  </div>
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">{barber.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          visuals.role === 'Founder' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {visuals.role}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium block mt-1">{visuals.specialty}</span>
                      <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{visuals.bio}</p>
                    </div>
                    <div className="mt-4">
                      <Link 
                        to={`/book?barberId=${barber.id}`} 
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Book with {barber.name.split(' ')[0]} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No barbers are currently active.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
