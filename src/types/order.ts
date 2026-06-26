// ─── Order & Payment Types (Customer Portal) ───────────────────────────────────
//
// These types represent the post-payment customer view of their purchases.
// They are separate from PostPaymentContext (which is the immediate checkout flow)
// and are designed to support the self-serve order history portal.

// ─── Purchased Product Access ───────────────────────────────────────────────────

/**
 * The access delivery mechanism for a single purchased product.
 *   direct_link     — instant CTA: "Get access here" → opens a URL
 *   email_24h       — informational: access arrives by email within 24 hours
 *   nsdc_onboarding — 2-step flow: join WhatsApp group + complete NSDC registration
 *   custom_cta      — escape hatch: any other next-step with a custom label + URL
 */
export type ProductAccessType = 'direct_link' | 'email_24h' | 'nsdc_onboarding' | 'custom_cta';

/**
 * A single purchased product (main program, add-on, bonus, etc.) attached to an
 * order, with its own post-purchase access configuration.
 *
 * Add this to an Order's `purchasedProducts` array so the Get Access section can
 * show a product-specific card for each item the learner has bought.
 */
export interface PurchasedProduct {
  id: string;
  /** Display name shown as the card title. */
  name: string;
  /** Short label shown as a pill badge, e.g. "Main Program", "Add-on", "Bonus". */
  productTag?: string;
  accessType: ProductAccessType;
  /** Required when accessType === 'direct_link'. */
  accessUrl?: string;
  /** Required when accessType === 'nsdc_onboarding'. */
  nsdcSteps?: {
    whatsappUrl: string;
    /** In-app route for the NSDC enrollment form, e.g. "/portal/enroll". */
    nsdcEnrollPath: string;
  };
  /** Required when accessType === 'custom_cta'. */
  ctaLabel?: string;
  /** Required when accessType === 'custom_cta'. */
  ctaUrl?: string;
  /** Supporting description text shown alongside the custom CTA. */
  ctaDescription?: string;
}

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
   * Per-product access configurations for this order.
   * When present, the Get Access section renders one ProductAccessCard per entry
   * instead of the generic order-level access view.
   * Backend: join with purchased_products + access_configs tables.
   */
  purchasedProducts?: PurchasedProduct[];

  /**
   * ISO date (YYYY-MM-DD) when the learner's cohort starts.
   * Used to determine whether a partially-paid learner is close enough to cohort
   * start to be upgraded from preview → full LMS access (once payment threshold is met).
   * Backend: populate from the cohort record linked to this order.
   */
  cohortStartDate?: string;

  /**
   * The cohort ID (e.g. "c3") the learner is currently enrolled in.
   * Used by the portal batch-change flow to identify the current selection.
   * Backend: foreign key to the cohorts table on the order record.
   */
  cohortId?: string;

  /**
   * True once the customer has exercised their one-time batch change.
   * The portal hides the "Change Batch" button when this is true.
   * Backend: set on PATCH /api/portal/orders/:id/cohort; never resets.
   */
  cohortChangeUsed?: boolean;

  /**
   * Learner's progress state for this program.
   *   completed      — program finished; certificate available (if certificateUrl is set)
   *   near_completion — close to finishing; certificate not yet issued
   * Omit for active / in-progress programs.
   * Backend: derive from LMS completion events or a dedicated learner_progress table.
   */
  completionStatus?: 'completed' | 'near_completion';

  /**
   * Direct download / view URL for the completion certificate.
   * Present only when completionStatus === 'completed' and the certificate has been generated.
   * Backend: populated after LMS triggers a certificate-issued webhook.
   */
  certificateUrl?: string;

  /**
   * ISO date (YYYY-MM-DD) when the learner completed the program.
   * Shown on the completed-program card for context.
   */
  completedAt?: string;
}

/**
 * A single receipt document linked to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments, receipts, invoices, refunds }
 *
 * Backend integration point:
 *   SELECT * FROM receipts WHERE order_id = :orderId ORDER BY issued_at DESC
 *
 * One receipt is typically issued per payment, but the model supports
 * multiple receipts per order (e.g. booking receipt + instalment receipts).
 */
export interface Receipt {
  id: string;
  orderId: string;

  issuedAt: string;    // ISO datetime string
  amount: number;
  currency: string;

  /**
   * available   — PDF is ready; show downloadUrl
   * pending     — being generated; no download yet
   * unavailable — not applicable for this order
   */
  status: 'available' | 'pending' | 'unavailable';

  downloadUrl?: string; // direct link to PDF, present when status === 'available'

  /** Human-readable label shown in the row, e.g. "Booking Receipt", "Instalment 1 Receipt" */
  label?: string;

