import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  User, Calendar, CreditCard, ChevronRight, ChevronLeft,
  Clock, Scissors, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { getCatalog, getAvailability, createBooking } from '../services/api';
import type { Barber, Service } from '../types';
import {
  buildSlotOptions,
  formatDate,
  formatPrice,
  formatTime,
  getStartOfToday,
  parseAmount,
  parseLocalISODate,
  toLocalISODate,
  type SlotOption
} from '../utils/booking';

// ─── Utilities ────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Skeleton Components ───────────────────────────────────────────────────────

const BarberSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
    <div className="flex-grow space-y-2">
      <div className="h-4 w-28 bg-zinc-800 rounded" />
      <div className="h-3 w-36 bg-zinc-800 rounded" />
    </div>
  </div>
);

const ServiceSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse flex justify-between items-center">
    <div className="space-y-2">
      <div className="h-4 w-32 bg-zinc-800 rounded" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
    </div>
    <div className="space-y-1.5 text-right">
      <div className="h-5 w-20 bg-zinc-800 rounded" />
      <div className="h-3 w-24 bg-zinc-800 rounded" />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const BookingFunnel: React.FC = () => {
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
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

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
      .map(barber => ({
        barber,
        services: servicesByBarber.get(barber.id) ?? []
      }))
      .filter(group => group.services.length > 0);
  }, [barbers, selectedBarber, servicesByBarber]);

  const steps = useMemo(() => [
    { number: 1, label: 'Select Barber & Service', icon: Scissors },
    { number: 2, label: 'Choose Date & Time', icon: Calendar },
    { number: 3, label: 'Customer Details', icon: User },
    { number: 4, label: 'Review & Checkout', icon: CreditCard },
  ], []);

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
    if (serviceBarber) {
      setSelectedBarber(serviceBarber);
    }
    setSelectedService(service);
    setSelectedDate('');
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };

  // ── Fetch booking catalog on mount ──────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    const fetchCatalog = async () => {
      try {
        setLoadingBarbers(true);
        setLoadingServices(true);
        const catalog = await getCatalog({ signal: controller.signal });
        setBarbers(catalog.barbers);
        setServices(catalog.services);
        // Pre-select barber from URL param (?barberId=...)
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
    if (!selectedBarber || !selectedDate || !selectedService) {
      return;
    }
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
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    };
    fetchSlots();

    return () => controller.abort();
  }, [selectedBarber, selectedDate, selectedService]);

  // ── Navigation guards ───────────────────────────────────────────────────────
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

  // ── Submit booking ──────────────────────────────────────────────────────────
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

      // Persist management_token so SuccessPage can poll the real status
      if (result.appointment.management_token) {
        sessionStorage.setItem('pendingBookingToken', result.appointment.management_token);
      }

      // Redirect to PayMongo checkout
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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

          {/* ── STEP 1: SELECT BARBER & SERVICE ── */}
          {currentStep === 1 && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-400" />
                  Select Your Barber & Preferred Service
                </h2>
                
                {/* Dedicated Policy Note */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-[10px] font-bold uppercase tracking-tight italic">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Downpayments are non-refundable
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Barbers */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Choose Barber</label>
                  <div className="space-y-3">
                    {loadingBarbers ? (
                      <><BarberSkeleton /><BarberSkeleton /></>
                    ) : barbers.length === 0 ? (
                      <p className="text-zinc-500 text-sm py-4 text-center">No barbers available.</p>
                    ) : barbers.map(barber => {
                      const isSelected = selectedBarber?.id === barber.id;
                      return (
                        <button
                          key={barber.id}
                          onClick={() => handleSelectBarber(barber)}
                          className={`w-full p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 text-left ${
                            isSelected
                              ? 'border-amber-500/60 bg-amber-500/8 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                              : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${
                            isSelected ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}>
                            {getInitials(barber.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{barber.name}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {(servicesByBarber.get(barber.id)?.length ?? 0)} {(servicesByBarber.get(barber.id)?.length ?? 0) === 1 ? 'service' : 'services'} available
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Select Service</label>
                  {loadingServices ? (
                    <div className="space-y-3"><ServiceSkeleton /><ServiceSkeleton /></div>
                  ) : services.length === 0 || visibleServiceGroups.length === 0 ? (
                    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm">
                      {selectedBarber ? 'No services available for this barber.' : 'No services available.'}
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[470px] overflow-y-auto pr-1">
                      {visibleServiceGroups.map(group => (
                        <div key={group.barber.id} className="space-y-2">
                          {!selectedBarber && (
                            <div className="flex items-center gap-2 px-1">
                              <div className="h-px flex-grow bg-zinc-900" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group.barber.name}</span>
                              <div className="h-px flex-grow bg-zinc-900" />
                            </div>
                          )}
                          {group.services.map(service => {
                            const isSelected = selectedService?.id === service.id;
                            const remainingBalance = parseAmount(service.total_price) - parseAmount(service.downpayment_amount);

                            return (
                              <button
                                key={service.id}
                                onClick={() => handleSelectService(service)}
                                className={`w-full p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                  isSelected
                                    ? 'border-amber-500/60 bg-amber-500/8 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{service.name}</h4>
                                    {service.description && (
                                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{service.description}</p>
                                    )}
                                  </div>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                                  <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-zinc-600">Duration</span>
                                    <span className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                      <Clock className="w-3 h-3" /> {service.duration_mins} mins
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-zinc-600">Total</span>
                                    <span className={`mt-0.5 block text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                      {formatPrice(service.total_price)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-zinc-600">Due Now</span>
                                    <span className={`mt-0.5 block text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                      {formatPrice(service.downpayment_amount)}
                                    </span>
                                  </div>
                                </div>

                                <p className="mt-2 text-[10px] text-zinc-600">
                                  Remaining balance after downpayment: {formatPrice(remainingBalance)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: CHOOSE DATE & TIME ── */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Select Appointment Date & Time
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Date Picker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pick a Date</label>
                    <span className="text-[10px] font-medium text-zinc-500">Today: {formatDate(toLocalISODate(getStartOfToday()))}</span>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                      <DayPicker
                        mode="single"
                        selected={selectedDateObject}
                        onSelect={(date) => {
                          setSelectedDate(date ? toLocalISODate(date) : '');
                          setSelectedSlot(null);
                          setSlotOptions([]);
                          setAvailabilityError(null);
                        }}
                        disabled={{ before: getStartOfToday() }}
                        weekStartsOn={1}
                        className="booking-day-picker"
                        modifiers={{
                          fullyBooked: isSelectedDateFullyBooked ? selectedDateObject : []
                        }}
                        classNames={{
                          root: 'w-full',
                          months: 'flex justify-center',
                          month: 'w-full',
                          month_caption: 'flex items-center justify-center pb-4',
                          caption_label: 'text-sm font-bold text-white',
                          nav: 'flex items-center justify-between mb-2',
                          button_previous: 'absolute left-4 top-4 h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-30',
                          button_next: 'absolute right-4 top-4 h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-30',
                          month_grid: 'w-full border-collapse',
                          weekdays: 'grid grid-cols-7 mb-2',
                          weekday: 'text-[11px] font-semibold uppercase text-zinc-500 text-center py-1',
                          week: 'grid grid-cols-7 gap-1 mb-1',
                          day: 'aspect-square text-center text-sm',
                          day_button: 'h-10 w-full rounded-xl text-sm text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40',
                          selected: 'text-amber-300',
                          today: 'text-amber-300',
                          disabled: 'text-zinc-700 opacity-50 line-through decoration-red-400 decoration-2',
                          outside: 'text-zinc-700'
                        }}
                        modifiersClassNames={{
                          selected: 'rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50',
                          today: 'font-bold',
                          fullyBooked: 'line-through decoration-red-400 decoration-2'
                        }}
                      />
                  </div>
                  {selectedDate && selectedService && (
                    <p className="text-xs text-zinc-500 mt-3">
                      Showing {selectedService.duration_mins}-minute slots for{' '}
                      <span className="text-zinc-300">{formatDate(selectedDate)}</span>
                    </p>
                  )}
                </div>

                {/* Available Slots */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Available Slots</label>
                  {!selectedDate ? (
                    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm min-h-[180px] flex items-center justify-center">
                      Select a date to view available times.
                    </div>
                  ) : loadingSlots ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="py-2.5 px-2 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse h-11" />
                      ))}
                    </div>
                    ) : availabilityError ? (
                      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-red-300 text-sm">
                        {availabilityError}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {isSelectedDateFullyBooked && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                            This date has no open slots. Booked and past times are shown with a slash.
                          </div>
                        )}
                        <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
                          <p className="text-xs text-zinc-400">
                            {availableSlotCount} available {availableSlotCount === 1 ? 'time' : 'times'} for{' '}
                            <span className="font-semibold text-amber-400">{formatDate(selectedDate)}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {slotOptions.map((slot, idx) => {
                            const isSelected = selectedSlot?.start === slot.start;
                            return (
                              <button
                                type="button"
                                key={`${slot.start}-${idx}`}
                                disabled={!slot.available}
                                onClick={() => {
                                  if (slot.available) setSelectedSlot(slot);
                                }}
                                title={slot.unavailableReason === 'past' ? 'This time has already passed' : slot.unavailableReason === 'booked' ? 'This time is already booked' : 'Available'}
                                className={`relative min-h-14 overflow-hidden py-3 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                                  isSelected
                                    ? 'border-amber-400 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                    : !slot.available
                                    ? 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                              >
                                {!slot.available && (
                                  <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[145%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] bg-red-500/70" />
                                )}
                                <span className="relative block">{formatTime(slot.start)}</span>
                                <span className="relative mt-0.5 block text-[10px] font-normal opacity-70">
                                  {slot.available ? `until ${formatTime(slot.end)}` : slot.unavailableReason === 'past' ? 'Passed' : 'Booked'}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: CUSTOMER DETAILS ── */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Customer Contact Details
              </h2>
              <div className="max-w-md space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Juan dela Cruz"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. juan@email.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1.5 block">Your secure management links will be sent here.</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 09171234567"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW & CHECKOUT ── */}
          {currentStep === 4 && selectedBarber && selectedService && selectedDate && selectedSlot && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Review & Proceed to Downpayment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary Card */}
                <div className="md:col-span-2 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-zinc-800 pb-2">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-zinc-500">Barber:</span>
                    <span className="text-zinc-200 font-medium">{selectedBarber.name}</span>

                    <span className="text-zinc-500">Service:</span>
                    <span className="text-zinc-200 font-medium">{selectedService.name}</span>

                    <span className="text-zinc-500">Duration:</span>
                    <span className="text-zinc-200 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" /> {selectedService.duration_mins} minutes
                    </span>

                    <span className="text-zinc-500">Date:</span>
                    <span className="text-amber-400 font-medium">{formatDate(selectedDate)}</span>

                    <span className="text-zinc-500">Time:</span>
                    <span className="text-amber-400 font-medium">{formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}</span>

                    <span className="text-zinc-500">Client:</span>
                    <span className="text-zinc-200 font-medium">{customerName}</span>

                    <span className="text-zinc-500">Email:</span>
                    <span className="text-zinc-200 font-medium break-all">{customerEmail}</span>

                    <span className="text-zinc-500">Phone:</span>
                    <span className="text-zinc-200 font-medium">{customerPhone}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-amber-500/10 pb-2 mb-4">Payment Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Total Price:</span>
                        <span className="text-zinc-300 font-semibold">{formatPrice(selectedService.total_price)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Downpayment Required:</span>
                        <span className="text-amber-400 font-bold">{formatPrice(selectedService.downpayment_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Remaining Balance:</span>
                        <span className="text-zinc-400">{formatPrice(parseAmount(selectedService.total_price) - parseAmount(selectedService.downpayment_amount))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-zinc-400 leading-relaxed">
                      <p>You will be redirected to our secure PayMongo checkout to process the downpayment and confirm your slot.</p>
                      <p className="mt-1.5 text-amber-500 font-bold uppercase tracking-tight italic">Note: All downpayments are strictly non-refundable.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
