import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getManagedBooking, cancelBooking } from '../services/api';
import type { Appointment } from '../types';
import { formatDate as formatDateBase, formatOptionalPrice, formatTime } from '../utils/booking';

const formatDate = (dateStr: string): string => formatDateBase(dateStr, true);

const CancelBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState<boolean>(false);

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

  // ── Submit cancellation ──────────────────────────────────────────────────────
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      await cancelBooking(token);
      setCancelled(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Cancellation failed. Please try again.');
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
            No secure token was detected. Please use the cancellation link from your booking confirmation email.
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

  // ── Cancelled success ────────────────────────────────────────────────────────
  if (cancelled) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white">Appointment Cancelled</h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Your booking has been cancelled. As per our policy, the downpayment of{' '}
            <strong className="text-red-400">{formatOptionalPrice(appointment?.downpayment_amount)}</strong> has been forfeited.
            A cancellation notice has been sent to your email.
          </p>
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

  // ── Main Cancel Form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 relative overflow-hidden">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" /> Cancel Appointment
          </h2>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
            You are about to permanently cancel your confirmed grooming session.
          </p>
        </div>

        {/* Current Booking Details (real data) */}
        {appointment && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-left space-y-2 text-xs mt-5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider block">Booking to Cancel</span>
            <div className="grid grid-cols-2 gap-y-1.5 text-zinc-300">
              <span className="text-zinc-500">Stylist:</span>
              <span className="text-white font-medium">{appointment.barber_name ?? '—'}</span>
              <span className="text-zinc-500">Service:</span>
              <span className="text-white font-medium">{appointment.service_name ?? '—'}</span>
              <span className="text-zinc-500">Date:</span>
              <span className="text-red-400 font-medium">{formatDate(appointment.appointment_date)}</span>
              <span className="text-zinc-500">Time:</span>
              <span className="text-red-400 font-medium">{formatTime(appointment.start_time)}</span>
              <span className="text-zinc-500">Client:</span>
              <span className="text-white font-medium">{appointment.customer_name}</span>
            </div>
          </div>
        )}

        {/* Non-refundable Warning */}
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left flex gap-3.5 items-start mt-5">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Non-Refundable Downpayment Policy</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
              Your downpayment of{' '}
              <strong className="text-red-400">{formatOptionalPrice(appointment?.downpayment_amount)}</strong> will be{' '}
              <strong>forfeited</strong> upon cancellation and will not be refunded to your card or e-wallet.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleCancelSubmit} className="space-y-4 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling Reservation...</>
            ) : (
              <>Yes, Cancel Appointment</>
            )}
          </button>

          <Link
            to="/"
            className="w-full py-3.5 rounded-xl font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all flex items-center justify-center"
          >
            Keep My Booking
          </Link>
        </form>
      </div>
    </div>
  );
};

export default CancelBooking;
