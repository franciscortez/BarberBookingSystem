# Barber Booking System - Project Overview

This project is a Barber Booking System designed to allow customers to view available barbers, browse services, and book appointments. To reduce friction, the system operates **without authentication**—customers will simply provide their name and contact details during the booking process. To secure bookings, it requires a **downpayment via PayMongo**.

## Phased Implementation Plan

### Phase 1: Database & Core Models
- [x] Configure PostgreSQL connection pool in backend.
- [x] Define `Barbers` table schema (id, name, created_at, updated_at).
- [x] Define `Services` table schema (id, barber_id, name, description, total_price, downpayment_amount, duration_mins, created_at, updated_at).
- [x] Define `Appointments` table schema (id, customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status [pending/confirmed/cancelled], management_token, created_at, updated_at).
- [x] Define `Payments` table schema to handle idempotency and tracking (id, appointment_id, paymongo_checkout_id, paymongo_payment_id, amount, status [pending/paid/failed], idempotency_key, created_at, updated_at).
- [x] Create SQL migration/initialization script to build tables.
- [x] Write a script to seed the database with initial dummy Barbers and Services.

### Phase 2: Backend API Development (Express.js)
- [x] **Barbers API:**
  - [x] Create `model/Barber.js`.
  - [x] Create `routes/barberRoutes.js`.
  - [x] Create controller function to handle `GET /api/barbers` (fetch all).
  - [x] Implement database query and error handling for barbers.
- [x] **Services API:**
  - [x] Create `model/Service.js`.
  - [x] Create `routes/serviceRoutes.js`.
  - [x] Create controller function to handle `GET /api/services` (fetch all).
  - [x] Create controller function to handle `GET /api/services?barberId=X` (fetch services for a specific barber).
  - [x] Implement database query and error handling for services.
- [x] **Availability API:**
  - [x] Create `model/Availability.js`.
  - [x] Create `routes/availabilityRoutes.js`.
  - [x] Create controller function `GET /api/availability?barberId=X&date=Y`.
  - [x] Write query to fetch overlapping confirmed/pending appointments for the specific date/barber.
  - [x] Implement logic to calculate available time slots based on barber working hours and existing appointments.

### Phase 3: PayMongo Integration & Booking API (Backend)
- [x] Setup PayMongo Secret API Keys in `.env`.
- [x] **Models:**
  - [x] Create `model/Appointment.js`.
  - [x] Create `model/Payment.js`.
- [x] **Booking Endpoint:**
  - [x] Create `POST /api/appointments` route.
  - [x] Validate incoming data (customer details, barber/service pairing, date, and time slot).
  - [x] Use service data from the database for duration, service name, and downpayment amount instead of trusting client-supplied values.
  - [x] Double-check database to ensure the requested time slot is still available.
  - [x] **Race Condition Fix:** Implemented PostgreSQL Transactions and row-level locking (`SELECT FOR UPDATE`) to guarantee single-booking for the same slot.
  - [x] Generate a `management_token` (e.g., UUID) for secure unauthenticated booking management.
  - [x] Insert a new appointment record with status `pending`.
  - [x] Generate an `idempotency_key` (e.g., UUID) and insert a new `Payments` record linked to the appointment.
  - [x] Create a PayMongo Checkout Session for the server-calculated downpayment amount and attach the local payment ID as the reference number.
  - [x] Mark the payment as `failed` and appointment as `cancelled` when checkout-session initialization fails.
  - [x] Return the PayMongo checkout URL and pending appointment ID to the frontend.
- [x] **Webhook & Email Integration:**
  - [x] Setup SMTP email delivery through Nodemailer.
  - [x] Create `POST /api/payments/webhook` route to receive PayMongo events.
  - [x] Preserve the raw webhook body and enforce PayMongo signature verification before processing events.
  - [x] Handle `checkout_session.payment.paid` event: update corresponding `Payments` and `Appointments` status to `confirmed`/`paid`.
  - [x] Ignore duplicate successful webhook deliveries so confirmation emails are not resent.
  - [x] **Send Confirmation Email:** Trigger an email to the customer with booking details plus secure `Reschedule` and `Cancel` links containing the `management_token`.
  - [x] Handle `payment.failed` events by marking the payment as `failed` and cancelling the linked appointment when the payment can be matched.



