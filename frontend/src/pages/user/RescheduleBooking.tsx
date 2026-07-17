import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getManagedBooking,
  getAvailability,
  rescheduleBooking,
} from "../../services/api";
import type { Appointment } from "../../types";
import {
  buildSlotOptions,
  parseLocalISODate,
  toLocalISODate,
  type SlotOption,
} from "../../utils/booking";
import RescheduleSection from "../../sections/user/reschedule/RescheduleSection";

const RescheduleBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rescheduled, setRescheduled] = useState<boolean>(false);
  const [updatedAppointment, setUpdatedAppointment] =
    useState<Appointment | null>(null);

  const selectedDateObject = parseLocalISODate(selectedDate);
  const isSelectedDateFullyBooked = Boolean(
    selectedDateObject &&
    !loadingSlots &&
    !availabilityError &&
    slotOptions.length > 0 &&
    slotOptions.every((slot) => !slot.available),
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const fetchBooking = async () => {
      try {
        setLoadingBooking(true);
        const appt = await getManagedBooking(token, {
          signal: controller.signal,
        });
        setAppointment(appt);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
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
  }, [token]);

  useEffect(() => {
    if (!appointment || !selectedDate) return;
    const controller = new AbortController();

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        setAvailabilityError(null);
        const result = await getAvailability(
          appointment.barber_id,
          selectedDate,
          appointment.service_id,
          {
            signal: controller.signal,
          },
        );
        setSlotOptions(
          buildSlotOptions(
            selectedDate,
            result.duration,
            result.slots ?? result.availableSlots,
          ),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSlotOptions([]);
        setAvailabilityError(
          err instanceof Error
            ? err.message
            : "Unable to load availability for this date.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => controller.abort();
  }, [appointment, selectedDate]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedDate || !selectedSlot) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const result = await rescheduleBooking({
        token,
        appointment_date: selectedDate,
        start_time: selectedSlot.start,
      });
      setUpdatedAppointment(result.appointment);
      setRescheduled(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Rescheduling failed. The selected slot may no longer be available.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date ? toLocalISODate(date) : "");
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };

  return (
    <RescheduleSection
      token={token}
      appointment={appointment}
      updatedAppointment={updatedAppointment}
      loadingBooking={loadingBooking}
      bookingError={bookingError}
      rescheduled={rescheduled}
      submitting={submitting}
      submitError={submitError}
      selectedDate={selectedDate}
      slotOptions={slotOptions}
      loadingSlots={loadingSlots}
      selectedSlot={selectedSlot}
      availabilityError={availabilityError}
      isSelectedDateFullyBooked={isSelectedDateFullyBooked}
      onSelectDate={handleSelectDate}
      onSelectSlot={setSelectedSlot}
      onRescheduleSubmit={handleRescheduleSubmit}
    />
  );
};

export default RescheduleBooking;
