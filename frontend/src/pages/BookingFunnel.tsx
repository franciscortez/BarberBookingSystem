import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  User, Calendar, CreditCard, ChevronRight, ChevronLeft,
  Clock, Scissors, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { getBarbers, getServices, getAvailability, createBooking } from '../services/api';
import type { Barber, Service } from '../types';

// ─── Utilities ────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalISODate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getStartOfToday = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

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
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);

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

  const steps = [
    { number: 1, label: 'Select Barber & Service', icon: Scissors },
    { number: 2, label: 'Choose Date & Time', icon: Calendar },
    { number: 3, label: 'Customer Details', icon: User },
    { number: 4, label: 'Review & Checkout', icon: CreditCard },
  ];

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setServices([]);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError(null);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError(null);
  };

  // ── Fetch barbers on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoadingBarbers(true);
        const list = await getBarbers();
        setBarbers(list);
        // Pre-select barber from URL param (?barberId=...)
        if (preselectedBarberId) {
          const found = list.find(b => b.id === preselectedBarberId);
          if (found) setSelectedBarber(found);
        }
      } catch {
        setError('Unable to load barbers. Please refresh the page.');
      } finally {
        setLoadingBarbers(false);
      }
    };
    fetchBarbers();
  }, [preselectedBarberId]);

  // ── Fetch services when barber is selected ─────────────────────────────────
  useEffect(() => {
    if (!selectedBarber) {
      return;
    }
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const list = await getServices(selectedBarber.id);
        setServices(list);
      } catch {
        setError('Unable to load services for this barber.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [selectedBarber]);

  // ── Fetch available slots when date or service changes ─────────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) {
      return;
    }
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setAvailabilityError(null);
        setSelectedSlot(null);
        const result = await getAvailability(selectedBarber.id, selectedDate, selectedService.id);
        setAvailableSlots(result.availableSlots);
      } catch {
        setAvailableSlots([]);
        setAvailabilityError('Unable to load available times for this date. Please try another date or refresh the page.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
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
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                Select Your Barber & Preferred Service
              </h2>
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
                          <div>
                            <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{barber.name}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">Master Grooming Specialist</p>
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
                  {!selectedBarber ? (
                    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm">
                      Select a barber first to view their services.
                    </div>
                  ) : loadingServices ? (
                    <div className="space-y-3"><ServiceSkeleton /><ServiceSkeleton /></div>
                  ) : services.length === 0 ? (
                    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm">
                      No services available for this barber.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.map(service => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                          <button
                            key={service.id}
                            onClick={() => handleSelectService(service)}
                            className={`w-full p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-left ${
                              isSelected
                                ? 'border-amber-500/60 bg-amber-500/8 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                            }`}
                          >
                            <div>
                              <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{service.name}</h4>
                              <span className={`text-xs flex items-center gap-1 mt-1 ${isSelected ? 'text-amber-400/70' : 'text-zinc-500'}`}>
                                <Clock className="w-3 h-3" /> {service.duration_mins} mins
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <span className={`font-bold text-sm block ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                {formatPrice(service.total_price)}
                              </span>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                Downpayment: {formatPrice(service.downpayment_amount)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
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
                        setAvailabilityError(null);
                      }}
                      disabled={{ before: getStartOfToday() }}
                      weekStartsOn={1}
                      className="booking-day-picker"
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
                        selected: 'bg-amber-500/10 text-amber-400',
                        today: 'text-amber-300',
                        disabled: 'text-zinc-700 opacity-50',
                        outside: 'text-zinc-700'
                      }}
                      modifiersClassNames={{
                        selected: 'rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50',
                        today: 'font-bold'
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
                  ) : availableSlots.length === 0 ? (
                    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm">
                      No slots available for {formatDate(selectedDate)}. Try another date.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
                        <p className="text-xs text-zinc-400">
                          {availableSlots.length} available {availableSlots.length === 1 ? 'time' : 'times'} for{' '}
                          <span className="font-semibold text-amber-400">{formatDate(selectedDate)}</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {availableSlots.map((slot, idx) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={`${slot.start}-${idx}`}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-3 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              <span className="block">{formatTime(slot.start)}</span>
                              <span className="mt-0.5 block text-[10px] font-normal opacity-70">until {formatTime(slot.end)}</span>
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
                        <span className="text-zinc-400">{formatPrice(parseFloat(String(selectedService.total_price)) - parseFloat(String(selectedService.downpayment_amount)))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      You will be redirected to our secure PayMongo checkout to process the downpayment and confirm your slot.
                    </p>
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
