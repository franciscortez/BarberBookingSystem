import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Calendar, ShieldCheck, Clock, Star, ArrowRight } from 'lucide-react';
import { getCatalog } from '../services/api';
import type { Barber, Service } from '../types';
import { preloadBookingRoute } from '../routes/lazyRoutes';
import { formatPrice, parseAmount } from '../utils/booking';

// Helper to enrich database barbers with premium details
const getBarberVisuals = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('marco')) {
    return {
      initials: 'MR',
      specialty: 'Master Barber & Style Architect',
      bio: 'With over 15 years of experience, Marco specializes in classic architectural cuts and precision beard sculpting. He is the heartbeat of our grooming sanctuary.'
    };
  } else if (lowercaseName.includes('luis')) {
    return {
      initials: 'LS',
      specialty: 'Professional Grooming Artist',
      bio: 'Luis is an expert in modern fades and contemporary styling. His attention to detail and sharp finishes make him a favorite for sharp, clean looks.'
    };
  } else if (lowercaseName.includes('kevin')) {
    return {
      initials: 'KC',
      specialty: 'Precision Stylist & Shave Master',
      bio: 'Kevin focuses on the art of the traditional straight razor and restorative scalp treatments. He brings a creative, modern touch to every chair.'
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
      specialty: 'Professional Grooming Artist',
      bio: 'Dedicated to precision crafting and providing a luxury styling experience tailored to your unique profile.'
    };
  }
};

type GroupedService = {
  name: string;
  description: string | null;
  durationMins: number;
  minPrice: number;
  maxPrice: number;
  minDownpayment: number;
  maxDownpayment: number;
  services: Service[];
};

const formatPriceRange = (min: number, max: number) => {
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
};

const getServiceBadge = (name: string) => {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('massage') || lowercase.includes('shave')) {
    return { label: 'Ritual', className: 'bg-indigo-500/10 text-indigo-400' };
  }
  if (lowercase.includes('color') || lowercase.includes('facial')) {
    return { label: 'Luxury', className: 'bg-amber-500/10 text-amber-400' };
  }
  return { label: 'Classic', className: 'bg-amber-500/10 text-amber-400' };
};

const normalizeBarberName = (name?: string) => {
  if (!name) return 'Assigned Barber';
  return name.split(' - ')[0];
};

const getBarberRole = (name?: string) => {
  if (!name) return 'Professional Barber';
  const role = name.split(' - ')[1];
  return role || 'Professional Barber';
};

