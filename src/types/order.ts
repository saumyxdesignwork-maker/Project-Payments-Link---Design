// ─── Order & Payment Types (Customer Portal) ───────────────────────────────────
//
// These types represent the post-payment customer view of their purchases.
// They are separate from PostPaymentContext (which is the immediate checkout flow)
// and are designed to support the self-serve order history portal.

// ─── Tool Access ────────────────────────────────────────────────────────────────

/**
 * Identifies a partner tool bundled with a subscription.
 * To add a new tool: extend this union and add corresponding mock / DB data.
 */
export type ToolName = 'emily_ai' | 'perplexity' | 'other';

/**
 * A single tool entitlement tied to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments, toolAccesses }
 *
 * Backend integration point:
 *   SELECT * FROM tool_accesses WHERE order_id = :orderId
 */
export interface ToolAccess {
  id: string;
  orderId: string;
  tool: ToolName;
  displayName: string;       // e.g. "Emily AI", "Perplexity"
  status: 'active' | 'pending_activation' | 'expired' | 'revoked';

  // Timing info (both optional)
  startsAt?: string;         // ISO — if in future, show "Starts on DD MMM YYYY"
  endsAt?: string;           // ISO — show "Valid until DD MMM YYYY"

  // How the user accesses the tool
  activationUrl?: string;    // deep link shown when status === 'pending_activation'
  loginUrl?: string;         // shown when status === 'active'

  notes?: string;            // short human-readable note, e.g. "Free for 3 months with your subscription"

  /**
   * True when this tool was paid as a bump/add-on within the booking amount itself,
   * so access is available immediately regardless of remaining instalment balance.
   * Backend: set this flag when the tool's sku_id appears in the booking charge line items.
   */
  includedInBooking?: boolean;
}

/**
 * Whether the learner has been given dummy (preview) or real (full) LMS access.
 * 'none' means no LMS access has been granted yet.
 */
export type LmsEnrollmentStatus = 'none' | 'dummy' | 'real';

/**
 * One instalment row in a partial-payment schedule (mirrors payment link config).
 * Populated from the backend when the order used an instalment plan.
 */
export interface InstallmentPlanSlot {
  amount: number;
  dueDate: string; // ISO date (YYYY-MM-DD)
  label: string;
}

/**
 * Booking + remaining instalments for the “payment progress” UI in the portal.
 *
 * DB integration point: store plan snapshot on the order at checkout time so
 * the portal can render the schedule even if global program pricing changes later.
 */
export interface PartialInstallmentPlan {
  bookingAmount: number;
  installments: InstallmentPlanSlot[];
}

/**
 * NSDC data already on file for this learner (read-only in the portal).
 * Populated by GET /api/portal/orders/:id after successful NSDC submit.
 */
export interface NsdcSubmittedProfile {
  email?: string;
  /** Full name as submitted (as per government records) */
  fullName?: string;
  fatherName?: string;
  /** ISO date YYYY-MM-DD */
  dateOfBirth?: string;
  gender?: string;
}

/**
 * A single order in the customer portal.
 *
 * In production this would be fetched from:
 *   GET /api/portal/orders        → list
 *   GET /api/portal/orders/:id    → detail
 *
 * Key business rules captured here:
 * - nsdcRequired: derived from countryCode on the backend (India → true)
 * - pendingAmount: > 0 when paymentStatus === 'partial'
 * - lmsEnrollmentStatus: 'dummy' for partial payers who've been given preview access;
 *   'real' once full payment and NSDC (if required) are both complete
 */
export interface Order {
  id: string;
  userId: string;

  // Program identity
  programName: string;
  createdAt: string; // ISO datetime string

  // Financials
  totalAmount: number;
  currency: string; // e.g. 'INR', 'USD'
  countryCode: string; // ISO 3166-1 alpha-2, e.g. 'IN', 'US'
  paymentStatus: 'partial' | 'paid' | 'failed';
  pendingAmount: number; // 0 when fully paid

  /**
   * When paymentStatus === 'partial', optional instalment schedule for the
   * booking + part-payment progress UI. If omitted, only the generic partial banner is shown.
   */
  installmentPlan?: PartialInstallmentPlan;
  /**
   * How many timeline steps are completed: 1 = booking paid only,
   * 2 = booking + first part payment, etc. Backend derives this from successful charges.
   */
  paidScheduleSteps?: number;

  // NSDC (India-specific government certification requirement)
  /** True when the learner is Indian (e.g. billing country IN). */
  nsdcRequired: boolean;
  /** True once NSDC form has been submitted for this order / profile. */
  nsdcCompleted: boolean;
  /**
   * When false, this program does not require NSDC — Indian learners skip the NSDC
   * form and go straight to access links. Omit or true for NSDC-aligned programs.
   */
  programNsdcMandatory?: boolean;
  /**
   * True when the purchase predates NSDC collection for this program (`programNsdcMandatory`
   * was false at checkout) but a later government / policy change requires a one-time profile
   * anyway. Drives catch-up UI on the portal home and the NSDC form on the order page.
   */
  nsdcRetroactiveCollectionRequired?: boolean;
  /** Submitted NSDC fields; required for read-only display when nsdcCompleted. */
  nsdcProfile?: NsdcSubmittedProfile;

  // LMS access state
  lmsEnrollmentStatus: LmsEnrollmentStatus;

  // Non-Indian email confirmation requirement
  emailConfirmed: boolean;

  // Access links (populated once enrollment is set up)
  lmsLink?: string;
  couponLink?: string;
  emilyLink?: string;
  extraLinks?: { label: string; url: string }[];

  // Customer name / email for prefilling forms
  customerEmail?: string;
  customerName?: string;

  // Partner tool entitlements bundled with this order
  // Populated by GET /api/portal/orders/:id — see ToolAccess above
  toolAccesses?: ToolAccess[];

  /**
   * ISO date (YYYY-MM-DD) when the learner's cohort starts.
   * Used to determine whether a partially-paid learner is close enough to cohort
   * start to be upgraded from preview → full LMS access (once payment threshold is met).
   * Backend: populate from the cohort record linked to this order.
   */
  cohortStartDate?: string;
}

/**
 * A single payment transaction linked to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments }
 */
export interface Payment {
  id: string;
  orderId: string;

  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: string; // ISO datetime string

  receiptUrl?: string; // URL to PDF/hosted receipt if available
  isPartial: boolean; // true for booking / instalment payments
}
