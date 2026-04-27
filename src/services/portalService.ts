/**
 * portalService.ts
 *
 * All functions here are MOCKED — they simulate network latency with setTimeout
 * and return fake-but-realistic data. When you have a real backend, replace
 * each function body with a fetch() call to the corresponding endpoint.
 *
 * The `paymentMode` parameter passed to getPostPaymentContext comes from the
 * Zustand store (the user's selection on the Review page). In production, the
 * backend would derive paymentType and isIndianCustomer from the actual
 * payment provider webhook — you would NOT need to pass them from the frontend.
 */

import { PROGRAM_DATA } from '../data/paymentLink';
import { isIndianCountryCode } from '../data/countryCodes';
import type {
  PostPaymentContext,
  CoursePurchase,
  NsdcFormData,
  PaymentType,
  EnrollmentStatus,
} from '../types/portal';
import type { Order, Payment, ToolAccess, NsdcSubmittedProfile } from '../types/order';

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Simulates a network round-trip of `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Indian order that still needs NSDC after a pre-mandate purchase — drives portal home card. */
export function isLegacyNsdcCatchUpOrder(order: Order): boolean {
  return Boolean(
    order.nsdcRequired &&
    !order.nsdcCompleted &&
    order.nsdcRetroactiveCollectionRequired,
  );
}

// ─── Mock data constants ────────────────────────────────────────────────────────

/**
 * The real LMS course the learner gets access to after FULL payment.
 */
const MAIN_COURSE: CoursePurchase = {
  id: 'course-main-aief',
  name: PROGRAM_DATA.title,
  lmsCourseId: 'lms-aief-2025',
  enrollmentStatus: 'NOT_ENROLLED',
  isPartialCourse: false,
};

/**
 * The dummy / placeholder course used for PARTIAL-payment learners.
 * It gives limited access until the remaining balance is paid.
 */
export const MOCK_PARTIAL_COURSE: CoursePurchase = {
  id: 'course-partial-aief',
  name: `${PROGRAM_DATA.title} – Preview Access`,
  lmsCourseId: 'lms-aief-2025-partial',
  enrollmentStatus: 'NOT_ENROLLED',
  isPartialCourse: true,
};

// ─── Service Functions ──────────────────────────────────────────────────────────

/**
 * Fetches the post-payment context for the portal page.
 *
 * Real version: GET /api/payments/:paymentId/context
 *
 * Mock behaviour:
 * - paymentType is derived from paymentMode (the user's selection on the Review page).
 * - isIndianCustomer is derived from the ISO country code the user selected on the
 *   Details page — no hardcoding required. The real backend should derive this from
 *   the payment currency / billing country returned by the payment provider.
 * - hasNsdcDataOnFile is `false` by default (NSDC form always shown on first run).
 *   Change to `true` to simulate a returning Indian customer.
 */
export async function getPostPaymentContext(
  _paymentId: string,
  paymentMode: 'full' | 'partial',
  countryCode: string,
): Promise<PostPaymentContext> {
  await delay(800);

  const paymentType: PaymentType = paymentMode === 'full' ? 'FULL' : 'PARTIAL';
  const course = paymentMode === 'full' ? MAIN_COURSE : MOCK_PARTIAL_COURSE;

  return {
    paymentId: _paymentId,
    paymentType,
    isIndianCustomer: isIndianCountryCode(countryCode), // driven by user's country selection
    customerEmail: '',   // Portal page fills this from the Zustand store
    hasNsdcDataOnFile: false,
    customerId: 'cust-mock-001',
    courses: [{ ...course }],
  };
}

/**
 * Submits the NSDC form data for a customer.
 *
 * Real version: POST /api/nsdc/submit
 * Body: { customerId, ...nsdcFields }
 * Returns: { hasNsdcDataOnFile: true }
 */
export async function submitNsdcData(
  _customerId: string,
  _data: NsdcFormData,
): Promise<{ hasNsdcDataOnFile: true }> {
  await delay(1000);
  // In production: validate Aadhaar, store against customer profile, etc.
  return { hasNsdcDataOnFile: true };
}

/**
 * Enrolls the customer into the given LMS course.
 *
 * Real version: POST /api/enrollments
 * Body: { customerId, lmsCourseId }
 * Returns: { enrollmentStatus }
 *
 * For PARTIAL courses → returns 'PARTIAL_ENROLLED'
 * For FULL courses    → returns 'FULL_ENROLLED'
 */
export async function enrollInCourse(
  _customerId: string,
  course: CoursePurchase,
): Promise<{ enrollmentStatus: EnrollmentStatus }> {
  await delay(1200);
  return {
    enrollmentStatus: course.isPartialCourse ? 'PARTIAL_ENROLLED' : 'FULL_ENROLLED',
  };
}

// ─── Customer Portal API (Order History) ────────────────────────────────────────
//
// These functions back the self-serve portal at /portal and /portal/orders/:id.
// In production: replace each body with a fetch() call to your backend.
// The logged-in user's ID is assumed to come from your auth layer (e.g. a cookie
// or Authorization header) — the frontend does not need to pass it explicitly.

/**
 * Mock orders for the portal home page.
 * One Indian learner with partial payment, one non-Indian with full payment.
 * Mutated in-place by submitNsdcForOrder / submitEmailConfirmation so UI
 * state refreshes correctly within the same browser session.
 */
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    userId: 'cust-mock-001',
    programName: PROGRAM_DATA.title,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    totalAmount: PROGRAM_DATA.totalFee,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'partial',
    pendingAmount: PROGRAM_DATA.remainingAmount,
    nsdcRequired: true,
    nsdcCompleted: true,
    /** This program is NSDC-aligned; set false to demo the editable NSDC form. */
    programNsdcMandatory: true,
    /** Returned from API after NSDC POST — drives read-only block in Get Access. */
    nsdcProfile: {
      email: 'learner@example.com',
      fullName: 'Demo Learner',
      fatherName: 'Demo Father Name',
      dateOfBirth: '1995-06-15',
    },
    lmsEnrollmentStatus: 'dummy',
    emailConfirmed: true, // email confirmed during checkout
    lmsLink: PROGRAM_DATA.redirect_url,
    couponLink: undefined,
    emilyLink: undefined,
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    // Snapshot of instalment plan at purchase — real API should persist this on the order
    installmentPlan: {
      bookingAmount: PROGRAM_DATA.bookingAmount,
      installments: PROGRAM_DATA.installments.map((i) => ({
        amount: i.amount,
        dueDate: i.dueDate,
        label: i.label,
      })),
    },
    paidScheduleSteps: 1, // only booking paid; bump to 2+ to simulate more progress in UI
    // Cohort starts ~12 days from now — within the 14-day proximity window for access upgrade
    cohortStartDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
  /**
   * Indian learner, older paid program: NSDC fields were not collected at purchase time
   * (`programNsdcMandatory: false`). `nsdcRetroactiveCollectionRequired` models a later
   * mandate to complete registration — see portal home + AccessPanel catch-up path.
   */
  {
    id: 'ORD-LEGACY',
    userId: 'cust-mock-001',
    programName: 'Performance Marketing Bootcamp (2024)',
    createdAt: new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 25_000,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: true,
    nsdcCompleted: false,
    programNsdcMandatory: false,
    nsdcRetroactiveCollectionRequired: true,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: PROGRAM_DATA.redirect_url,
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
  },
  {
    id: 'ORD-002',
    userId: 'cust-mock-001',
    programName: PROGRAM_DATA.title,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    totalAmount: 499,
    currency: 'USD',
    countryCode: 'US',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: false,
    nsdcCompleted: false,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: false, // simulate: still needs email confirmation
    lmsLink: PROGRAM_DATA.redirect_url,
    couponLink: 'https://example.com/coupon/US10',
    emilyLink: 'https://meetemily.ai/',
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
  },
];

const MOCK_PAYMENTS: Record<string, Payment[]> = {
  'ORD-LEGACY': [
    {
      id: 'PAY-LEG-001',
      orderId: 'ORD-LEGACY',
      amount: 25_000,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/PAY-LEG-001.pdf',
      isPartial: false,
    },
  ],
  'ORD-001': [
    {
      id: 'PAY-A001',
      orderId: 'ORD-001',
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/PAY-A001.pdf',
      isPartial: true,
    },
  ],
  'ORD-002': [
    {
      id: 'PAY-B001',
      orderId: 'ORD-002',
      amount: 499,
      currency: 'USD',
      status: 'success',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/PAY-B001.pdf',
      isPartial: false,
    },
  ],
};

/**
 * Returns all orders for the current user.
 *
 * Real version: GET /api/portal/orders
 * Auth: reads userId from session cookie / JWT on the backend.
 */
export async function getOrders(): Promise<Order[]> {
  await delay(700);
  // Replace this line: return fetch('/api/portal/orders').then(r => r.json())
  return [...MOCK_ORDERS];
}

/**
 * Mock tool entitlements per order.
 *
 * DB integration point:
 *   SELECT * FROM tool_accesses WHERE order_id = :orderId
 *
 * To add a new tool: add an entry here and extend the ToolName union in types/order.ts.
 */
const MOCK_TOOL_ACCESSES: Record<string, ToolAccess[]> = {
  'ORD-001': [
    {
      id: 'tool-001-emily',
      orderId: 'ORD-001',
      tool: 'emily_ai',
      displayName: 'Emily AI',
      status: 'pending_activation',
      activationUrl: 'https://meetemily.ai/',
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      notes: 'Free for 3 months with your GrowthSchool subscription.',
      includedInBooking: true, // paid as part of the booking amount — available immediately
    },
    {
      id: 'tool-001-perplexity',
      orderId: 'ORD-001',
      tool: 'perplexity',
      displayName: 'Perplexity',
      status: 'active',
      loginUrl: 'https://perplexity.ai',
      endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      notes: 'Free for 2 months with your GrowthSchool subscription.',
    },
  ],
  'ORD-002': [
    {
      id: 'tool-002-perplexity',
      orderId: 'ORD-002',
      tool: 'perplexity',
      displayName: 'Perplexity',
      status: 'active',
      loginUrl: 'https://perplexity.ai',
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      notes: 'Free for 1 month with your GrowthSchool subscription.',
    },
  ],
};

/**
 * Returns a single order, its payment history, and any bundled tool entitlements.
 *
 * Real version: GET /api/portal/orders/:orderId
 * Backend should JOIN tool_accesses on order_id in the same response.
 */
export async function getOrder(
  orderId: string,
): Promise<{ order: Order; payments: Payment[] }> {
  await delay(600);
  // Replace: return fetch(`/api/portal/orders/${orderId}`).then(r => r.json())
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  // DB integration point: JOIN with tool_accesses table (see MOCK_TOOL_ACCESSES above)
  const toolAccesses = MOCK_TOOL_ACCESSES[orderId] ?? [];
  return { order: { ...order, toolAccesses }, payments: MOCK_PAYMENTS[orderId] ?? [] };
}

/**
 * Submits NSDC registration details for an order.
 *
 * Real version: POST /api/portal/orders/:orderId/nsdc
 * Body: NsdcFormData fields
 * Side effects on backend: marks nsdcCompleted = true; may upgrade
 *   lmsEnrollmentStatus from 'dummy' → 'real' if payment is also complete.
 */
export async function submitNsdcForOrder(
  orderId: string,
  data: NsdcFormData,
): Promise<{ nsdcCompleted: true; profile: NsdcSubmittedProfile }> {
  await delay(1000);
  // Replace: return fetch(`/api/portal/orders/${orderId}/nsdc`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.json())
  const profile: NsdcSubmittedProfile = {
    email: undefined, // filled from order.customerEmail in UI; API may return canonical email
    fullName: data.fullName.trim(),
    fatherName: data.fatherName,
    dateOfBirth: data.dateOfBirth,
  };
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (order) {
    order.nsdcCompleted = true;
    order.nsdcRetroactiveCollectionRequired = false;
    order.nsdcProfile = { ...profile, email: order.customerEmail ?? profile.email };
    // Simulate backend upgrading enrollment if payment is fully complete
    if (order.paymentStatus === 'paid') {
      order.lmsEnrollmentStatus = 'real';
    }
    return { nsdcCompleted: true, profile: order.nsdcProfile };
  }
  return { nsdcCompleted: true, profile: { ...profile, email: profile.email } };
}

/**
 * Confirms the customer's email address for an order.
 *
 * Real version: POST /api/portal/orders/:orderId/email-confirmation
 * Side effects: marks emailConfirmed = true; triggers LMS account creation.
 */
export async function submitEmailConfirmation(
  orderId: string,
): Promise<{ emailConfirmed: true }> {
  await delay(800);
  // Replace: return fetch(`/api/portal/orders/${orderId}/email-confirmation`, { method: 'POST' }).then(r => r.json())
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (order) {
    order.emailConfirmed = true;
  }
  return { emailConfirmed: true };
}
