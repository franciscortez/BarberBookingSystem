---
name: Gentlemen’s Quarters landing
description: Dark editorial identity for the public landing page
colors:
  background: "#141414"
  surface: "#202020"
  foreground: "#f3f1eb"
  muted: "#b8b6b0"
  accent: "#e9c46a"
  rule: "#383833"
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
rounded:
  control: "6px"
spacing:
  section-top: "108px"
  section-bottom: "96px"
  mobile-section-top: "68px"
  mobile-section-bottom: "60px"
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
---

# Design System: Gentlemen’s Quarters landing

## Overview

**Creative North Star: "Time well spent"**

This system is scoped to the landing page at /. It pairs an empty-chair photographic hero with condensed display type, spacious service rows, a portrait-free roster, and clear booking actions. Booking, authentication, and staff screens retain their existing system.

**Key Characteristics:**
- Dark editorial surfaces with one amber accent.
- Large, readable typography and photographic material.
- Minimal borders, native disclosures, and useful motion.

## Colors

The normative values live in the frontmatter and map to the landing-page custom properties in frontend/src/sections/user/home/landing.css. Keep one dark theme throughout. Amber identifies actions and prices; muted text remains readable on dark surfaces.

## Typography

Display headings use self-hosted Barlow Condensed Bold; body text uses self-hosted Manrope variable. Font files and their OFL licenses live in frontend/public/fonts. TrueType files are currently shipped; WOFF2 conversion has not been performed. Fonts use swap and scoped family assignments.

## Layout

Desktop containers cap at 1320px with 56px side gutters. Gutters reduce to 32px below 1200px and 20px below 768px. Navigation is 72px high; desktop links switch to the mobile disclosure below 1024px. Hero text stays left of the chair on desktop and precedes the image on mobile. Multi-column experience, team, and booking-guide layouts collapse below 768px. Anchor sections reserve a 96px scroll offset.

## Elevation & Depth

Photography and tonal surfaces create depth. Rules separate content; decorative glows and gradient text are absent. Hero scrims serve text readability.

## Shapes

Interactive buttons use a 6px radius. Photo frames and roster initials remain square. Service entries use plain rows rather than nested cards.

## Components

Book Now uses an amber button; View Services uses an outlined button. Service rows are native details/summary disclosures showing each barber's actual displayed duration, total, and downpayment. Demo data is labeled, and demo roster buttons open generic booking rather than passing synthetic IDs.

Mobile navigation exposes expanded state, closes on Escape, and returns focus to its trigger. Account controls preserve sign-in and logout behavior. Visible focus, skip navigation, reduced-motion alternatives, and 44px-or-larger control targets are implemented in source.

## Do's and Don'ts

### Do

- Do preserve the existing brand name and logo.
- Do label demonstration prices, roster entries, and illustrative imagery.
- Do keep landing styles scoped and real booking data authoritative.
- Do test desktop and mobile browser behavior before claiming visual acceptance.

### Don't

- Don't generate barber portraits or fabricate reviews, awards, or biographies.
- Don't pass demonstration IDs into the live booking funnel.
- Don't add glow effects, gradient text, or repeated feature-card scaffolding.

Source and component checks passed. Browser acceptance is unverified because the environment blocked local server binding. Image assets use responsive JPEGs after the available converter failed to write AVIF.
