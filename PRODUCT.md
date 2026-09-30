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

The existing stack is React, Vite, TypeScript, Tailwind CSS, and React Router, with an Express/PostgreSQL backend. This redesign changes the public landing page; booking, authentication, and staff screens keep their existing presentation and behavior.

## Brand Commitments

Preserve Gentlemen’s Quarters name and existing logo. Use an atmosphere-first landing page with dark editorial typography, empty-chair imagery, and grooming tools. Do not generate barber or customer portraits.

## Evidence on Hand

The project provides booking functionality, an existing logo, and demo catalog content. Interior and still-life images are illustrative. Real shop contact details, awards, reviews, years of experience, and biographies are not verified and must not be presented as factual evidence.

## Accessibility & Inclusion

Keep guest booking clear, visible keyboard focus, labeled navigation controls, semantic service disclosures, reduced-motion behavior, and responsive touch targets. Browser acceptance remains unverified in the restricted development environment.
