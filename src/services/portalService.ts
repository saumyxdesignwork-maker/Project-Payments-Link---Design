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
import type { Order, Payment, Receipt, Invoice, Refund, ToolAccess, NsdcSubmittedProfile } from '../types/order';

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
    cohortStartDate: '2026-07-05',
    cohortId: 'c3',
    cohortChangeUsed: false,
    // Per-product access configs — each product has its own onboarding state
    purchasedProducts: [
      {
        id: 'prod-001-main',
        name: PROGRAM_DATA.title,
        productTag: 'Main Program',
        accessType: 'nsdc_onboarding',
        nsdcSteps: {
          whatsappUrl: PROGRAM_DATA.whatsapp_group_url ?? 'https://wa.me/example',
          nsdcEnrollPath: '/portal/enroll',
        },
      },
      {
        id: 'prod-001-addon',
        name: 'AI Tools Masterclass',
        productTag: 'Add-on',
        accessType: 'direct_link',
        accessUrl: 'https://lms.growthschool.io/ai-tools',
      },
    ],
  },
  /**
   * Indian learner who paid in full across all 4 instalments (booking + 3 part-payments).
   * Dedicated demo order for validating the multi-receipt / installment receipt use case.
   * Receipts are seeded out of chronological order in MOCK_RECEIPTS to exercise the UI sort.
   */
  {
    id: 'ORD-INSTALLMENTS',
    userId: 'cust-mock-001',
    programName: PROGRAM_DATA.title,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    totalAmount: PROGRAM_DATA.totalFee,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: true,
    nsdcCompleted: true,
    programNsdcMandatory: true,
    nsdcProfile: {
      email: 'learner@example.com',
      fullName: 'Demo Learner',
      fatherName: 'Demo Father Name',
      dateOfBirth: '1995-06-15',
    },
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: PROGRAM_DATA.redirect_url,
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    // Plan snapshot kept on the order so the payment history makes sense
    installmentPlan: {
      bookingAmount: PROGRAM_DATA.bookingAmount,
      installments: PROGRAM_DATA.installments.map((i) => ({
        amount: i.amount,
        dueDate: i.dueDate,
        label: i.label,
      })),
    },
    paidScheduleSteps: 4, // booking + all 3 instalments paid
    cohortStartDate: '2026-07-05',
    cohortId: 'c3',
    cohortChangeUsed: false,
    purchasedProducts: [
      {
        id: 'prod-inst-main',
        name: PROGRAM_DATA.title,
        productTag: 'Main Program',
        accessType: 'nsdc_onboarding',
        nsdcSteps: {
          whatsappUrl: PROGRAM_DATA.whatsapp_group_url ?? 'https://wa.me/example',
          nsdcEnrollPath: '/portal/enroll',
        },
      },
    ],
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
    cohortStartDate: '2026-08-15',
    cohortId: 'c6',
    cohortChangeUsed: false,
    purchasedProducts: [
      {
        id: 'prod-leg-main',
        name: 'Performance Marketing Bootcamp (2024)',
        productTag: 'Main Program',
        accessType: 'direct_link',
        accessUrl: PROGRAM_DATA.redirect_url,
      },
      {
        id: 'prod-leg-audio',
        name: 'Marketing Psychology Audio Series',
        productTag: 'Audio Add-on',
        accessType: 'email_24h',
      },
    ],
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
    cohortStartDate: '2026-08-01',
    cohortId: 'c5',
    cohortChangeUsed: false,
    purchasedProducts: [
      {
        id: 'prod-002-main',
        name: PROGRAM_DATA.title,
        productTag: 'Main Program',
        accessType: 'email_24h',
      },
    ],
  },
  /**
   * International learner, paid in full, email not yet confirmed.
   * Dedicated mock for the email-confirmation card on the Get Access page.
   * Unlike ORD-002, this order is never mutated by the NSDC flow so the
   * email-pending state is always visible in a fresh browser session.
   */
  {
    id: 'ORD-EMAIL',
    userId: 'cust-mock-001',
    programName: 'Growth Marketing Accelerator',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 299,
    currency: 'USD',
    countryCode: 'US',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: false,
    nsdcCompleted: false,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: 'https://lms.growthschool.io/growth-marketing',
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    cohortStartDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cohortId: 'c7',
    cohortChangeUsed: false,
    purchasedProducts: [
      {
        id: 'prod-email-main',
        name: 'Growth Marketing Accelerator',
        productTag: 'Main Program',
        accessType: 'email_24h',
      },
    ],
  },
  {
    id: 'ORD-DONE',
    userId: 'cust-mock-001',
    programName: 'Digital Marketing Foundations',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 12_000,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: true,
    nsdcCompleted: true,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: 'https://lms.growthschool.io/digital-marketing',
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    completionStatus: 'completed',
    certificateUrl: 'https://certificates.growthschool.io/DMF-2024-DEMO.pdf',
    completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  /**
   * Case 3 — Refund scenario.
   * Indian learner, fully paid in one shot, non-NSDC program.
   * Because a final invoice exists at the time of refund, the refund document
   * is a Credit Note (not a Refund Voucher).
   * Documents: 1 Receipt + 1 Final Invoice + 1 Credit Note.
   */
  {
    id: 'ORD-REFUND',
    userId: 'cust-mock-001',
    programName: 'Social Media Marketing Sprint',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 8_000,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: false,
    nsdcCompleted: false,
    programNsdcMandatory: false,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: 'https://lms.growthschool.io/social-media',
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    purchasedProducts: [
      {
        id: 'prod-refund-main',
        name: 'Social Media Marketing Sprint',
        productTag: 'Main Program',
        accessType: 'direct_link',
        accessUrl: 'https://lms.growthschool.io/social-media',
      },
    ],
  },
  /**
   * Case 6 — Single lump-sum full payment.
   * Indian learner, paid the full amount in one payment (no instalment plan),
   * non-NSDC program. Clean demo of what a simple full-payment order looks like:
   * 1 Receipt + 1 Final Invoice (GST) + no refunds.
   */
  {
    id: 'ORD-FULLPAY',
    userId: 'cust-mock-001',
    programName: 'Content Marketing Masterclass',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 15_000,
    currency: 'INR',
    countryCode: 'IN',
    paymentStatus: 'paid',
    pendingAmount: 0,
    nsdcRequired: false,
    nsdcCompleted: false,
    programNsdcMandatory: false,
    lmsEnrollmentStatus: 'real',
    emailConfirmed: true,
    lmsLink: 'https://lms.growthschool.io/content-marketing',
    customerEmail: 'learner@example.com',
    customerName: 'Demo Learner',
    purchasedProducts: [
      {
        id: 'prod-fullpay-main',
        name: 'Content Marketing Masterclass',
        productTag: 'Main Program',
        accessType: 'direct_link',
        accessUrl: 'https://lms.growthschool.io/content-marketing',
      },
    ],
  },
];

