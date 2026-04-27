// ─── Payment & Enrollment Types ────────────────────────────────────────────────

/** Whether the user paid in full or made a partial (booking) payment. */
export type PaymentType = 'FULL' | 'PARTIAL';

/** The enrollment state for a single course. */
export type EnrollmentStatus =
  | 'NOT_ENROLLED'       // nothing done yet
  | 'PARTIAL_ENROLLED'   // enrolled in the dummy/booking course
  | 'FULL_ENROLLED';     // enrolled in the real course

// ─── Core Interfaces ───────────────────────────────────────────────────────────

/**
 * Represents one course the user has purchased (or is being enrolled into).
 * isPartialCourse = true means it is the dummy/placeholder course used for
 * partial-payment learners until they pay in full.
 */
export interface CoursePurchase {
  id: string;
  name: string;
  lmsCourseId: string;
  enrollmentStatus: EnrollmentStatus;
  isPartialCourse: boolean;
}

/**
 * Everything the Portal page needs to know after a payment completes.
 * The backend derives isIndianCustomer from the payment currency / country —
 * we never ask the user directly.
 */
export interface PostPaymentContext {
  paymentId: string;
  paymentType: PaymentType;
  isIndianCustomer: boolean;
  customerEmail: string;
  hasNsdcDataOnFile: boolean;
  customerId: string;
  courses: CoursePurchase[];
}

// ─── NSDC Form ─────────────────────────────────────────────────────────────────

/**
 * Standard NSDC fields collected once per Indian customer.
 * After submission, hasNsdcDataOnFile is set to true and this form
 * is skipped for all future payments by the same customer.
 *
 * Fields:
 * - fullName   : learner name exactly as on government ID / records
 * - fatherName : full father's name as per government records
 * - dateOfBirth: ISO date string (YYYY-MM-DD)
 */
export interface NsdcFormData {
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
}