const groupServicesByName = (services: Service[]): GroupedService[] => {
  const groups = services.reduce<Map<string, Service[]>>((acc, service) => {
    const serviceGroup = acc.get(service.name) ?? [];
    serviceGroup.push(service);
    acc.set(service.name, serviceGroup);
    return acc;
  }, new Map());

  return Array.from(groups.entries())
    .map(([name, groupedServices]) => {
      const prices = groupedServices.map(service => parseAmount(service.total_price));
      const downpayments = groupedServices.map(service => parseAmount(service.downpayment_amount));
      const firstService = groupedServices[0];

      return {
        name,
        description: firstService.description,
        durationMins: firstService.duration_mins,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        minDownpayment: Math.min(...downpayments),
        maxDownpayment: Math.max(...downpayments),
        services: [...groupedServices].sort((a, b) => parseAmount(b.total_price) - parseAmount(a.total_price))
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);
};

const ServiceSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="h-6 w-16 bg-zinc-800/80 rounded" />
      <div className="h-6 w-28 bg-zinc-800/80 rounded" />
    </div>
    <div className="h-7 w-3/4 bg-zinc-800/80 rounded mt-4" />
    <div className="space-y-2 mt-2">
      <div className="h-4 w-full bg-zinc-800/80 rounded" />
      <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
    </div>
    <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-900 space-y-2.5">
      <div className="h-8 w-full bg-zinc-800/70 rounded" />
      <div className="h-8 w-full bg-zinc-800/70 rounded" />
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

const FALLBACK_BARBERS: Barber[] = [
  { id: '1', name: 'Marco' },
  { id: '2', name: 'Luis' },
  { id: '3', name: 'Kevin' }
];

const FALLBACK_SERVICES: Service[] = [
  {
    id: 's1',
    barber_id: '1',
    name: 'Haircut',
    description: 'Premium haircut tailored to your face shape, including hair wash and styling.',
    total_price: 500,
    downpayment_amount: 100,
    duration_mins: 30,
    barber_name: 'Marco'
  },
  {
    id: 's2',
    barber_id: '1',
    name: 'Beard Trim',
    description: 'Precision beard trim and line-up with hot towel treatment and beard oil.',
    total_price: 350,
    downpayment_amount: 50,
    duration_mins: 30,
    barber_name: 'Marco'
  },
  {
    id: 's3',
    barber_id: '1',
    name: 'Haircut & Beard Trim Combo',
    description: 'The ultimate grooming combo. Includes haircut, beard styling, hair wash, and hot towel.',
    total_price: 750,
    downpayment_amount: 150,
    duration_mins: 60,
    barber_name: 'Marco'
  },
  {
    id: 's4',
    barber_id: '1',
    name: 'Luxury Hot Towel Shave',
    description: 'Traditional straight razor shave with premium pre-shave oil, hot towels, and soothing balm.',
    total_price: 400,
    downpayment_amount: 100,
    duration_mins: 45,
    barber_name: 'Marco'
  }
];

const Home: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>(FALLBACK_BARBERS);
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const groupedServices = useMemo(() => groupServicesByName(services), [services]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const catalog = await getCatalog({ signal: controller.signal });
        if (catalog.barbers?.length) setBarbers(catalog.barbers);
        if (catalog.services?.length) setServices(catalog.services);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Keep fallback data silently
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
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
          ) : groupedServices.length > 0 ? (
            groupedServices.map((serviceGroup) => {
              const badge = getServiceBadge(serviceGroup.name);

              return (
                <div key={serviceGroup.name} className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:border-amber-500/30 hover:bg-zinc-900/30 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-xl font-bold text-amber-400 text-right">
                        {formatPriceRange(serviceGroup.minPrice, serviceGroup.maxPrice)}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">{serviceGroup.name}</h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      {serviceGroup.description || 'Professional grooming service tailored to your barber and preferred style.'}
                    </p>

                    <div className="mt-6 space-y-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Pricing by Barber</p>
                      <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-900 space-y-2.5">
                        {serviceGroup.services.map((service, index) => (
                          <div key={service.id}>
                            {index > 0 && <div className="border-t border-zinc-900/60 mb-2.5" />}
                            <div className="flex justify-between items-center gap-4 text-xs">
                              <div className="min-w-0">
                                <span className={`font-semibold ${index === 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                                  {normalizeBarberName(service.barber_name)}
                                </span>
                                <span className="block text-[10px] text-zinc-500 font-normal">{getBarberRole(service.barber_name)}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-bold ${index === 0 ? 'text-white' : 'text-zinc-300'}`}>
                                  {formatPrice(parseAmount(service.total_price))}
                                </span>
                                <span className="block text-[9px] text-zinc-500 font-normal">
                                  {formatPrice(parseAmount(service.downpayment_amount))} downpayment
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto">
                    <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 font-medium text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500/80" /> {serviceGroup.durationMins} Mins
                      </span>
                      <Link
                        to="/book"
                        onMouseEnter={preloadBookingRoute}
                        onFocus={preloadBookingRoute}
                        className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 font-semibold transition-all duration-300"
                      >
                        Book Service
                      </Link>
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-600">
                      Downpayment range: {formatPriceRange(serviceGroup.minDownpayment, serviceGroup.maxDownpayment)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No services currently seeded on the platform.
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/book"
            onMouseEnter={preloadBookingRoute}
            onFocus={preloadBookingRoute}
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
