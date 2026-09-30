---
name: Gentlemen’s Quarters public journey
description: Dark editorial identity for discovery, accounts, and appointments
colors:
  background: "#141414"
  surface: "#202020"
  foreground: "#f3f1eb"
  muted: "#b8b6b0"
  accent: "#e9c46a"
  rule: "#383833"
  control: "#77776c"
  error: "#f2aaa0"
  success: "#bad9b4"
  danger: "#912f32"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(64px, 6.7vw, 96px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
  task-headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  task-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.3
  field:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
rounded:
  control: "6px"
spacing:
  section-top: "108px"
  section-bottom: "96px"
  mobile-section-top: "68px"
  mobile-section-bottom: "60px"
  field-gap: "8px"
  form-gap: "20px"
  task-gap: "24px"
  task-intro-gap: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "13px 27px"
    height: "52px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "13px 27px"
    height: "52px"
  task-button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "52px"
  task-button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "52px"
  task-button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "52px"
  task-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "52px"
---

# Design System: Gentlemen’s Quarters public journey

## Overview

**Creative North Star: "Time well spent"**

This system covers the landing page at / and the public account and appointment routes: /login, /signup, /book, /success, /reschedule-booking, and /cancel-booking. The landing page pairs an empty-chair photographic hero with condensed display type, spacious service rows, a portrait-free roster, and clear booking actions. Task screens carry the same identity into focused forms, a persistent appointment summary, and restrained receipts. Staff and invitation screens retain their existing presentation.

**Key Characteristics:**

- Dark editorial surfaces with one amber accent.
- Large, readable typography and photographic material.
- Minimal borders, native disclosures, and useful motion.
- Clearly labeled fields and status feedback, with guest booking always available.

## Colors

The normative values live in the frontmatter and map to the shared custom properties in frontend/src/styles/public-brand.css. Landing aliases keep the established palette and appearance in frontend/src/sections/user/home/landing.css. Keep one dark theme throughout. Amber identifies primary actions, selection, and prices; warm-white carries main text, and muted text carries supporting information. Charcoal surfaces and subtle rules establish hierarchy.

Control gray defines task-field and selectable-option borders. Soft red and green distinguish error and successful feedback; the deeper danger red marks the cancellation action. Status messages always include text rather than relying on color alone.

**The Shared Identity Rule.** Extend the shared public tokens for public tasks; keep staff styling outside this system.

## Typography

Display headings use self-hosted Barlow Condensed Bold; body text uses self-hosted Manrope variable. Font files and their OFL licenses live in frontend/public/fonts. TrueType files are currently shipped; WOFF2 conversion has not been performed. Fonts use swap and scoped family assignments.

The landing hero retains its display scale. Task h1 uses the smaller task-headline role, reducing to 40px below 768px. Task h2 uses Manrope at the task-title scale; h3 uses 16px and weight 650. Fields use the field role to remain legible on mobile. Supporting form text uses 14px; explanatory copy uses a maximum line measure of 65ch where constrained. Prices and receipt values use tabular numerals.

## Layout

Desktop containers cap at 1320px with 56px side gutters. Gutters reduce to 32px below 1200px and 20px below 768px. Navigation is 72px high; desktop links switch to the mobile disclosure below 1024px. Hero text stays left of the chair on desktop and precedes the image on mobile. Multi-column experience, team, and booking-guide layouts collapse below 768px. Anchor sections reserve a 96px scroll offset.

Task routes use a compact 72px header, content-first main region, and simple footer. At 1024px and above, authentication pairs an illustrative empty-chair image with a form capped at 440px. Below that breakpoint, the form stands alone. Booking uses a flexible workspace beside a sticky 320px summary; below 1024px, the summary becomes static and precedes the form. Management screens share this summary language. Date and time sit side by side from 1280px. Status and receipt screens use a 640px reading column.

Task content begins 48px below the header, reducing to 32px below 768px. Form rows use the documented field and form gaps. Calendar controls retain 44px targets; time slots use three columns on wider screens and two below 768px. At narrow widths, the header retains its accessible brand name while hiding the visible wordmark.

## Elevation & Depth

Photography and tonal surfaces create depth. Rules separate content; decorative glows and gradient text are absent. Hero scrims serve text readability. Task summaries and notices use the raised charcoal tone without shadows. Selected options use a faint amber wash with an amber border.

## Shapes

Interactive buttons, fields, selectable options, task notices, and summaries use the control radius. Photo frames and roster initials remain square. Landing service entries use plain rows rather than nested cards; booking options group selectable information without decorating every text block.

## Components

Book Now uses an amber button; View Services uses an outlined button. Service rows are native details/summary disclosures showing each barber's actual displayed duration, total, and downpayment. Demo data is labeled, and demo roster buttons open generic booking rather than passing synthetic IDs.

Task primary buttons carry amber, secondary buttons use a visible outline, and cancellation uses danger red. Buttons have a 52px minimum height; smaller links and password visibility controls retain 44px targets. Disabled actions have an explicit muted state and cannot submit. Task hover and border feedback use restrained 180ms transitions.

Fields have explicit labels, dark backgrounds, visible control borders, and inline error text. Password visibility controls have accessible names. The four-step booking sequence exposes the current step and focuses its heading after navigation. Barber and service options expose selected state; summary details update with selection. Unavailable time slots are disabled and carry a reason.

Receipts and management details use simple definition rows with wrapping values. Loading, offline, invalid-link, pending-payment, failed-payment, cancellation, delayed-confirmation, and successful states keep the same hierarchy. Explicit read retries retain task input.

Mobile landing navigation exposes expanded state, closes on Escape, and returns focus to its trigger. Account controls preserve sign-in and logout behavior. Public routes include skip navigation and visible amber focus. Reduced motion disables task transitions and skeleton pulse; the landing hero retains its existing reduced-motion alternative.

## Do's and Don'ts

### Do

- Do preserve the existing brand name and logo.
- Do label demonstration prices, roster entries, and illustrative imagery.
- Do keep shared public styling scoped and real booking data authoritative.
- Do preserve labels, visible focus, readable status text, and minimum touch targets across every state.
- Do distinguish intercepted browser checks from live backend and payment acceptance.

### Don't

- Don't generate barber portraits or fabricate reviews, awards, or biographies.
- Don't pass demonstration IDs into the live booking funnel.
- Don't add glow effects, gradient text, or repeated feature-card scaffolding.

The initial landing pass could not bind a local server; its historical browser limitation is superseded for the six task routes by fixture-based browser checks. An independent finish reviewer issued SHIP after inspecting 18 screenshots and current frontend source, with no material fixes required. This does not establish measured browser contrast or live payment acceptance. The surface brief records the verification boundary.

Image assets remain responsive JPEGs after the original converter failed to write AVIF. Authentication reuses the existing interior-800.jpg and interior-1600.jpg assets and their established provenance; this extension adds no raster assets or image edits.
