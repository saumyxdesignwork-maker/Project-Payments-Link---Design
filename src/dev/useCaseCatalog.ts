/**
 * useCaseCatalog.ts — authoritative list of every learner/payment scenario in this app.
 *
 * Each entry has:
 *   id          — stable UC-AREA-NN identifier used for anchors and linking
 *   title       — human-readable name (≤ 8 words)
 *   description — 1-3 sentences explaining what is being tested / demonstrated
 *   section     — groups entries in the index UI
 *   primaryRoute — where to navigate for a direct (no-preset) visit
 *   applyPreset  — optional function that seeds Zustand before navigating; receives
 *                  the store's setter functions so the catalog stays logic-free
 *   navigateTo   — the route the preset button should navigate to (may differ from primaryRoute)
 *   navigateState — optional React Router location.state to pass (e.g. autoConfirmEmailFromCheckout)
 *   notes        — limitations / things you must toggle manually in mocks
 */

import type { NavigateFunction } from 'react-router-dom';
import { useStore } from '../store/useStore';

export type UcSection =
  | 'Checkout'
  | 'Post-payment'
  | 'Enrollment Wizard'
  | 'Order Portal';

export interface UseCase {
  id: string;
  title: string;
  description: string;
  section: UcSection;
  primaryRoute: string;
  /** If present, the "Apply preset & open" button is shown. */
  applyPreset?: (navigate: NavigateFunction) => void;
  notes?: string;
}

// ─── Helper: seed store then navigate ─────────────────────────────────────────

function applyIndianFullPayment(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/review');
}

function applyIndianPartialPayment(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('partial');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/review');
}

function applyInternationalFullPayment(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'US', email: 'learner@example.com', fullName: 'International Learner', phone: '+14155551234' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/review');
}

function applyDuplicatePaymentCheck(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  // "saumy@growthschool.io" or any email containing "test" triggers the duplicate banner
  s.setUserDetails({ countryCode: 'IN', email: 'saumy@growthschool.io', fullName: 'Saumy Test', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  navigate('/review');
}

function applyCouponDiscount(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  // Coupon is entered on the Review page itself; preset 20% multiplier to match SALES20 effect
  s.setCheckoutDiscountMultiplier(0.8);
  navigate('/review');
}

function applyBumpProducts(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  // Pre-select first bump (bp1) and first audio (ap1) — IDs from PROGRAM_DATA
  if (!s.selectedBumpIds.includes('bp1')) s.toggleBump('bp1');
  if (!s.selectedAudioIds.includes('ap1')) s.toggleAudio('ap1');
  s.setCheckoutAddonsTotal(13000 + 199); // bp1 price + ap1 price
  navigate('/review');
}

function applyGstCheckout(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'gst@company.in', fullName: 'GST User', phone: '9876543210' });
  s.setGstEnabled(true);
  s.setGstDetails({ companyName: 'Acme Pvt Ltd', gstin: '27AABCU9603R1ZV', billingAddress: '123 MG Road, Bengaluru' });
  navigate('/review');
}

function applySuccessFullIndia(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/success');
}

function applySuccessPartialIndia(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('partial');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/success');
}

function applySuccessFullInternational(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'US', email: 'learner@example.com', fullName: 'International Learner', phone: '+14155551234' });
  s.setCheckoutAddonsTotal(0);
  s.setCheckoutDiscountMultiplier(1);
  navigate('/success');
}

function applyEnrollIndiaFull(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  navigate('/portal/enroll');
}

function applyEnrollIndiaPartial(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('partial');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  navigate('/portal/enroll');
}

function applyEnrollIndiaAutoConfirm(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'IN', email: 'learner@growthschool.io', fullName: 'Demo Learner', phone: '9999999999' });
  navigate('/portal/enroll', { state: { autoConfirmEmailFromCheckout: true } });
}

function applyEnrollMagicLinkPath(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  // sidharth@growthschool.io is the magic-link demo email (MAGIC_LINK_DEMO_EMAIL in Portal.tsx)
  s.setUserDetails({ countryCode: 'IN', email: 'sidharth@growthschool.io', fullName: 'Sidharth', phone: '9999999999' });
  navigate('/portal/enroll');
}

function applyEnrollInternational(navigate: NavigateFunction) {
  const s = useStore.getState();
  s.setPaymentMode('full');
  s.setUserDetails({ countryCode: 'US', email: 'learner@example.com', fullName: 'International Learner', phone: '+14155551234' });
  navigate('/portal/enroll');
}

