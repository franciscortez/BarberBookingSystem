import React, { useState, useEffect, useMemo } from 'react';
import { getCatalog } from '../../services/api';
import type { Barber, Service } from '../../types';
import { preloadBookingRoute } from '../../routes/lazyRoutes';
import HeroSection from '../../sections/user/home/HeroSection';
import ServicesSection from '../../sections/user/home/ServicesSection';
import { groupServicesByName } from '../../sections/user/home/servicesUtils';
import TeamSection from '../../sections/user/home/TeamSection';

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

  // Preload on mount
  useEffect(() => {
    preloadBookingRoute();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <HeroSection />
      <ServicesSection loading={loading} error={error} groupedServices={groupedServices} />
      <TeamSection loading={loading} barbers={barbers} />
    </div>
  );
};

export default Home;