### Phase 4: Frontend Setup & UI (React JS)
- [ ] **Project Initialization:**
  - [x] Scaffold React app using Vite (`npm create vite@latest`).
  - [x] Install dependencies: `react-router-dom`, `lucide-react`, and Tailwind CSS v4.
  - [ ] Configure routing structure (Home, Booking Page, Success Page, Manage Booking Page).
- [ ] **UI Components:**
  - [ ] Create `Header`/`Navbar` component.
  - [ ] Create `BarberList` and `BarberCard` components.
  - [ ] Create `ServiceList` and `ServiceCard` components (filtered by selected barber).
  - [ ] Create `DateTimePicker` component to select available days and slots.
  - [ ] Create `CustomerForm` component (Name, Email, Phone inputs with validation).
- [ ] **State Management & API Integration:**
  - [ ] Create API utility file (`api.js`) using native `fetch` (replacing Axios).
  - [ ] Implement data fetching hook/logic for Barbers on the Home page using native `fetch`.
  - [ ] Implement data fetching hook/logic for Services (dependent on selected Barber) using native `fetch`.
  - [ ] Implement dynamic fetching of available slots when a user selects a Barber and a Date.

### Phase 5: Complete Booking Flow & Management Integration
- [ ] **Frontend Booking Flow:**
  - [ ] Step 1: User selects Barber.
  - [ ] Step 2: User selects Service (from services offered by the selected barber).
  - [ ] Step 3: User selects Date & available Time Slot.
  - [ ] Step 4: User fills in `CustomerForm`.
  - [ ] Step 5: Show Booking Summary & Downpayment amount.
  - [ ] Step 6: On "Proceed to Pay" click, call `POST /api/appointments`.
  - [ ] Step 7: Redirect user to the returned PayMongo Checkout URL.
- [ ] **Post-Payment Flow:**
  - [ ] Create a `SuccessPage` in React to handle the redirect back from PayMongo.
  - [ ] (Optional) Add polling or a "check status" button on the Success Page to verify backend webhook has processed the confirmation.
- [ ] **Booking Management (Reschedule & Cancel):**
  - [x] Create Backend Endpoint `GET /api/appointments/manage?token=XYZ` to fetch confirmed bookings securely.
  - [x] Create Backend Endpoint `POST /api/appointments/reschedule` to update the date/time with token validation, slot validation, and transaction locking.
  - [x] Create Backend Endpoint `POST /api/appointments/cancel` to cancel a confirmed booking without refunding the downpayment.
  - [x] Send reschedule and cancellation confirmation emails after successful management actions.
  - [ ] Create frontend booking-management screens for secure reschedule and cancellation flows.
- [ ] **Final Validation & Polish:**
  - [ ] Add loading states to all buttons and API calls.
  - [ ] Implement global error handling (toast notifications for API failures).
  - [x] Test double-booking scenario (two users trying to book the same slot simultaneously).

### Phase 6: Admin Panel & Management
- [x] **Admin Database & Auth:**
  - [x] Define `Admins` table schema in `init.sql` (id, username, password_hash, created_at).
  - [x] Implement basic JWT authentication for admin routes.
  - [x] Create `POST /api/auth/login` endpoint for authentication.
- [ ] **Admin Backend APIs:**
  - [x] Secure existing Barber CRUD routes or create new ones under `/api/admin/barbers`.
  - [x] Implement CRUD routes for `Services` (`POST`, `PUT`, `DELETE`).
  - [ ] Create `GET /api/appointments/all` endpoint for the dashboard.
- [ ] **Admin Frontend UI (React JS):**
  - [ ] Create Admin Login Page at `/admin/login`.
  - [ ] Build Admin Dashboard to view all appointments and statuses.
  - [ ] Build Barber Management section:
    - [x] Add Barber functionality.
    - [x] Edit/Update Barber details.
    - [x] Remove Barber functionality.
  - [ ] Build Service Management section (Add, Edit, Remove services for specific barbers).
