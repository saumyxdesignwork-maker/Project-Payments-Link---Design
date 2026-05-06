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
 * "2025-12-14" → "Sat, December 14"
 * Parses as UTC noon to avoid off-by-one issues from timezone conversion.
 */
export function formatCohortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);
  const month   = new Intl.DateTimeFormat('en-US', { month: 'long',    timeZone: 'UTC' }).format(date);
  const day     = new Intl.DateTimeFormat('en-US', { day: 'numeric',   timeZone: 'UTC' }).format(date);
  return `${weekday}, ${month} ${day}`;
}

/**
 * "2025-12-14" or full ISO datetime → "Sat, December 14, 2025"
 * Date-only strings are parsed at UTC noon to avoid timezone off-by-one.
 */
export function formatDate(iso: string): string {
  const isDateOnly = iso.length === 10;
  const date = new Date(isDateOnly ? `${iso}T12:00:00Z` : iso);
  const tz = isDateOnly ? 'UTC' : undefined;
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(date);
  const month   = new Intl.DateTimeFormat('en-US', { month: 'long',    timeZone: tz }).format(date);
  const day     = new Intl.DateTimeFormat('en-US', { day: 'numeric',   timeZone: tz }).format(date);
  const year    = new Intl.DateTimeFormat('en-US', { year: 'numeric',  timeZone: tz }).format(date);
  return `${weekday}, ${month} ${day}, ${year}`;
}

/**
 * Full ISO datetime → "Sat, December 14, 2025 · 3:45 PM"
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short'                             }).format(date);
  const month   = new Intl.DateTimeFormat('en-US', { month: 'long'                               }).format(date);
  const day     = new Intl.DateTimeFormat('en-US', { day: 'numeric'                              }).format(date);
  const year    = new Intl.DateTimeFormat('en-US', { year: 'numeric'                             }).format(date);
  const time    = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  return `${weekday}, ${month} ${day}, ${year} · ${time}`;
}

/**
 * Returns "in N days" if the date is 1–15 days from today (local), otherwise null.
 * Returns "today" for same day.
 */
export function getCohortRelativeDays(isoDate: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T12:00:00Z`);
  target.setUTCHours(0, 0, 0, 0);
  const diffMs   = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays > 0 && diffDays <= 15) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  return null;
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

