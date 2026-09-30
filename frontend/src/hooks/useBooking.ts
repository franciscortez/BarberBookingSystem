import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ApiError,
  getCatalog,
  getAvailability,
  createBooking,
} from "../services/api";
import { useAuth } from "./useAuth";
import type { Barber, Service } from "../types";
import {
  buildSlotOptions,
  parseLocalISODate,
  type SlotOption,
} from "../utils/booking";
import { isValidEmail, validateContact } from "../utils/publicForms";
export const useBooking = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedBarberId = searchParams.get("barberId");

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
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // Customer form
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const customerName = nameInput ?? user?.name ?? "";
  const customerEmail = emailInput ?? user?.email ?? "";
  const customerPhone = phoneInput ?? user?.phone ?? "";

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [slotAttempt, setSlotAttempt] = useState(0);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {},
  );
  const submissionLock = useRef(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const selectedDateObject = parseLocalISODate(selectedDate);
  const isSelectedDateFullyBooked = Boolean(
    selectedDateObject &&
    !loadingSlots &&
    !availabilityError &&
    slotOptions.length > 0 &&
    slotOptions.every((slot) => !slot.available),
  );
  const availableSlotCount = useMemo(
    () => slotOptions.filter((slot) => slot.available).length,
    [slotOptions],
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
      .map((barber) => ({
        barber,
        services: servicesByBarber.get(barber.id) ?? [],
      }))
      .filter((group) => group.services.length > 0);
  }, [barbers, selectedBarber, servicesByBarber]);

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };

  const handleSelectService = (service: Service) => {
    const serviceBarber = barbers.find(
      (barber) => barber.id === service.barber_id,
    );
    if (serviceBarber) setSelectedBarber(serviceBarber);
    setSelectedService(service);
    setSelectedDate("");
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
        setCatalogError(null);
        setLoadingServices(true);
        const catalog = await getCatalog({ signal: controller.signal });
        if (controller.signal.aborted) return;
        if (
          !catalog ||
          !Array.isArray(catalog.barbers) ||
          !Array.isArray(catalog.services)
        )
          throw new Error("Invalid catalog");
        setBarbers(catalog.barbers);
        setSelectedService(null);
        setSelectedDate("");
        setSelectedSlot(null);
        setSelectedBarber(null);
        setServices(catalog.services);
        if (preselectedBarberId) {
          const found = catalog.barbers.find(
            (b) => b.id === preselectedBarberId,
          );
          if (found) setSelectedBarber(found);
        }
      } catch {
        if (controller.signal.aborted) return;
        setCatalogError("Booking is unavailable right now. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBarbers(false);
          setLoadingServices(false);
        }
      }
    };
    fetchCatalog();
    return () => controller.abort();
  }, [preselectedBarberId, catalogAttempt]);

  // ── Fetch available slots when date or service changes ─────────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) return;
    const controller = new AbortController();
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setAvailabilityError(null);
        setSelectedSlot(null);
        const result = await getAvailability(
          selectedBarber.id,
          selectedDate,
          selectedService.id,
          {
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted) return;
        setSlotOptions(
          buildSlotOptions(
            selectedDate,
            result.duration,
            result.slots ?? result.availableSlots,
          ),
        );
      } catch {
        if (controller.signal.aborted) return;
        setSlotOptions([]);
        setAvailabilityError(
          "Unable to load available times for this date. Please try another date or refresh the page.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => controller.abort();
  }, [selectedBarber, selectedDate, selectedService, slotAttempt]);

  // ── Navigation guards ────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (currentStep === 1) return !!selectedBarber && !!selectedService;
    if (currentStep === 2) return !!selectedDate && !!selectedSlot;
    if (currentStep === 3)
      return (
        customerName.trim() !== "" &&
        isValidEmail(customerEmail) &&
        customerPhone.trim() !== ""
      );
    return true;
  };

  const handleNext = () => {
    if (submitting) return;
    if (currentStep === 3) {
      const validation = validateContact(
        customerName,
        customerEmail,
        customerPhone,
      );
      setContactErrors(validation);
      const invalid = Object.entries(validation).find(([, message]) => message);
      if (invalid) {
        document.getElementById("contact-" + invalid[0])?.focus();
        return;
      }
    }
    if (!canProceed()) return;
    setError(null);
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (submitting) return;
    setError(null);
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ── Submit booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async () => {
    if (
      submissionLock.current ||
      !selectedBarber ||
      !selectedService ||
      !selectedDate ||
      !selectedSlot ||
      !isValidEmail(customerEmail) ||
      !customerName.trim() ||
      !customerPhone.trim()
    )
      return;
    submissionLock.current = true;
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
        sessionStorage.setItem(
          "pendingBookingToken",
          result.appointment.management_token,
        );
      }
      window.location.href = result.checkout_url;
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.includes("slot")
      ) {
        setSelectedSlot(null);
        setCurrentStep(2);
        setSlotAttempt((value) => value + 1);
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create booking. Please try again.",
      );
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  const changeContact = (field: "name" | "email" | "phone", value: string) => {
    if (field === "name") setNameInput(value);
    if (field === "email") setEmailInput(value);
    if (field === "phone") setPhoneInput(value);
    setContactErrors((current) => ({ ...current, [field]: "" }));
  };
  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotOptions([]);
    setAvailabilityError(null);
  };
  const goToStep = (step: number) => {
    if (!submitting && step >= 1 && step <= currentStep) {
      setError(null);
      setCurrentStep(step);
    }
  };
  return {
    currentStep,
    barbers,
    services,
    loadingBarbers,
    loadingServices,
    selectedBarber,
    selectedService,
    servicesByBarber,
    visibleServiceGroups,
    selectedDate,
    selectedDateObject,
    selectedSlot,
    slotOptions,
    loadingSlots,
    availabilityError,
    availableSlotCount,
    isSelectedDateFullyBooked,
    customerName,
    customerEmail,
    customerPhone,
    contactErrors,
    error,
    catalogError,
    submitting,
    canProceed: canProceed(),
    handleNext,
    handleBack,
    handleSubmitBooking,
    goToStep,
    handleSelectBarber,
    handleSelectService,
    selectDate,
    selectSlot: setSelectedSlot,
    changeContact,
    retryCatalog: () => setCatalogAttempt((value) => value + 1),
    retrySlots: () => setSlotAttempt((value) => value + 1),
  };
};
