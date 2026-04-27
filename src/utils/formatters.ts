/** Fixed prototype rate; replace with live FX or regional catalog from your backend. */
const INR_PER_USD = 83;

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatUSD = (amountUsd: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amountUsd);
};

/** Whole USD from INR (rounded) for international checkout display. */
export function inrAmountToUsdRounded(inr: number): number {
  return Math.round(inr / INR_PER_USD);
}

/** India → INR; international → USD converted from same INR ledger amounts. */
export function formatCheckoutPrice(inrAmount: number, isIndia: boolean): string {
  return isIndia ? formatINR(inrAmount) : formatUSD(inrAmountToUsdRounded(inrAmount));
}

/**
 * For international users, replace "₹12,345" style segments in marketing copy with rounded USD.
 * India: unchanged.
 */
export function localizeInrAmountsInCopy(text: string, isIndia: boolean): string {
  if (isIndia) return text;
  return text.replace(/₹\s*([\d,]+)/g, (_match, raw: string) => {
    const inr = parseInt(String(raw).replace(/,/g, ''), 10);
    if (Number.isNaN(inr)) return `₹${raw}`;
    return formatUSD(inrAmountToUsdRounded(inr));
  });
}

