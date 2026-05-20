import type { Barber, Service, Appointment } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

/**
 * Helper to handle fetch responses cleanly
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.details || errorMessage;
    } catch {
      // Ignore JSON parse failure for non-JSON errors
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

/**
 * Barbers API
 */
export async function getBarbers(): Promise<Barber[]> {
  const response = await fetch(`${API_BASE_URL}/api/barbers`);
  return handleResponse<Barber[]>(response);
}

export async function getBarber(id: string): Promise<Barber> {
  const response = await fetch(`${API_BASE_URL}/api/barbers/${id}`);
  return handleResponse<Barber>(response);
}

/**
 * Services API
 */
export async function getServices(barberId?: string): Promise<Service[]> {
  const url = barberId 
    ? `${API_BASE_URL}/api/services?barberId=${encodeURIComponent(barberId)}`
    : `${API_BASE_URL}/api/services`;
  const response = await fetch(url);
  return handleResponse<Service[]>(response);
}

export async function getService(id: string): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/api/services/${id}`);
  return handleResponse<Service>(response);
}

/**
 * Availability API
 */
export interface AvailabilityResponse {
  barberId: string;
  date: string;
  serviceId?: string;
  duration: number;
  availableSlots: { start: string; end: string }[];
}

export async function getAvailability(
  barberId: string, 
  date: string, 
  serviceId?: string
): Promise<AvailabilityResponse> {
  let url = `${API_BASE_URL}/api/availability?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`;
  if (serviceId) {
    url += `&serviceId=${encodeURIComponent(serviceId)}`;
  }
  const response = await fetch(url);
  return handleResponse<AvailabilityResponse>(response);
}

/**
 * Appointments API
 */
export interface CreateBookingInput {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
}

export interface CreateBookingResponse {
  message: string;
  appointment: Appointment;
  checkout_url: string;
}

export async function createBooking(data: CreateBookingInput): Promise<CreateBookingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<CreateBookingResponse>(response);
}

export async function getManagedBooking(token: string): Promise<Appointment> {
  const response = await fetch(`${API_BASE_URL}/api/appointments/manage?token=${encodeURIComponent(token)}`);
  return handleResponse<Appointment>(response);
}

export interface RescheduleBookingInput {
  token: string;
  appointment_date: string;
  start_time: string;
}

export interface RescheduleBookingResponse {
  message: string;
  appointment: Appointment;
}

export async function rescheduleBooking(data: RescheduleBookingInput): Promise<RescheduleBookingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/appointments/reschedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<RescheduleBookingResponse>(response);
}

export interface CancelBookingResponse {
  message: string;
  appointment: Appointment;
}

export async function cancelBooking(token: string): Promise<CancelBookingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/appointments/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return handleResponse<CancelBookingResponse>(response);
}
