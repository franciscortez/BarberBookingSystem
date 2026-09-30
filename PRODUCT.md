# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors looking for a barber, service, and appointment time. Administrators and barbers use separate staff screens.

## Product Purpose

Let visitors book without creating an account, pay the required downpayment, and manage their appointment through email links.

## Capabilities and Constraints

The landing page loads the existing /api/catalog endpoint and shows loading states while checking the backend. Successful responses supply the service menu, experience offerings, and barber roster together, including valid empty results. Live roster links enter /book with the selected barber ID.

If the API is unavailable, misconfigured, returns an invalid response, or takes longer than five seconds, the landing page falls back to frontend/src/sections/user/home/landing-catalog.json. In fallback mode, prices, service descriptions, and barber names are labeled illustrative, and preview links enter /book without passing synthetic barber IDs. Refreshing or revisiting the landing page retries loading; a late response after timeout does not replace the fallback. This behavior applies in development and production. The booking funnel continues to load its catalog, availability, and checkout from the existing API, without demonstration data.

The existing stack is React, Vite, TypeScript, Tailwind CSS, and React Router, with an Express/PostgreSQL backend. The public visual system now covers /, /login, /signup, /book, /success, /reschedule-booking, and /cancel-booking. Staff and invitation screens keep their existing presentation.

Account creation remains optional. Public task links can carry a safe local return destination; external and looping authentication destinations are rejected. Without a valid return destination, customer sign-in returns home, signup enters booking, and administrator and barber sign-in retain their staff dashboard defaults. Authenticated contact details can prefill the contact step. Booking follows four steps: barber and service, date and time, contact details, and review. Catalog, availability, prices, and checkout remain server-authoritative. Invalid selections, slot conflicts, unavailable reads, and pending submissions have explicit feedback without substituting demonstration data or clearing entered contact details.

The payment return page verifies the appointment through GET /api/appointments/status with a UUID token. This read-only, no-store endpoint reports the recorded payment amount from payments.amount and does not apply the management two-hour restriction. The URL token takes priority over the cached session token. The frontend polls sequentially with three seconds between completed attempts, caps a cycle at 40 attempts, and provides an explicit retry after delay. A secured appointment status plus paid payment is required for verified confirmation; cancellation and payment failure receive explicit outcomes. Receipt status is separate from permission to manage an appointment.

Cancellation and rescheduling retain the existing confirmed-appointment and at-least-two-hours-notice policy. Cancellation forfeits the non-refundable downpayment. Existing management and payment writes remain unchanged. No migration, RLS or grant change, deployment, or production-data change is part of this extension. The status endpoint must deploy alongside or before the frontend that consumes it.

## Brand Commitments

Preserve Gentlemen’s Quarters name and existing logo. Use dark editorial typography, empty-chair imagery, and grooming tools for the public identity. Keep the landing page atmosphere-first and account and appointment tasks focused on completing the visitor's action. Do not generate barber or customer portraits.

## Evidence on Hand

The project provides booking functionality, an existing logo, and demo catalog content. Interior and still-life images are illustrative. Authentication reuses the existing responsive interior JPEGs and their established provenance; the journey extension adds no raster assets. Real shop contact details, awards, reviews, years of experience, and biographies are not verified and must not be presented as factual evidence.

## Accessibility & Inclusion

Keep guest booking clear, visible keyboard focus, labeled navigation and form controls, semantic service disclosures, reduced-motion behavior, and responsive touch targets. Step transitions focus the new heading, selections expose their state, and errors have readable text.

The final fixture-based browser runner passed 15 acceptance groups. Checks cover all six task routes at widths 320, 390, 768, 1024, and 1440px, plus form validation, password visibility, signup auto-authentication, role defaults and rejected redirects, delayed contact prefill, booking steps, conflicts, submission locks, offline retries, a local checkout fixture and stored-token return, sequential status polling and unmount cleanup, recorded receipt amounts, management outcomes, focus, reduced motion, and zoom-equivalent reflow. The independent finish reviewer issued SHIP for 18 screenshots and current frontend source, with no material fixes required; no computed-browser-contrast claim is made.

QA intercepts all /api requests and starts Vite with a temporary VITE_API_URL; no backend ran for browser acceptance. Real database integration, PayMongo checkout and webhook processing, and email delivery remain unverified. Backend coverage uses focused mocked tests. These checks establish local interface behavior, not hosted or payment-service acceptance.
