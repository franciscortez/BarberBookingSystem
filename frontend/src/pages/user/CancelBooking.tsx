import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getManagedBooking, cancelBooking } from "../../services/api";
import type { Appointment } from "../../types";
import CancelSection from "../../sections/user/cancel/CancelSection";

const CancelBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [bookingAttempt, setBookingAttempt] = useState(0);
  const submissionLock = useRef(false);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const fetchBooking = async () => {
      try {
        setLoadingBooking(true);
        setBookingError(null);
        setAppointment(null);
        setSubmitError(null);
        setCancelled(false);
        const appt = await getManagedBooking(token, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setAppointment(appt);
      } catch (err) {
        if (controller.signal.aborted) return;
        setBookingError(
          err instanceof Error
            ? err.message
            : "Could not load booking details. Your token may be invalid or expired.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingBooking(false);
      }
    };

    fetchBooking();
    return () => controller.abort();
  }, [token, bookingAttempt]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionLock.current) return;
    if (!token) return;
    submissionLock.current = true;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await cancelBooking(token);
      setCancelled(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Cancellation failed. Please try again.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <CancelSection
      onRetry={() => setBookingAttempt((value) => value + 1)}
      token={token}
      appointment={appointment}
      loadingBooking={loadingBooking}
      bookingError={bookingError}
      cancelled={cancelled}
      submitting={submitting}
      submitError={submitError}
      onCancelSubmit={handleCancelSubmit}
    />
  );
};

export default CancelBooking;
