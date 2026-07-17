import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getManagedBooking } from "../../services/api";
import type { Appointment } from "../../types";
import SuccessSection from "../../sections/user/success/SuccessSection";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token");
  const [pendingBookingToken] = useState<string | null>(
    () => urlToken || sessionStorage.getItem("pendingBookingToken"),
  );
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const noToken = !pendingBookingToken;

  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = pendingBookingToken;
    if (!token) return;

    const poll = async () => {
      pollCount.current += 1;
      try {
        const appt = await getManagedBooking(token);
        setAppointment(appt);
        setVerified(true);
        sessionStorage.removeItem("pendingBookingToken");
        if (pollTimer.current) clearInterval(pollTimer.current);
      } catch {
        if (pollCount.current >= MAX_POLLS) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setTimedOut(true);
        }
      }
    };

    poll();
    pollTimer.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [pendingBookingToken]);

  return (
    <SuccessSection
      noToken={noToken}
      timedOut={timedOut}
      verified={verified}
      appointment={appointment}
    />
  );
};

export default SuccessPage;
