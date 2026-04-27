import { PROGRAM_DATA } from '../data/paymentLink';

/** 1 = no discount; e.g. 0.8 = 20% off (rounded to whole currency unit). */
export function applyCheckoutDiscount(amount: number, multiplier: number): number {
  if (multiplier >= 0.999) return amount;
  return Math.round(amount * multiplier);
}

/**
 * Sum of future installment amounts for the course only (add-ons are not split across installments).
 * Kept in sync with PROGRAM_DATA.remainingAmount when config uses booking + remainder = totalFee.
 */
export function courseInstallmentsRemainder(): number {
  return PROGRAM_DATA.totalFee - PROGRAM_DATA.bookingAmount;
}

/** First partial checkout charge: course booking + any selected add-ons (paid in full upfront). */
export function partialBookingDueToday(addonsTotal: number): number {
  return PROGRAM_DATA.bookingAmount + addonsTotal;
}

/** Full order total (course + add-ons) for a partial payer. */
export function partialOrderGrandTotal(addonsTotal: number): number {
  return PROGRAM_DATA.totalFee + addonsTotal;
}
