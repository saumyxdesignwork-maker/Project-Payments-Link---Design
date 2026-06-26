# Project Payments Link — Design

**Live prototype:** [payments-link-design.vercel.app](https://payments-link-design.vercel.app)

**GitHub:** [saumyxdesignwork-maker/Project-Payments-Link---Design](https://github.com/saumyxdesignwork-maker/Project-Payments-Link---Design)

A React + TypeScript prototype for a checkout and post-purchase learner portal, covering the full NSDC and Non-NSDC payment link design — including brand theming, all checkout scenarios, enrollment wizard, and customer self-serve portal.

This app models the full learner journey:

- checkout details collection
- review and payment selection
- success / confirmation experience
- post-payment enrollment flow
- self-serve portal for orders and access

The current implementation is frontend-only and uses mocked data/services for portal, enrollment, NSDC, payments, invoices, and refunds.

## Prototype Scope

This repository is the single source of truth for the full Payment Link design prototype:

- **NSDC scenario** — NSDC branding, compliance alert cards, enrollment wizard NSDC step, retroactive NSDC catch-up flow
- **Non-NSDC scenario** — same checkout/portal without any NSDC UI, controlled by the header toggle
- **Brand switching** — Outskill and GrowthSchool themes switchable at runtime from the header
- **21 use-case scenarios** — indexed at `/dev/use-cases` for QA walkthroughs
- **Customer portal changes** — full self-serve portal: order history, order detail with installment timeline, Get Access dashboard, per-order access & NSDC actions

## Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand
- Heroicons

## Main Flows

### Checkout

- `/` - learner details
- `/review` - payment review and purchase confirmation
- `/success` - payment confirmation and next steps

### Enrollment Flow

- `/portal/enroll` - immediate post-payment email / NSDC / enrollment wizard

### Self-Serve Portal

- `/portal/orders` - order history
- `/portal/orders/:orderId` - order detail, installments, payments, invoices, refunds
- `/portal/access` - access-focused view of purchased programs
- `/portal/access/:orderId` - access detail, NSDC/email actions, tool links

### Dev Route

- `/dev/use-cases` - development-only route available when running in dev mode

## Local Development

### Requirements

- Node.js `24.x`
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

By default Vite will start a local dev server and print the URL in the terminal.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Notes:

- `npm run build` currently passes.
- `npm run lint` is configured in `package.json`, but the repo does not currently include an ESLint config file, so lint fails until that is added.

## Mock Data And Services

The app currently relies on local mock configuration and service layers:

- `src/data/paymentLink.ts`
  Holds the primary program, cohort, installment, add-on, and CTA configuration.

- `src/services/portalService.ts`
  Simulates API calls for portal data, NSDC submission, email confirmation, enrollment, payments, invoices, and refunds.

This makes the project easy to demo without a backend, but also means:

- no real authentication
- no real payment provider integration
- no persistent backend state
- no real LMS / NSDC API calls

## Design System Notes

Recent UI cleanup introduced semantic tokens for:

- `surface`
- `text`
- `border`
- `status`
- `whatsapp`

These are defined in `tailwind.config.js` and used through shared primitives and utilities in:

- `src/components/Button.tsx`
- `src/components/Card.tsx`
- `src/components/Badge.tsx`
- `src/components/Input.tsx`
- `src/index.css`

## Project Structure

```text
src/
  assets/              Static assets and logos
  components/          Reusable UI building blocks
  data/                Mock/config-driven content
  pages/               Checkout, success, portal, and dev pages
  services/            Mock API/service layer
  store/               Zustand app state
  types/               Shared TypeScript types
  utils/               Formatting and pricing helpers
```

## Current Limitations

- ESLint config is missing
- backend integrations are mocked
- some routes and flows are prototype-oriented rather than production-hardened
- visual and interaction behavior is optimized for demo and UI iteration

## Suggested Next Steps

If this is being moved toward production, the next logical steps are:

1. add a real ESLint configuration and CI checks
2. connect checkout and portal flows to real backend APIs
3. move mock portal data to server-backed responses
4. add automated tests for pricing, access logic, and route-level flows
5. document environment variables and deployment setup

