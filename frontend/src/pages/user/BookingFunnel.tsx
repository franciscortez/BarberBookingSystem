import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User, Calendar, CreditCard, ChevronRight, ChevronLeft,
  AlertCircle, Loader2, CheckCircle2, Scissors
} from 'lucide-react';
import { getCatalog, getAvailability, createBooking } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Barber, Service } from '../../types';
import {
  buildSlotOptions,
  parseLocalISODate,
  toLocalISODate,
  type SlotOption
} from '../../utils/booking';
import BarberServiceStep from '../../sections/user/booking/BarberServiceStep';
import DateTimeStep from '../../sections/user/booking/DateTimeStep';
import ContactStep from '../../sections/user/booking/ContactStep';
import ConfirmStep from '../../sections/user/booking/ConfirmStep';

const steps = [
  { number: 1, label: 'Select Barber & Service', icon: Scissors },
  { number: 2, label: 'Choose Date & Time', icon: Calendar },
  { number: 3, label: 'Customer Details', icon: User },
  { number: 4, label: 'Review & Checkout', icon: CreditCard },
];

const BookingFunnel: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedBarberId = searchParams.get('barberId');

  const [currentStep, setCurrentStep] = useState<number>(1);

  // API data
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);

  // Loading states
  const [loadingBarbers, setLoadingBarbers] = useState<boolean>(true);
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Selections
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  // Customer form
  const [customerName, setCustomerName] = useState<string>(() => user?.name ?? '');
  const [customerEmail, setCustomerEmail] = useState<string>(() => user?.email ?? '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => user?.phone ?? '');
  const [prefilledUserId, setPrefilledUserId] = useState<string | null>(null);

  // Prefill contact fields when user loads
  if (user && prefilledUserId !== user.id) {
    setPrefilledUserId(user.id);
    setCustomerName(user.name ?? '');
    setCustomerEmail(user.email ?? '');
    setCustomerPhone(user.phone ?? '');
  }

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const selectedDateObject = parseLocalISODate(selectedDate);
  const isSelectedDateFullyBooked = Boolean(
    selectedDateObject &&
    !loadingSlots &&
    !availabilityError &&
    slotOptions.length > 0 &&
    slotOptions.every(slot => !slot.available)
  );
  const availableSlotCount = useMemo(
    () => slotOptions.filter(slot => slot.available).length,
    [slotOptions]
  );

  const servicesByBarber = useMemo(() => {
    return services.reduce<Map<string, Service[]>>((groups, service) => {
      const barberServices = groups.get(service.barber_id) ?? [];
      barberServices.push(service);
      groups.set(service.barber_id, barberServices);
      return groups;
    }, new Map());
  }, [services]);

  const visibleServiceGroups = useMemo(() => {
    const sourceBarbers = selectedBarber ? [selectedBarber] : barbers;
    return sourceBarbers
      .map(barber => ({ barber, services: servicesByBarber.get(barber.id) ?? [] }))
      .filter(group => group.services.length > 0);
  }, [barbers, selectedBarber, servicesByBarber]);

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };

  const handleSelectService = (service: Service) => {
    const serviceBarber = barbers.find(barber => barber.id === service.barber_id);
    if (serviceBarber) setSelectedBarber(serviceBarber);
    setSelectedService(service);
    setSelectedDate('');
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };

  // ── Fetch booking catalog on mount ─────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const fetchCatalog = async () => {
      try {
        setLoadingBarbers(true);
        setLoadingServices(true);
        const catalog = await getCatalog({ signal: controller.signal });
        setBarbers(catalog.barbers);
        setServices(catalog.services);
        if (preselectedBarberId) {
          const found = catalog.barbers.find(b => b.id === preselectedBarberId);
          if (found) setSelectedBarber(found);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Unable to load the booking catalog. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBarbers(false);
          setLoadingServices(false);
        }
      }
    };
    fetchCatalog();
    return () => controller.abort();
  }, [preselectedBarberId]);

  // ── Fetch available slots when date or service changes ─────────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) return;
    const controller = new AbortController();
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setAvailabilityError(null);
        setSelectedSlot(null);
        const result = await getAvailability(selectedBarber.id, selectedDate, selectedService.id, {
          signal: controller.signal
        });
        setSlotOptions(buildSlotOptions(selectedDate, result.duration, result.slots ?? result.availableSlots));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSlotOptions([]);
        setAvailabilityError('Unable to load available times for this date. Please try another date or refresh the page.');
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => controller.abort();
  }, [selectedBarber, selectedDate, selectedService]);

  // ── Navigation guards ────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (currentStep === 1) return !!selectedBarber && !!selectedService;
    if (currentStep === 2) return !!selectedDate && !!selectedSlot;
    if (currentStep === 3) return customerName.trim() !== '' && customerEmail.trim() !== '' && customerPhone.trim() !== '';
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setError(null);
    if (currentStep < 4) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  // ── Submit booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedSlot) return;
    try {
      setSubmitting(true);
      setError(null);
      const result = await createBooking({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.start,
      });
      if (result.appointment.management_token) {
        sessionStorage.setItem('pendingBookingToken', result.appointment.management_token);
      }
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-28">
        <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Book an Appointment</h1>
        <p className="text-zinc-400 mt-1">Reserve your customized grooming session with simple, secure steps.</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Step Progress Bar */}
        <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-md p-6 mb-8 overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            {steps.map((s, idx) => {
              const IconComponent = s.icon;
              const isCompleted = currentStep > s.number;
              const isActive = currentStep === s.number;
              return (
                <div key={s.number} className="flex flex-col items-center flex-1 relative">
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 right-[-50%] h-[2px] -translate-y-1/2 z-[-1] transition-all duration-500 ${isCompleted ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : isActive
                      ? 'border-amber-400 text-amber-400 bg-zinc-900 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : 'border-zinc-800 text-zinc-500 bg-zinc-950'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                  </div>
                  <span className={`mt-3 text-xs font-medium tracking-wide text-center hidden md:block transition-colors duration-300 ${
                    isActive ? 'text-amber-400' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 min-h-[400px] flex flex-col justify-between">
          {currentStep === 1 && (
            <BarberServiceStep
              barbers={barbers}
              services={services}
              loadingBarbers={loadingBarbers}
              loadingServices={loadingServices}
              selectedBarber={selectedBarber}
              selectedService={selectedService}
              servicesByBarber={servicesByBarber}
              visibleServiceGroups={visibleServiceGroups}
              onSelectBarber={handleSelectBarber}
              onSelectService={handleSelectService}
            />
          )}

          {currentStep === 2 && (
            <DateTimeStep
              selectedDate={selectedDate}
              selectedDateObject={selectedDateObject}
              selectedSlot={selectedSlot}
              slotOptions={slotOptions}
              loadingSlots={loadingSlots}
              availabilityError={availabilityError}
              isSelectedDateFullyBooked={isSelectedDateFullyBooked}
              availableSlotCount={availableSlotCount}
              selectedService={selectedService}
              onSelectDate={(date) => {
                setSelectedDate(date ? toLocalISODate(date) : '');
                setSelectedSlot(null);
                setSlotOptions([]);
                setAvailabilityError(null);
              }}
              onSelectSlot={setSelectedSlot}
            />
          )}

          {currentStep === 3 && (
            <ContactStep
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              onChangeName={setCustomerName}
              onChangeEmail={setCustomerEmail}
              onChangePhone={setCustomerPhone}
            />
          )}

          {currentStep === 4 && selectedBarber && selectedService && selectedDate && selectedSlot && (
            <ConfirmStep
              selectedBarber={selectedBarber}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
            />
          )}

          {/* Global error message */}
          {error && (
            <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between border-t border-zinc-800/80 pt-6 mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1 transition-all ${
                currentStep === 1
                  ? 'text-zinc-600 bg-transparent cursor-not-allowed'
                  : 'text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1 ${
                  canProceed()
                    ? 'text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'text-zinc-600 bg-zinc-800 cursor-not-allowed'
                }`}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating Booking...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Proceed to Payment</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFunnel;
