# Public account and appointment journey

Mode: Operate. Extends the established landing identity from commit `55008ef` into `/login`, `/signup`, `/book`, `/success`, `/reschedule-booking`, and `/cancel-booking`. Staff and invitation screens remain outside this surface.

## Direction contract

THESIS: A calm, clearly labeled appointment task inside Gentlemen’s Quarters’ dark editorial identity. Guest booking remains immediate; account creation is optional.

OWN-WORLD: Charcoal surfaces, warm-white text, muted readable labels, amber actions, Barlow Condensed headings and Manrope controls. Native fields, a clear four-step sequence, square initials instead of invented portraits, minimal rules, and six-pixel control radii.

STORY: Sign in or create an account for saved contact details; choose a live barber, service, date and time; review server-provided prices; continue to PayMongo; receive verified status. Email links preserve the established management policy.

FIRST VIEWPORT: Auth uses an empty-chair photograph beside a 440px form from 1024px; smaller screens present the form alone. Booking uses a 1320px workspace with a sticky 320px summary from 1024px and a static stacked summary before the form below it. Date and time split at 1280px. Follow-up receipts use a 640px reading column. Main actions follow each task’s required information. Shared containers use 56px gutters, reducing to 32px below 1200px and 20px below 768px.

FORM: Explicit implementation plan approved by the user; fixed existing visual system and specified route composition. Code-led extension, no new comp or generated asset. Signature interaction is selection updating the persistent appointment summary; step transitions focus their heading. Feedback is restrained 180ms control transitions; reduced motion disables transitions and skeleton pulse.

FINISH: The independent finish reviewer issued SHIP after inspecting 18 screenshots and current frontend source, with no material fixes required. DESIGN.md and its sidecar now record the shared public system. Authentication reuses interior-800.jpg and interior-1600.jpg with the landing assets' established provenance; no new raster or image edit ships in this extension.

## Implemented visual system

The normative shared palette lives in frontend/src/styles/public-brand.css. Landing aliases preserve the identity established in commit 55008ef. Task additions are control gray, error red, success green, and danger red, with exact values in DESIGN.md frontmatter. Task h1 uses Barlow Condensed at 48px desktop and 40px below 768px; body uses Manrope at 15px, and fields at 16px. Buttons retain 52px minimum height, 6px corners, and smaller controls retain 44px targets. The compact task header is 72px high.

Account pages provide labeled validation, password visibility, guest booking, safe local return destinations, preserved role defaults, and explicit submission feedback. Booking keeps a four-step sequence, live barber and service choices, calendar and unavailable-slot reasons, contact details, review edits, and the persistent summary. Step transitions focus their heading. Receipts use wrapping definition rows; management keeps the existing policy visible before submission. Staff and invitation presentation remain outside this system.

## Data and behavior

Only the landing page may use labeled JSON fallback. Account, booking, availability, management, and status use the real API. Guest booking remains available, and authenticated contact details may prefill fields without overwriting entered values. Explicit read retries and submission locks preserve user input. A 409 slot conflict returns the visitor to date and time selection. Cancellation forfeits the non-refundable downpayment; management still requires a confirmed appointment and at least two hours’ notice.

`/success` uses GET /api/appointments/status with UUID query validation and no-store receipt responses. This read-only endpoint is independent of management lead-time restrictions and reports payments.amount rather than current catalog pricing. URL token takes priority over the captured session fallback. Payment and appointment statuses are evaluated separately: paid plus confirmed, checked_in, completed, or no_show is a secured outcome; cancellation and failed payment are explicit terminal outcomes. Polling is sequential, waits three seconds after an attempt completes, stops after 40 attempts, and offers retry after delay. Missing or invalid tokens receive an invalid-link state.

Management and money writes are unchanged. No migrations, RLS or grants, deployment, or production-data changes are included. Deploy the new status endpoint alongside or before this frontend.

## Verification boundary

Browser acceptance uses intercepted API fixtures: no database writes, email delivery, or real PayMongo checkout. The final npm run test:public --prefix frontend run passed all 15 acceptance groups using an installed Chromium executable through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. All six routes were checked at widths 320, 390, 768, 1024, and 1440px. Interaction coverage includes validation, password visibility, signup auto-authentication, delayed contact loading, safe destination behavior and staff-role defaults, all four booking steps, 409 recovery, submission locks, offline read retries, a local checkout HTML fixture and stored-token return, actual receipt amounts, bounded sequential status polling and retry, polling cleanup on unmount, management outcomes, keyboard focus, reduced motion, and zoom-equivalent reflow.

The finish review covered 18 screenshots and current frontend source. Its SHIP disposition is a visual/source assessment, not measured browser contrast or live service acceptance. The implementation owner reported the final 18 focused mocked backend tests passing, along with frontend/backend builds, lint, type checks, changed-file formatting, and diff checks. Those checks do not establish real service integration.

No real backend ran for browser QA. Real database integration, PayMongo checkout/webhook processing, and email delivery remain unverified. Local Vite has no persisted VITE_API_URL; QA supplies a temporary environment value without changing user configuration. frontend/tests/publicJourney.cjs is the reproducible browser runner; frontend/tests/README.md documents setup and limits.
