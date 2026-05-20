import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar, ChevronLeft, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getManagedBooking, getAvailability, rescheduleBooking } from '../services/api';
import type { Appointment } from '../types';
import {
  buildSlotOptions,
  formatDate as formatDateBase,
  formatTime,
  getStartOfToday,
  parseLocalISODate,
  toLocalISODate,
  type SlotOption
} from '../utils/booking';

const formatDate = (dateStr: string): string => formatDateBase(dateStr, true);

const RescheduleBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rescheduled, setRescheduled] = useState<boolean>(false);
  const [updatedAppointment, setUpdatedAppointment] = useState<Appointment | null>(null);
  const selectedDateObject = parseLocalISODate(selectedDate);
  const isSelectedDateFullyBooked = Boolean(
    selectedDateObject &&
    !loadingSlots &&
    !availabilityError &&
    slotOptions.length > 0 &&
    slotOptions.every(slot => !slot.available)
  );

  // ── Fetch the existing booking on mount ─────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const fetchBooking = async () => {
      try {
        setLoadingBooking(true);
        const appt = await getManagedBooking(token, { signal: controller.signal });
        setAppointment(appt);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setBookingError(err instanceof Error ? err.message : 'Could not load booking details. Your token may be invalid or expired.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBooking(false);
        }
      }
    };

    fetchBooking();

    return () => controller.abort();
  }, [token]);

  // ── Fetch available slots when date changes ──────────────────────────────────
  useEffect(() => {
    if (!appointment || !selectedDate) {
      return;
    }
    const controller = new AbortController();

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        setAvailabilityError(null);
        const result = await getAvailability(appointment.barber_id, selectedDate, appointment.service_id, {
          signal: controller.signal
        });
        setSlotOptions(buildSlotOptions(selectedDate, result.duration, result.slots ?? result.availableSlots));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSlotOptions([]);
        setAvailabilityError(err instanceof Error ? err.message : 'Unable to load availability for this date.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => controller.abort();
  }, [appointment, selectedDate]);

  // ── Submit reschedule ────────────────────────────────────────────────────────
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedDate || !selectedSlot) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      const result = await rescheduleBooking({ token, appointment_date: selectedDate, start_time: selectedSlot.start });
      setUpdatedAppointment(result.appointment);
      setRescheduled(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Rescheduling failed. The selected slot may no longer be available.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── No token in URL ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Management Token</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            No secure token was detected. Please use the reschedule link from your booking confirmation email.
          </p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading booking ──────────────────────────────────────────────────────────
  if (loadingBooking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-10 text-center space-y-5">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  // ── Booking fetch error ──────────────────────────────────────────────────────
  if (bookingError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{bookingError}</p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (rescheduled) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white">Appointment Rescheduled</h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Your appointment has been updated. A new confirmation email has been dispatched to your address.
          </p>
          {updatedAppointment && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left space-y-2.5 text-sm">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-zinc-400">Barber:</span>
                <span className="text-zinc-200 font-medium">{updatedAppointment.barber_name ?? appointment?.barber_name ?? '—'}</span>
                <span className="text-zinc-400">Service:</span>
                <span className="text-zinc-200 font-medium">{updatedAppointment.service_name ?? appointment?.service_name ?? '—'}</span>
                <span className="text-zinc-400">New Date:</span>
                <span className="text-amber-400 font-medium">{formatDate(updatedAppointment.appointment_date)}</span>
                <span className="text-zinc-400">New Time:</span>
                <span className="text-amber-400 font-medium">{formatTime(updatedAppointment.start_time)}</span>
              </div>
            </div>
          )}
          <Link
            to="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all inline-flex items-center gap-1.5"
          >
            Return to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Main Form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 relative overflow-hidden">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" /> Reschedule Appointment
          </h2>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
            Choose a new date and time. Your downpayment is preserved.
          </p>
        </div>

        {/* Current Booking Context (real data) */}
        {appointment && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-left space-y-2 text-xs mt-5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider block">Current Booking</span>
            <div className="grid grid-cols-2 gap-y-1.5 text-zinc-300">
              <span className="text-zinc-500">Stylist:</span>
              <span className="text-white font-medium">{appointment.barber_name ?? '—'}</span>
              <span className="text-zinc-500">Service:</span>
              <span className="text-white font-medium">{appointment.service_name ?? '—'}</span>
              <span className="text-zinc-500">Current Date:</span>
              <span className="text-amber-400 font-medium">{formatDate(appointment.appointment_date)}</span>
              <span className="text-zinc-500">Current Time:</span>
              <span className="text-amber-400 font-medium">{formatTime(appointment.start_time)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleRescheduleSubmit} className="space-y-5 mt-6">
          {/* Date picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select New Date</label>
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
                  selected: 'bg-amber-500/10 text-amber-400',
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
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Available Slots</label>
            {!selectedDate ? (
              <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-xs">
                Pick a new date to see open slots.
              </div>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse" />
                ))}
              </div>
            ) : availabilityError ? (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-red-300 text-xs">
                {availabilityError}
              </div>
            ) : (
              <div className="space-y-3">
                {isSelectedDateFullyBooked && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                    This date has no open slots. Booked and past times are shown with a slash.
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {slotOptions.map((slot, idx) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={!slot.available}
                      onClick={() => {
                        if (slot.available) setSelectedSlot(slot);
                      }}
                      title={slot.unavailableReason === 'past' ? 'This time has already passed' : slot.unavailableReason === 'booked' ? 'This time is already booked' : 'Available'}
                      className={`relative min-h-12 overflow-hidden py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/10 text-amber-400'
                          : !slot.available
                          ? 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {!slot.available && (
                        <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[145%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] bg-red-500/70" />
                      )}
                      <span className="relative block">{formatTime(slot.start)}</span>
                      <span className="relative mt-0.5 block text-[9px] uppercase tracking-wider opacity-70">
                        {slot.available ? 'Open' : slot.unavailableReason === 'past' ? 'Passed' : 'Booked'}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Token Notice */}
          <div className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/5 flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Rescheduling is subject to barber availability and slot conflicts. Token:{' '}
              <code className="text-amber-400 font-mono">{token.substring(0, 8)}...</code>
            </p>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedDate || !selectedSlot}
            className="w-full py-3.5 rounded-xl font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating Reservation...</>
            ) : (
              <>Confirm Reschedule</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RescheduleBooking;