const MOCK_PAYMENTS: Record<string, Payment[]> = {
  /** ORD-REFUND — single full payment, then a refund was issued */
  'ORD-REFUND': [
    {
      id: 'PAY-REFUND-01',
      orderId: 'ORD-REFUND',
      amount: 8_000,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-REFUND-01.pdf',
      isPartial: false,
    },
  ],
  /** ORD-FULLPAY — single lump-sum full payment */
  'ORD-FULLPAY': [
    {
      id: 'PAY-FULLPAY-01',
      orderId: 'ORD-FULLPAY',
      amount: 15_000,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-FULLPAY-01.pdf',
      isPartial: false,
    },
  ],
  'ORD-INSTALLMENTS': [
    {
      id: 'PAY-INST-001',
      orderId: 'ORD-INSTALLMENTS',
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-INST-01.pdf',
      isPartial: true,
    },
    {
      id: 'PAY-INST-002',
      orderId: 'ORD-INSTALLMENTS',
      amount: PROGRAM_DATA.installments[0].amount,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-INST-02.pdf',
      isPartial: true,
    },
    {
      id: 'PAY-INST-003',
      orderId: 'ORD-INSTALLMENTS',
      amount: PROGRAM_DATA.installments[1].amount,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-INST-03.pdf',
      isPartial: true,
    },
    {
      id: 'PAY-INST-004',
      orderId: 'ORD-INSTALLMENTS',
      amount: PROGRAM_DATA.installments[2].amount,
      currency: 'INR',
      status: 'success',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      receiptUrl: 'https://example.com/receipts/RCP-INST-04.pdf',
      isPartial: true,
    },
  ],
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
 * Mock receipts per order.
 *
 * DB integration point:
 *   SELECT * FROM receipts WHERE order_id = :orderId ORDER BY issued_at DESC
 *
 * One receipt is issued per successful payment. ORD-001 has one (booking only),
 * ORD-LEGACY has one (full payment), ORD-002 has two (full payment + a second
 * receipt to exercise the one-to-many list).
 */
const MOCK_RECEIPTS: Record<string, Receipt[]> = {
  /** ORD-REFUND — 1 receipt for the single full payment */
  'ORD-REFUND': [
    {
      id: 'RCP-REFUND-01',
      orderId: 'ORD-REFUND',
      issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 8_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-REFUND-01.pdf',
      label: 'Payment Receipt',
      paymentId: 'PAY-REFUND-01',
    },
  ],
  /** ORD-FULLPAY — 1 receipt for the single lump-sum full payment */
  'ORD-FULLPAY': [
    {
      id: 'RCP-FULLPAY-01',
      orderId: 'ORD-FULLPAY',
      issuedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 15_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-FULLPAY-01.pdf',
      label: 'Payment Receipt',
      paymentId: 'PAY-FULLPAY-01',
    },
  ],
  /**
   * Intentionally listed in reverse-chronological order (newest first) to exercise
   * the chronological sort in the receiptsToItems mapper. The UI must display them
   * oldest-first: Booking → Instalment 1 → Instalment 2 → Instalment 3.
   */
  'ORD-INSTALLMENTS': [
    {
      id: 'RCP-INST-04',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.installments[2].amount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-INST-04.pdf',
      label: 'Instalment 3 Receipt',
      paymentId: 'PAY-INST-004',
    },
    {
      id: 'RCP-INST-03',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.installments[1].amount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-INST-03.pdf',
      label: 'Instalment 2 Receipt',
      paymentId: 'PAY-INST-003',
    },
    {
      id: 'RCP-INST-01',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-INST-01.pdf',
      label: 'Booking Receipt',
      paymentId: 'PAY-INST-001',
    },
    {
      id: 'RCP-INST-02',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.installments[0].amount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-INST-02.pdf',
      label: 'Instalment 1 Receipt',
      paymentId: 'PAY-INST-002',
    },
  ],
  'ORD-001': [
    {
      id: 'RCP-001-01',
      orderId: 'ORD-001',
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-001-01.pdf',
      label: 'Booking Receipt',
      paymentId: 'PAY-A001',
    },
  ],
  'ORD-LEGACY': [
    {
      id: 'RCP-LEG-01',
      orderId: 'ORD-LEGACY',
      issuedAt: new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 25_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-LEG-01.pdf',
      label: 'Payment Receipt',
      paymentId: 'PAY-LEG-001',
    },
  ],
  'ORD-002': [
    {
      id: 'RCP-002-01',
      orderId: 'ORD-002',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 499,
      currency: 'USD',
      status: 'available',
      downloadUrl: 'https://example.com/receipts/RCP-002-01.pdf',
      label: 'Payment Receipt',
      paymentId: 'PAY-B001',
    },
    {
      id: 'RCP-002-02',
      orderId: 'ORD-002',
      issuedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 0,
      currency: 'USD',
      status: 'pending',
      label: 'Adjusted Receipt',
    },
  ],
};

/**
 * Mock invoices per order.
 *
 * DB integration point:
 *   SELECT * FROM invoices WHERE order_id = :orderId ORDER BY issued_at DESC
 *
 * GST invoices are only issued for Indian orders; non-Indian orders show
 * status 'unavailable'. Pending means the PDF is still being generated.
 */
const MOCK_INVOICES: Record<string, Invoice[]> = {
  /**
   * ORD-001 — partial payment, NSDC-mandatory program (mixed taxable + non-taxable items).
   * Demonstrates use cases 2 (interim invoice with amount due) and 4 (Bill of Supply + GST split).
   *   INV-001-01  Bill of Supply   — non-taxable NSDC-aligned course component
   *   INV-001-02  GST Invoice      — taxable add-on (AI Tools Masterclass)
   *   INV-001-03  Interim Invoice  — issued when course starts; amountDue = remaining balance
   */
  'ORD-001': [
    {
      id: 'INV-001-01',
      orderId: 'ORD-001',
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-001-01.pdf',
      documentType: 'bill_of_supply',
    },
    {
      id: 'INV-001-02',
      orderId: 'ORD-001',
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 0,
      currency: 'INR',
      status: 'pending',
      documentType: 'tax_invoice',
    },
    {
      id: 'INV-001-03',
      orderId: 'ORD-001',
      issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.bookingAmount,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-001-03.pdf',
      documentType: 'interim',
      // Course has started; learner owes the remaining balance
      amountDue: PROGRAM_DATA.remainingAmount,
    },
  ],
  /**
   * ORD-INSTALLMENTS — fully paid via 4 instalments, NSDC-mandatory program.
   * Case 1 (full payment) + Case 4 (NSDC + Bill of Supply).
   * Two invoices because NSDC-mandatory programs split taxable and non-taxable components:
   *   INV-INST-00  Bill of Supply  — non-taxable NSDC-aligned course component
   *   INV-INST-01  Final Invoice   — issued once all instalments are settled (no amountDue)
   */
  'ORD-INSTALLMENTS': [
    {
      id: 'INV-INST-00',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.totalFee,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-INST-00.pdf',
      documentType: 'bill_of_supply',
    },
    {
      id: 'INV-INST-01',
      orderId: 'ORD-INSTALLMENTS',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: PROGRAM_DATA.totalFee,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-INST-01.pdf',
      documentType: 'final',
      // amountDue intentionally omitted — order is fully paid
    },
  ],
  /**
   * ORD-REFUND — fully paid, non-NSDC → 1 Final Invoice (GST).
   * Because a final invoice exists at refund time, the refund document is a Credit Note.
   */
  'ORD-REFUND': [
    {
      id: 'INV-REFUND-01',
      orderId: 'ORD-REFUND',
      issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 8_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-REFUND-01.pdf',
      documentType: 'final',
    },
  ],
  /**
   * ORD-FULLPAY — single lump-sum full payment, non-NSDC → 1 Final Invoice (GST).
   * Clean demo: one payment, one receipt, one invoice, no refunds.
   */
  'ORD-FULLPAY': [
    {
      id: 'INV-FULLPAY-01',
      orderId: 'ORD-FULLPAY',
      issuedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 15_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-FULLPAY-01.pdf',
      documentType: 'final',
    },
  ],
  'ORD-LEGACY': [
    {
      id: 'INV-LEG-01',
      orderId: 'ORD-LEGACY',
      issuedAt: new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 25_000,
      currency: 'INR',
      status: 'available',
      downloadUrl: 'https://example.com/invoices/INV-LEG-01.pdf',
      documentType: 'tax_invoice',
    },
  ],
  'ORD-002': [
    {
      id: 'INV-002-01',
      orderId: 'ORD-002',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 499,
      currency: 'USD',
      status: 'unavailable',
      documentType: 'tax_invoice',
    },
  ],
};

/**
 * Mock refunds per order.
 *
 * DB integration point:
 *   SELECT * FROM refunds WHERE order_id = :orderId ORDER BY initiated_at DESC
 *
 * Most orders will have no refunds. ORD-002 has a processed partial refund
 * to demonstrate the UI. Remove or clear the array for orders with no refunds.
 */
const MOCK_REFUNDS: Record<string, Refund[]> = {
  /**
   * ORD-REFUND — fully paid, final invoice exists → Credit Note.
   * Case 3: clean dedicated refund scenario.
   */
  'ORD-REFUND': [
    {
      id: 'RFD-REFUND-01',
      orderId: 'ORD-REFUND',
      initiatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 8_000,
      currency: 'INR',
      status: 'processed',
      documentType: 'credit_note',
      downloadUrl: 'https://example.com/refunds/RFD-REFUND-01.pdf',
      reason: 'Program cancellation requested by learner',
      referenceId: 'REF-GW-20001',
    },
  ],
  /**
   * ORD-002 — fully paid, invoice exists → credit notes.
   * Two entries demonstrate multiple refund documents per order:
   *   RFD-002-01  processed credit note — PDF available for download.
   *   RFD-002-02  pending credit note   — still being generated, no download yet.
   */
  'ORD-002': [
    {
      id: 'RFD-002-01',
      orderId: 'ORD-002',
      initiatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 49,
      currency: 'USD',
      status: 'processed',
      documentType: 'credit_note',
      downloadUrl: 'https://example.com/refunds/RFD-002-01.pdf',
      reason: 'Promotional discount applied retroactively',
      referenceId: 'REF-GW-78432',
    },
    {
      id: 'RFD-002-02',
      orderId: 'ORD-002',
      initiatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 20,
      currency: 'USD',
      status: 'pending',
      documentType: 'credit_note',
      reason: 'Partial service cancellation',
    },
  ],
};

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
 * Returns a single order together with its payment history, invoices, refunds,
 * and bundled tool entitlements.
 *
 * Real version: GET /api/portal/orders/:orderId
 * Backend should JOIN / sub-query tool_accesses, invoices, and refunds in one response.
 */
export async function getOrder(
  orderId: string,
): Promise<{ order: Order; payments: Payment[]; receipts: Receipt[]; invoices: Invoice[]; refunds: Refund[] }> {
  await delay(600);
  // Replace: return fetch(`/api/portal/orders/${orderId}`).then(r => r.json())
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  // DB integration point: JOIN with tool_accesses table (see MOCK_TOOL_ACCESSES above)
  const toolAccesses = MOCK_TOOL_ACCESSES[orderId] ?? [];
  return {
    order: { ...order, toolAccesses },
    payments: MOCK_PAYMENTS[orderId] ?? [],
    receipts: MOCK_RECEIPTS[orderId] ?? [],
    invoices: MOCK_INVOICES[orderId] ?? [],
    refunds: MOCK_REFUNDS[orderId] ?? [],
  };
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

/**
 * Changes the cohort (batch) for an existing order. This is a one-time operation —
 * the backend sets cohortChangeUsed = true and never allows it to be reset.
 *
 * Real version: PATCH /api/portal/orders/:orderId/cohort
 * Body: { cohortId: string }
 * Returns: { cohortId, cohortStartDate }
 *
 * Backend side effects:
 *   - Updates the cohort FK on the order record
 *   - Sets cohortChangeUsed = true (irreversible)
 *   - Re-evaluates LMS access proximity if applicable
 *   - Sends a confirmation email to the learner
 */
export async function changeCohort(
  orderId: string,
  newCohortId: string,
): Promise<{ cohortId: string; cohortStartDate: string }> {
  await delay(900);
  // Replace: return fetch(`/api/portal/orders/${orderId}/cohort`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ cohortId: newCohortId }),
  // }).then(r => r.json())

  const cohort = PROGRAM_DATA.cohorts.find((c) => c.id === newCohortId);
  if (!cohort) throw new Error(`Cohort ${newCohortId} not found`);

  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  order.cohortId = cohort.id;
  order.cohortStartDate = cohort.startDate;
  order.cohortChangeUsed = true;

  return { cohortId: cohort.id, cohortStartDate: cohort.startDate };
}
