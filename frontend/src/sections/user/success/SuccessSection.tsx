import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';
import type { Appointment } from '../../../types';
import { formatDate as formatDateBase, formatOptionalPrice, formatTime } from '../../../utils/booking';

const formatDate = (dateStr: string): string => formatDateBase(dateStr, true);

interface SuccessSectionProps {
  noToken: boolean;
  timedOut: boolean;
  verified: boolean;
  appointment: Appointment | null;
}

const SuccessSection: React.FC<SuccessSectionProps> = ({ noToken, timedOut, verified, appointment }) => {
  // ── No token ──────────────────────────────────────────────────────────────
  if (noToken) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-5">
          <div className="inline-flex p-4 rounded-full bg-zinc-800 text-zinc-400 mx-auto">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white">No Booking Found</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We couldn't find a pending booking session. If you've already completed payment, check your email for your confirmation and management links.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            Return to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Timed out ─────────────────────────────────────────────────────────────
  if (timedOut) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/20 bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-5">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white">Taking Longer Than Expected</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your payment may still be processing. Check your email shortly — we'll send a confirmation once your booking is secured.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              Return to Home <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Verifying (polling) ───────────────────────────────────────────────────
  if (!verified) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-xl w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-10 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 text-amber-500 mx-auto">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verifying Transaction...</h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Connecting with PayMongo to confirm your downpayment. This usually takes a few seconds.
          </p>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse"
                style={{ animationDelay: `${i * 250}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmed ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center pt-28 pb-16 px-6 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-8 md:p-10 text-center relative overflow-hidden">
        {/* Success Checkmark */}
        <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)] mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-white">Booking Confirmed!</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed mt-3">
          Your downpayment has been verified and your appointment slot has been secured.
        </p>

        {/* Real Booking Details */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left space-y-3.5 my-8">
          <div className="border-b border-zinc-900 pb-2 flex justify-between items-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Reservation Details</span>
            <span className="text-amber-400 normal-case font-bold">Confirmed</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 text-sm">
            <span className="text-zinc-400">Stylist:</span>
            <span className="text-zinc-200 font-medium">{appointment?.barber_name ?? '—'}</span>

            <span className="text-zinc-400">Service:</span>
            <span className="text-zinc-200 font-medium">{appointment?.service_name ?? '—'}</span>

            <span className="text-zinc-400">Date:</span>
            <span className="text-amber-400 font-medium">
              {appointment?.appointment_date ? formatDate(appointment.appointment_date) : '—'}
            </span>

            <span className="text-zinc-400">Time:</span>
            <span className="text-amber-400 font-medium">
              {appointment?.start_time ? formatTime(appointment.start_time) : '—'}
            </span>

            <span className="text-zinc-400">Reference:</span>
            <span className="text-zinc-200 font-medium break-all">{appointment?.payment_reference_number ?? '—'}</span>

            <span className="text-zinc-400">Client:</span>
            <span className="text-zinc-200 font-medium">{appointment?.customer_name ?? '—'}</span>

            <span className="text-zinc-400">Downpayment:</span>
            <span className="text-zinc-200 font-medium">{formatOptionalPrice(appointment?.downpayment_amount)}</span>
          </div>

          <div className="border-t border-zinc-900 pt-3 flex gap-2 items-center text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>123 Premium Grooming Blvd, Suite 101, Metro Manila</span>
          </div>
        </div>

        {/* Email Callout */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-left flex gap-3.5 items-start mb-8">
          <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Management Links Sent</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
              A confirmation email with Reschedule and Cancel links has been sent to{' '}
              <strong className="text-zinc-300">{appointment?.customer_email}</strong>.
              No login is required to manage your booking.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all inline-flex items-center gap-1.5"
        >
          Return to Home <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default SuccessSection;
