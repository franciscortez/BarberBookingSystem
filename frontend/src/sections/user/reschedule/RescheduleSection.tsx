import React from "react";
import { Link } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  Calendar,
  ChevronLeft,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Appointment } from "../../../types";
import {
  bookingDayPickerClassNames,
  bookingDayPickerModifiersClassNames,
} from "../../../utils/dayPicker";
import {
  formatDate as formatDateBase,
  formatTime,
  getStartOfToday,
  parseLocalISODate,
  type SlotOption,
} from "../../../utils/booking";

const formatDate = (dateStr: string): string => formatDateBase(dateStr, true);

interface RescheduleSectionProps {
  token: string | null;
  appointment: Appointment | null;
  updatedAppointment: Appointment | null;
  loadingBooking: boolean;
  bookingError: string | null;
  rescheduled: boolean;
  submitting: boolean;
  submitError: string | null;
  selectedDate: string;
  slotOptions: SlotOption[];
  loadingSlots: boolean;
  selectedSlot: { start: string; end: string } | null;
  availabilityError: string | null;
  isSelectedDateFullyBooked: boolean;
  onSelectDate: (date: Date | undefined) => void;
  onSelectSlot: (slot: SlotOption) => void;
  onRescheduleSubmit: (e: React.FormEvent) => void;
}

const RescheduleSection: React.FC<RescheduleSectionProps> = ({
  token,
  appointment,
  updatedAppointment,
  loadingBooking,
  bookingError,
  rescheduled,
  submitting,
  submitError,
  selectedDate,
  slotOptions,
  loadingSlots,
  selectedSlot,
  availabilityError,
  isSelectedDateFullyBooked,
  onSelectDate,
  onSelectSlot,
  onRescheduleSubmit,
}) => {
  const selectedDateObject = parseLocalISODate(selectedDate);

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            Invalid Management Token
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            No secure token was detected. Please use the reschedule link from
            your booking confirmation email.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingBooking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-10 text-center space-y-5">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">
            Loading your booking details...
          </p>
        </div>
      </div>
    );
  }

  // ── Error loading ─────────────────────────────────────────────────────────
  if (bookingError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {bookingError}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (rescheduled) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Appointment Rescheduled
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Your appointment has been updated. A new confirmation email has been
            dispatched to your address.
          </p>
          {updatedAppointment && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left space-y-2.5 text-sm">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-zinc-400">Barber:</span>
                <span className="text-zinc-200 font-medium">
                  {updatedAppointment.barber_name ??
                    appointment?.barber_name ??
                    "—"}
                </span>
                <span className="text-zinc-400">Service:</span>
                <span className="text-zinc-200 font-medium">
                  {updatedAppointment.service_name ??
                    appointment?.service_name ??
                    "—"}
                </span>
                <span className="text-zinc-400">New Date:</span>
                <span className="text-amber-400 font-medium">
                  {formatDate(updatedAppointment.appointment_date)}
                </span>
                <span className="text-zinc-400">New Time:</span>
                <span className="text-amber-400 font-medium">
                  {formatTime(updatedAppointment.start_time)}
                </span>
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

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-5 sm:p-8 relative overflow-hidden">
        <div>
          <Link
            to="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" /> Reschedule
            Appointment
          </h2>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
            Choose a new date and time. Your downpayment is preserved.
          </p>
        </div>

        {/* Current Booking Context */}
        {appointment && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-left space-y-2 text-xs mt-5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider block">
              Current Booking
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-zinc-300">
              <span className="text-zinc-500">Stylist:</span>
              <span className="text-white font-medium">
                {appointment.barber_name ?? "—"}
              </span>
              <span className="text-zinc-500">Service:</span>
              <span className="text-white font-medium">
                {appointment.service_name ?? "—"}
              </span>
              <span className="text-zinc-500">Current Date:</span>
              <span className="text-amber-400 font-medium">
                {formatDate(appointment.appointment_date)}
              </span>
              <span className="text-zinc-500">Current Time:</span>
              <span className="text-amber-400 font-medium">
                {formatTime(appointment.start_time)}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={onRescheduleSubmit} className="space-y-5 mt-6">
          {/* Date picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Select New Date
            </label>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4 overflow-x-auto">
              <DayPicker
                mode="single"
                selected={selectedDateObject}
                onSelect={onSelectDate}
                disabled={{ before: getStartOfToday() }}
                weekStartsOn={1}
                className="booking-day-picker"
                modifiers={{
                  fullyBooked: isSelectedDateFullyBooked
                    ? selectedDateObject
                    : [],
                }}
                classNames={bookingDayPickerClassNames}
                modifiersClassNames={bookingDayPickerModifiersClassNames}
              />
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Available Slots
            </label>
            {!selectedDate ? (
              <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-xs">
                Pick a new date to see open slots.
              </div>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse"
                  />
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
                    This date has no open slots. Booked and past times are shown
                    with a slash.
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
                          if (slot.available) onSelectSlot(slot);
                        }}
                        title={
                          slot.unavailableReason === "past"
                            ? "This time has already passed"
                            : slot.unavailableReason === "booked"
                              ? "This time is already booked"
                              : "Available"
                        }
                        className={`relative min-h-12 overflow-hidden py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                          isSelected
                            ? "border-amber-400 bg-amber-500/10 text-amber-400"
                            : !slot.available
                              ? "border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {!slot.available && (
                          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[145%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] bg-red-500/70" />
                        )}
                        <span className="relative block">
                          {formatTime(slot.start)}
                        </span>
                        <span className="relative mt-0.5 block text-[9px] uppercase tracking-wider opacity-70">
                          {slot.available
                            ? "Open"
                            : slot.unavailableReason === "past"
                              ? "Passed"
                              : "Booked"}
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
              Rescheduling is subject to barber availability and slot conflicts.
              Token:{" "}
              <code className="text-amber-400 font-mono">
                {token.substring(0, 8)}...
              </code>
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
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating
                Reservation...
              </>
            ) : (
              <>Confirm Reschedule</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RescheduleSection;
