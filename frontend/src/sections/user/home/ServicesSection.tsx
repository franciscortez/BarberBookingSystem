import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import { preloadBookingRoute } from '../../../routes/lazyRoutes';
import { formatPrice, parseAmount } from '../../../utils/booking';
import {
  formatPriceRange,
  getServiceBadge,
  normalizeBarberName,
  getBarberRole,
  type GroupedService
} from './servicesUtils';


// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface ServicesSectionProps {
  loading: boolean;
  error: string | null;
  groupedServices: GroupedService[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const ServicesSection: React.FC<ServicesSectionProps> = ({ loading, error, groupedServices }) => (
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
);

export default ServicesSection;