function applyPortalIndiaUser(_navigate: NavigateFunction) {
  const s = useStore.getState();
  // Set Indian country so the legacy NSDC catch-up card appears for ORD-LEGACY
  s.setUserDetails({ countryCode: 'IN' });
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const USE_CASE_CATALOG: UseCase[] = [
  // ── Checkout ────────────────────────────────────────────────────────────────

  {
    id: 'UC-CHECKOUT-01',
    section: 'Checkout',
    title: 'Details page — Indian customer',
    description: 'Entry page for an Indian learner. Shows cohort selector, duration options, NSDC compliance IDs (SKU + NSDC course name), and an INR price. Phone is collected with +91 prefix.',
    primaryRoute: '/',
    notes: 'No preset needed — the store defaults to IN and INR.',
  },
  {
    id: 'UC-CHECKOUT-02',
    section: 'Checkout',
    title: 'Details page — international customer',
    description: 'Same entry page but with a non-Indian country code (e.g. US). NSDC compliance IDs are hidden and the price converts to USD.',
    primaryRoute: '/',
    applyPreset: (navigate) => {
      useStore.getState().setUserDetails({ countryCode: 'US' });
      navigate('/');
    },
    notes: 'Preset only sets countryCode; learner fills the rest on the page.',
  },
  {
    id: 'UC-CHECKOUT-03',
    section: 'Checkout',
    title: 'Review — full payment (India)',
    description: 'The Review page with paymentMode = full and an Indian learner. Both Full and Partial option cards are shown; Full is pre-selected. Pay button text reads "Pay Full Amount".',
    primaryRoute: '/review',
    applyPreset: applyIndianFullPayment,
  },
  {
    id: 'UC-CHECKOUT-04',
    section: 'Checkout',
    title: 'Review — partial / booking payment (India)',
    description: 'Partial option is pre-selected. The installment schedule appears below the payment cards showing the booking amount and later payments. Pay button reads "Pay Booking Amount".',
    primaryRoute: '/review',
    applyPreset: applyIndianPartialPayment,
  },
  {
    id: 'UC-CHECKOUT-05',
    section: 'Checkout',
    title: 'Review — full payment (international)',
    description: 'International (non-Indian) learner paying in full. NSDC IDs are hidden, price is in USD. GST toggle is not shown.',
    primaryRoute: '/review',
    applyPreset: applyInternationalFullPayment,
  },
  {
    id: 'UC-CHECKOUT-06',
    section: 'Checkout',
    title: 'Review — duplicate payment detection',
    description: 'Email "saumy@growthschool.io" (or any email containing "test") triggers the duplicate-payment warning banner after the async check (~1 s). The Pay button is blocked until the user acknowledges.',
    primaryRoute: '/review',
    applyPreset: applyDuplicatePaymentCheck,
    notes: 'The trigger is hard-coded in checkDuplicateByEmail in Review.tsx. Replace with a real API call in production.',
  },
  {
    id: 'UC-CHECKOUT-07',
    section: 'Checkout',
    title: 'Review — coupon code discount (SALES20)',
    description: 'Applying coupon "SALES20" on the Review page gives 20% off the displayed total. The discount row appears and the summary updates live.',
    primaryRoute: '/review',
    applyPreset: applyCouponDiscount,
    notes: 'Enter coupon SALES20 in the coupon field on the Review page. The preset pre-seeds the multiplier but the coupon still needs to be typed to see the UI flow.',
  },
  {
    id: 'UC-CHECKOUT-08',
    section: 'Checkout',
    title: 'Review — bump and audio add-ons selected',
    description: 'Shows the Review summary with bp1 (ChatGPT prompts bundle) and ap1 (audiobook add-on) pre-selected. Add-ons are summed into the booking amount for partial payers.',
    primaryRoute: '/review',
    applyPreset: applyBumpProducts,
  },
  {
    id: 'UC-CHECKOUT-09',
    section: 'Checkout',
    title: 'Review — GST invoice fields',
    description: 'Indian learner with GST invoice enabled. Company name, GSTIN, and billing address fields are pre-filled and visible in the order summary.',
    primaryRoute: '/review',
    applyPreset: applyGstCheckout,
  },

  // ── Post-payment ─────────────────────────────────────────────────────────────

  {
    id: 'UC-SUCCESS-01',
    section: 'Post-payment',
    title: 'Success — full payment, Indian learner',
    description: 'Confirmation page for a full payment from India. Copy reads "Payment Confirmed!". An 8-second countdown auto-redirects to /portal/enroll (NSDC step). Partial payment schedule is not shown.',
    primaryRoute: '/success',
    applyPreset: applySuccessFullIndia,
  },
  {
    id: 'UC-SUCCESS-02',
    section: 'Post-payment',
    title: 'Success — partial / booking payment, Indian learner',
    description: 'Confirmation page for a partial payer. Copy reads "Booking confirmed". The installment schedule reminder is shown below the order summary. Countdown still redirects to enroll.',
    primaryRoute: '/success',
    applyPreset: applySuccessPartialIndia,
  },
  {
    id: 'UC-SUCCESS-03',
    section: 'Post-payment',
    title: 'Success — full payment, international learner',
    description: 'Same flow as UC-SUCCESS-01 but with countryCode = US. Price is in USD. The auto-redirect goes to /portal/enroll without the India-specific auto-confirm state, so Step 1 email entry is required.',
    primaryRoute: '/success',
    applyPreset: applySuccessFullInternational,
  },

  // ── Enrollment Wizard ────────────────────────────────────────────────────────

  {
    id: 'UC-ENROLL-01',
    section: 'Enrollment Wizard',
    title: 'Enroll — India, full payment, standard email',
    description: 'The 4-step wizard for a full-paying Indian learner. Step 1 confirms email, Step 2 collects NSDC data, Step 3 auto-enrolls, Step 4 shows the done screen. All 4 steps appear in the step indicator.',
    primaryRoute: '/portal/enroll',
    applyPreset: applyEnrollIndiaFull,
    notes: 'The mock always sets hasNsdcDataOnFile = false, so NSDC step always shows. Toggle the flag in portalService.ts to test the "skip NSDC" path.',
  },
  {
    id: 'UC-ENROLL-02',
    section: 'Enrollment Wizard',
    title: 'Enroll — India, partial payment',
    description: 'Same 4-step wizard but paymentMode = partial. The PartialPaymentStatus card (dark hero with installment progress) is embedded in the Step 4 done screen. The enrolled course is the preview/dummy course.',
    primaryRoute: '/portal/enroll',
    applyPreset: applyEnrollIndiaPartial,
  },
  {
    id: 'UC-ENROLL-03',
    section: 'Enrollment Wizard',
    title: 'Enroll — India auto-advance from Success (India checkout)',
    description: 'Simulates the direct jump from the Success page countdown: Step 1 email confirm is auto-skipped via location.state.autoConfirmEmailFromCheckout = true. The wizard opens directly at Step 2 (NSDC) or Step 3 (enrollment).',
    primaryRoute: '/portal/enroll',
    applyPreset: applyEnrollIndiaAutoConfirm,
  },
  {
    id: 'UC-ENROLL-04',
    section: 'Enrollment Wizard',
    title: 'Enroll — Step 1 magic-link / OTP path',
    description: 'Using email "sidharth@growthschool.io" on Step 1 triggers the magic-link demo path. The UI switches to a "Check your inbox" screen with a mock OTP of 123456.',
    primaryRoute: '/portal/enroll',
    applyPreset: applyEnrollMagicLinkPath,
  },
  {
    id: 'UC-ENROLL-05',
    section: 'Enrollment Wizard',
    title: 'Enroll — international learner (no NSDC)',
    description: 'Non-Indian learner. Step 2 (NSDC) is hidden from the step indicator and skipped entirely. Step 1 email confirm → Step 3 enrollment → Step 4 done.',
    primaryRoute: '/portal/enroll',
    applyPreset: applyEnrollInternational,
  },

  // ── Order Portal ─────────────────────────────────────────────────────────────

  {
    id: 'UC-PORTAL-01',
    section: 'Order Portal',
    title: 'Portal home — Indian user with legacy NSDC catch-up',
    description: 'The /portal home shows ORD-LEGACY (a fully-paid order where NSDC was not collected at checkout). When userDetails.countryCode = IN, the yellow LegacyNsdcCatchUpCard is shown at the top.',
    primaryRoute: '/portal',
    applyPreset: (navigate) => {
      applyPortalIndiaUser(navigate);
      navigate('/portal');
    },
  },
  {
    id: 'UC-PORTAL-02',
    section: 'Order Portal',
    title: 'Portal home — empty state',
    description: 'No orders available. Displays the empty bag illustration with a "Browse programs" link back to /.',
    primaryRoute: '/portal',
    notes: 'Not directly accessible via a simple preset since MOCK_ORDERS is module-level. Comment out MOCK_ORDERS array in portalService.ts to test this path.',
  },
  {
    id: 'UC-PORTAL-03',
    section: 'Order Portal',
    title: 'Order detail — ORD-001 (partial, dummy LMS, tools)',
    description: 'ORD-001 is an Indian partial payer with dummy LMS access. Shows the PartialPaymentStatus hero card, installment progress, and tool entitlements (Emily AI pending, Perplexity active). Cohort is within 14-day proximity window, so optimistic "real" access upgrade may be displayed.',
    primaryRoute: '/portal/orders/ORD-001',
    notes: 'Optimistic access upgrade (deriveEffectiveAccess) applies when paidScheduleSteps / total ≥ 0.65 AND cohort starts within 14 days. Currently paidScheduleSteps = 1 / 4 total steps = 25%, so upgrade does NOT trigger — bump paidScheduleSteps to 3 in portalService.ts to test the threshold.',
  },
  {
    id: 'UC-PORTAL-04',
    section: 'Order Portal',
    title: 'Order detail — ORD-002 (USD, email not confirmed)',
    description: 'International learner (USD), fully paid, but emailConfirmed = false. The AccessPanel shows the email confirmation step instead of access links.',
    primaryRoute: '/portal/orders/ORD-002',
  },
  {
    id: 'UC-PORTAL-05',
    section: 'Order Portal',
    title: 'Order detail — ORD-LEGACY (retroactive NSDC)',
    description: 'Older fully-paid Indian order where NSDC was not collected at purchase (programNsdcMandatory was false then). nsdcRetroactiveCollectionRequired = true triggers the NSDC catch-up form in the AccessPanel.',
    primaryRoute: '/portal/orders/ORD-LEGACY',
  },
];

export const UC_SECTIONS: UcSection[] = [
  'Checkout',
  'Post-payment',
  'Enrollment Wizard',
  'Order Portal',
];
