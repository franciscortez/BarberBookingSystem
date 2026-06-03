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

### Phase 4: Frontend Setup, Layout & Core Pages (React JS)

- [x] **Project Initialization:**
  - [x] Scaffold React app using Vite (`npm create vite@latest`).
  - [x] Install dependencies: `react-router-dom`, `lucide-react`, and Tailwind CSS v4.
  - [x] Configure routing structure (Landing Page/Home, Booking Funnel, Success Page, Reschedule Page, Cancellation Page).
- [x] **Global Components & Navigation:**
  - [x] Create a responsive `Navbar` component with navigation links:
    - [x] **Home:** Smooth scrolls to or loads the hero/marketing sections.
    - [x] **Services:** Jumps to the global catalog of shop offerings.
    - [x] **Team:** Jumps to the section highlighting active shop barbers.
    - [x] **Book Now Button:** Prominent call-to-action (CTA) that links directly to the booking flow.
  - [x] Create a standard `Footer` layout with shop hours, contact details, and location.
- [x] **Landing Page Sections (Home Layout):**
  - [x] **Hero Section:** Engaging headline, background image, and a primary "Book Appointment" CTA button.
  - [x] **Services Section:** Grid displaying general categories or top-performing shop services with prices.
  - [x] **Team/Barbers Section:** Cards displaying active shop barbers, brief bios, and direct "Book with [Name]" shortcut buttons.
- [x] **State Management & Native API Utilities:**
  - [x] Create a dedicated native `fetch` API abstraction module (`api.ts`) to handle server communication without Axios.
  - [x] Implement data fetching custom hooks or state logic for retrieving general shop Barbers.
  - [x] Implement data fetching logic for Services (with support for optional filtering by Barber).

### Phase 5: Linear Booking Flow & Booking Management

- [x] **Step-by-Step Booking Funnel:**
  - [x] **Step 1: Selection Interface:** User selects a Barber and picks a Service. Ensure services are reactive if filtered by an explicit barber selection.
  - [x] **Step 2: Scheduling:** Render a dynamic calendar panel that fetches and visualizes available time slots based on the chosen date and barber.
  - [x] **Step 3: Customer Information:** Provide a secure `CustomerForm` collecting client Name, Email, and Phone number (frontend regex validation still pending).
  - [x] **Step 4: Check-out Summary:** Present an un-editable reservation receipt displaying service details, specific appointment slot, and the exact server-calculated downpayment amount.
  - [x] **Step 5: External Handshake:** Upon clicking "Proceed to Payment", show a loading spinner, fire the `POST /api/appointments` action, and gracefully redirect the browser context to the external PayMongo Checkout page.
- [x] **Post-Payment Processing:**
  - [x] Build a stylized `SuccessPage` matching the return redirection target setup in your PayMongo merchant panel.
  - [x] Add an implicit asynchronous polling script (or manual "Check Status" button) on the success page to check the backend database state until the PayMongo payment webhook confirms completion.
- [x] **Unauthenticated Booking Management (Token-Based):**
  - [x] Create Backend Endpoint `GET /api/appointments/manage?token=XYZ` to fetch confirmed bookings securely.
  - [x] Create Backend Endpoint `POST /api/appointments/reschedule` to update the date/time with token validation, slot validation, and transaction locking.
  - [x] Create Backend Endpoint `POST /api/appointments/cancel` to cancel a confirmed booking without refunding the downpayment.
  - [x] Send reschedule and cancellation confirmation emails after successful management actions.
  - [x] Create front-end booking management panels matching secure token-validated entry points allowing clients to cancel or pick a different date.
- [ ] **Production Polish:**
  - [x] Apply disabling states and skeleton load graphics to prevent user interaction or duplicate clicks during flight requests.
  - [ ] Inject global alert overlays or custom toast popups to gracefully report network failures or expired session states.
  - [x] Test double-booking scenario (two users trying to book the same slot simultaneously).

### Phase 6: Admin Panel & Management

> Status note: the current production-ready surface is the customer booking flow. Admin authentication plus barber/service CRUD exist on the backend, but the appointment dashboard endpoint and React admin UI are intentionally deferred until the admin workflow is designed and implemented as a separate feature slice.

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