  /** Optional reference back to the Payment this receipt was issued for */
  paymentId?: string;
}

/**
 * Structured type that describes what kind of invoice-like document an Invoice is.
 * Used to derive a display label when the explicit `label` field is unset.
 * Extend this union (and INVOICE_DOCUMENT_LABELS below) to add future document types.
 */
export type InvoiceDocumentType =
  | 'tax_invoice'      // taxable supply — shown as "Invoice"
  | 'bill_of_supply'   // non-taxable / exempt supply — shown as "Bill of Supply"
  | 'interim'          // issued before full payment — shown as "Interim Invoice"
  | 'final'            // issued once fully settled — shown as "Final Invoice"
  | 'proforma';        // pre-order estimate — shown as "Proforma Invoice"

/**
 * Single source of truth for invoice document display labels.
 * When an Invoice has a documentType but no explicit label, the UI derives
 * the display string from this map. Add future types here.
 */
export const INVOICE_DOCUMENT_LABELS: Record<InvoiceDocumentType, string> = {
  tax_invoice:    'Invoice',
  bill_of_supply: 'Bill of Supply',
  interim:        'Interim Invoice',
  final:          'Final Invoice',
  proforma:       'Proforma Invoice',
};

/**
 * A single invoice document linked to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments, invoices, refunds }
 *
 * Backend integration point:
 *   SELECT * FROM invoices WHERE order_id = :orderId ORDER BY issued_at DESC
 */
export interface Invoice {
  id: string;
  orderId: string;

  issuedAt: string;    // ISO datetime string
  amount: number;
  currency: string;

  /**
   * available   — PDF is ready; show downloadUrl
   * pending     — being generated; no download yet
   * unavailable — not applicable for this order (e.g. non-GST region)
   */
  status: 'available' | 'pending' | 'unavailable';

  downloadUrl?: string; // direct link to PDF, present when status === 'available'

  /**
   * Structured document type used to derive a display label when `label` is unset.
   * Resolution order: explicit label → documentType → "Invoice".
   */
  documentType?: InvoiceDocumentType;

  /**
   * Explicit display label override. When set, takes precedence over documentType.
   * Use for one-off labels; prefer documentType for standard cases.
   */
  label?: string;

  /**
   * Outstanding balance shown on interim / proforma invoices issued before full
   * payment (e.g. when the course starts early). Omit or set 0 on final invoices
   * once the order is fully settled — the "amount due" line is hidden when this
   * is absent or zero.
   */
  amountDue?: number;
}

/**
 * Structured type that describes what kind of refund document a Refund represents.
 * Used to derive a display label when the explicit `label` field is unset.
 * Business rules:
 *   credit_note    — refund issued after full payment when an invoice already exists.
 *   refund_voucher — refund issued before full payment when no final invoice exists yet.
 * Extend this union (and REFUND_DOCUMENT_LABELS below) to add future variants.
 */
export type RefundDocumentType =
  | 'credit_note'     // refund after full payment, invoice exists
  | 'refund_voucher'; // refund before full payment, no invoice yet

/**
 * Single source of truth for refund document display labels.
 * When a Refund has a documentType but no explicit label, the UI derives
 * the display string from this map. Add future types here.
 */
export const REFUND_DOCUMENT_LABELS: Record<RefundDocumentType, string> = {
  credit_note:    'Credit Note',
  refund_voucher: 'Refund Voucher',
};

/**
 * A single refund record linked to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments, invoices, refunds }
 *
 * Backend integration point:
 *   SELECT * FROM refunds WHERE order_id = :orderId ORDER BY initiated_at DESC
 */
export interface Refund {
  id: string;
  orderId: string;

  initiatedAt: string; // ISO datetime string
  amount: number;
  currency: string;

  /** processed — credited back; pending — in-flight; rejected — declined */
  status: 'processed' | 'pending' | 'rejected';

  /**
   * Structured document type used to derive a display label when `label` is unset.
   * Resolution order: explicit label → documentType → "Refund".
   */
  documentType?: RefundDocumentType;

  /**
   * Explicit display label override. When set, takes precedence over documentType.
   * Use for one-off labels; prefer documentType for standard cases.
   */
  label?: string;

  /** Direct link to the refund document PDF, present once the document is generated. */
  downloadUrl?: string;

  /** Short human-readable reason shown in the row, e.g. "Duplicate payment" */
  reason?: string;

  /** Gateway or bank reference number for tracking */
  referenceId?: string;
}

/**
 * A single payment transaction linked to an order.
 *
 * Fetched as part of:
 *   GET /api/portal/orders/:id  → { order, payments, invoices, refunds }
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
