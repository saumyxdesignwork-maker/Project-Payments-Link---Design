import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROGRAM_DATA } from '../data/paymentLink';
import { isIndianCountryCode } from '../data/countryCodes';
import type { BumpProduct, AudioProduct } from '../data/paymentLink';
import { useStore } from '../store/useStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Accordion } from '../components/Accordion';
import { formatCheckoutPrice, formatCohortDate, getCohortRelativeDays, formatDate } from '../utils/formatters';
import {
  applyCheckoutDiscount,
  courseInstallmentsRemainder,
  partialBookingDueToday,
} from '../utils/partialPricing';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

/** Prototype: sales coupon = 20% off (full or partial). Replace with API validation. */
const DUMMY_COUPON_CODE = 'SALES20';
const COUPON_DISCOUNT_MULTIPLIER = 0.8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mask an email for display.
 * "saumy@growthschool.io" → "s***y@growthschool.io"
 */
function maskEmail(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return email;
  const local  = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}

/**
 * Simulate an email-based duplicate-payment API check.
 * Returns the raw email if a prior payment is found, null otherwise.
 *
 * → Replace the body of this function with a real fetch() in production.
 * → Trigger condition for testing: any email containing "test" or the
 *   specific address "saumy@growthschool.io".
 */
async function checkDuplicateByEmail(email: string): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 900)); // simulate ~1 s network latency
  const lower = email.toLowerCase().trim();
  if (lower.includes('test') || lower === 'saumy@growthschool.io') {
    return email; // return raw email — we mask it in the UI
  }
  return null;
}

/** Remaining seconds until a discount window expires, null if expired. */
function discountSecondsLeft(expiresAt: string): number | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms > 0 ? Math.floor(ms / 1000) : null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** SKU + NSDC course identifiers — shown for Indian checkout only (not required internationally). */
const ProductMeta: React.FC<{
  skuId: string;
  nsdcName: string;
  showIndianComplianceIds: boolean;
}> = ({ skuId, nsdcName, showIndianComplianceIds }) => {
  if (!showIndianComplianceIds) return null;
  return (
    <div className="mt-0.5 space-y-0.5">
      <p className="text-sm text-slate-400">SKU ID: {skuId}</p>
      <p className="text-sm text-slate-400">NSDC: {nsdcName}</p>
    </div>
  );
};

// GST invoice control
interface GstProps {
  gstEnabled: boolean; onToggle: (v: boolean) => void;
  companyName: string; gstin: string; billingAddress: string;
  onChange: (f: 'companyName' | 'gstin' | 'billingAddress', v: string) => void;
}
const GstControl: React.FC<GstProps> = ({ gstEnabled, onToggle, companyName, gstin, billingAddress, onChange }) => (
  <>
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input type="checkbox" checked={gstEnabled} onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
      <span className="text-sm font-normal text-slate-800">I need a GST Invoice</span>
    </label>
    {gstEnabled && (
      <div className="mt-4 space-y-3">
        <Input label="Company Name" placeholder="Acme Pvt. Ltd." value={companyName}
          onChange={(e) => onChange('companyName', e.target.value)} />
        <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" value={gstin}
          onChange={(e) => onChange('gstin', e.target.value.toUpperCase())} />
        <Input label="Billing Address" placeholder="123, Street, City – 000000" value={billingAddress}
          onChange={(e) => onChange('billingAddress', e.target.value)} />
      </div>
    )}
  </>
);

// Bump / Audio product card — two-zone layout matching design spec
interface AddonCardProps {
  product: BumpProduct | AudioProduct;
  isSelected: boolean;
  onToggle: () => void;
  formatPrice: (amount: number) => string;
  showIndianComplianceIds: boolean;
}
const AddonCard: React.FC<AddonCardProps> = ({
  product,
  isSelected,
  onToggle,
  formatPrice,
  showIndianComplianceIds,
}) => (
  <div
    role="checkbox" aria-checked={isSelected} tabIndex={0}
    onClick={onToggle}
    onKeyDown={(e) => e.key === ' ' && onToggle()}
    className={clsx(
      'rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200',
      isSelected ? 'border-primary' : 'border-green-300 hover:border-primary'
    )}
  >
    {/* White info zone */}
    <div className="bg-white p-4">
      {'durationLabel' in product && product.durationLabel && (
        <span className="inline-block bg-slate-100 text-slate-500 text-xs font-normal px-2 py-0.5 rounded-full mb-2">
          {product.durationLabel}
        </span>
      )}
      <p className="font-medium text-slate-900 text-base leading-snug mb-2">{product.name}</p>
      {product.description && (
        <p className="text-[0.875rem] text-slate-600 !leading-[1.5] mb-3">
          {product.description}
        </p>
      )}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-xl font-medium text-slate-900">{formatPrice(product.price)}</span>
        {product.originalPrice && (
          <span className="text-base line-through text-slate-400">{formatPrice(product.originalPrice)}</span>
        )}
      </div>
      <ProductMeta
        skuId={product.sku_id}
        nsdcName={product.nsdc_course_name}
        showIndianComplianceIds={showIndianComplianceIds}
      />
    </div>
    {/* Green CTA zone */}
    <div className={clsx(
      'px-4 py-3 flex items-center gap-3 border-t transition-colors',
      isSelected ? 'bg-primary-light border-primary' : 'bg-green-50 border-green-200'
    )}>
      <span className="text-lg select-none">👉</span>
      <div className={clsx(
        'h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-400'
      )}>
        {isSelected && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={clsx('text-sm font-medium', isSelected ? 'text-primary' : 'text-slate-700')}>
        {isSelected ? 'Added to order ✓' : 'Yes, I will take it.'}
      </span>
    </div>
  </div>
);

// ─── Duplicate payment warning ────────────────────────────────────────────────

interface DuplicateWarningProps {
  maskedEmail: string;
  onCheckDetails: () => void;
  onForSomeoneElse: () => void;
}
const DuplicateWarning: React.FC<DuplicateWarningProps> = ({
  maskedEmail, onCheckDetails, onForSomeoneElse,
}) => (
  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
    {/* Header strip */}
    <div className="flex items-start gap-3 p-5 pb-4">
      <div className="flex-shrink-0 mt-0.5">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <p className="font-bold text-slate-900 text-base leading-snug">
          Seems like you might have already made a payment.
        </p>
        <p className="text-slate-600 text-sm mt-1">
          Is this you? We found a payment associated with:
        </p>
      </div>
    </div>

    {/* Email highlight box */}
    <div className="mx-5 mb-5 flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-4 py-3">
      <span className="text-xl">📧</span>
      <span className="font-mono font-semibold text-slate-900 text-sm break-all">
        {maskedEmail}
      </span>
    </div>

    {/* CTAs */}
    <div className="border-t border-amber-200 bg-white px-5 py-4 flex flex-col sm:flex-row gap-3">
      <Button
        onClick={onCheckDetails}
        className="flex-1 bg-primary hover:bg-primary-hover text-white"
      >
        Check Details
      </Button>
      <Button
        variant="outline"
        onClick={onForSomeoneElse}
        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        For Someone Else
      </Button>
    </div>
  </div>
);

// ─── Main page component ──────────────────────────────────────────────────────

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    paymentMode, setPaymentMode,
    userDetails,
    selectedCohortId, setCohortId,
    step1Skipped,
    selectedBumpIds, toggleBump,
    selectedAudioIds, toggleAudio,
    gstEnabled, setGstEnabled,
    gstDetails, setGstDetails,
    duplicateStatus, setDuplicateStatus,
    duplicateMaskedEmail, setDuplicateMaskedEmail,
    resetDuplicateCheck, resetToStep1,
    setCheckoutAddonsTotal,
    setCheckoutDiscountMultiplier,
  } = useStore();

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const isIndia = isIndianCountryCode(userDetails.countryCode);
  const formatPrice = (amount: number) => formatCheckoutPrice(amount, isIndia);

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedCohort = PROGRAM_DATA.cohorts.find((c) => c.id === selectedCohortId);
  const basePrice      = PROGRAM_DATA.totalFee;

  const bumpProducts  = PROGRAM_DATA.bump_products  ?? [];
  const audioProducts = PROGRAM_DATA.audio_products ?? [];
  const selectedBumps  = bumpProducts.filter((b) => selectedBumpIds.includes(b.id));
  const selectedAudios = audioProducts.filter((a) => selectedAudioIds.includes(a.id));
  const addonsTotal    = [...selectedBumps, ...selectedAudios].reduce((s, p) => s + p.price, 0);
  const displayFee         = basePrice + addonsTotal;
  /** Partial: course booking + add-ons now; later schedule = course remainder only. */
  const partialDueTodayRaw = partialBookingDueToday(addonsTotal);
  const courseRemainderForSchedule = courseInstallmentsRemainder();

  const discMult = couponApplied ? COUPON_DISCOUNT_MULTIPLIER : 1;
  const applyDisc = (amount: number) => applyCheckoutDiscount(amount, discMult);
  const displayFeeDiscounted = applyDisc(displayFee);
  const partialDueTodayDiscounted = applyDisc(partialDueTodayRaw);
  const courseRemainderDiscounted = applyDisc(courseRemainderForSchedule);

  const amountPayableToday =
    paymentMode === 'partial' ? partialDueTodayDiscounted : displayFeeDiscounted;

  const discountWindow = PROGRAM_DATA.discount_window;
  const discountSecs   = discountWindow ? discountSecondsLeft(discountWindow.expiresAt) : null;

  const isChecking      = duplicateStatus === 'checking';
  const isDuplicateFound = duplicateStatus === 'found';

  // ── Duplicate check on mount — keyed by email ──────────────────────────────
  useEffect(() => {
    if (!userDetails.email) return;
    if (duplicateStatus !== 'idle') return;

    setDuplicateStatus('checking');

    checkDuplicateByEmail(userDetails.email).then((rawEmail) => {
      if (rawEmail) {
        setDuplicateMaskedEmail(maskEmail(rawEmail));
        setDuplicateStatus('found');
      } else {
        setDuplicateStatus('cleared');
      }
    });
  // Run once per visit — re-runs after resetDuplicateCheck() sets status back to 'idle'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBack = () => {
    resetDuplicateCheck(); // so check re-runs if user changes email
    navigate('/');
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }
    if (code !== DUMMY_COUPON_CODE) {
      setCouponError('Invalid coupon code.');
      return;
    }
    setCouponError('');
    setCouponApplied(true);
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponInput('');
    setCouponError('');
  };

  const handlePay = () => {
    setIsPaying(true);
    setCheckoutAddonsTotal(addonsTotal);
    setCheckoutDiscountMultiplier(couponApplied ? COUPON_DISCOUNT_MULTIPLIER : 1);
    // Navigate to the Payment Confirmed screen first. From there the user
    // chooses when to begin the registration journey (/portal/enroll).
    setTimeout(() => navigate('/success'), 800);
  };

  const handleCheckDetails = () => {
    navigate('/verify-otp');
  };

  const handleForSomeoneElse = () => {
    resetToStep1();
    navigate('/');
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors mb-6 -ml-1"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span>Edit details</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Left 2 columns ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Unified Product Card ────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white">

            {/* Product identity */}
            <div className="p-5">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-semibold text-slate-900 leading-snug">{PROGRAM_DATA.title}</h1>
                {PROGRAM_DATA.isNsdcAligned && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-yellow-100 text-yellow-800 border border-yellow-200 shrink-0 mt-1">
                    NSDC Training Partnership
                  </span>
                )}
              </div>
              {isIndia && (
                <div className="flex flex-wrap gap-x-4 mt-1">
                  <span className="text-sm text-slate-400">SKU ID: {PROGRAM_DATA.sku_id}</span>
                  <span className="text-sm text-slate-400">NSDC: {PROGRAM_DATA.nsdc_course_name}</span>
                </div>
              )}
              <div className={clsx('flex flex-wrap items-center gap-2 text-sm text-slate-500', isIndia ? 'mt-3' : 'mt-2')}>
                <span className="font-medium text-slate-700">{userDetails.fullName || '—'}</span>
                <span className="text-slate-300">·</span>
                <span>{userDetails.email || '—'}</span>
                <span className="text-slate-300">·</span>
                <span>{userDetails.phone || '—'}</span>
              </div>

              {/* Cohort selector — only when Step 1 was skipped */}
              {step1Skipped && PROGRAM_DATA.cohorts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Select Cohort</p>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setCohortId(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-4 pr-10 border bg-white appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    {PROGRAM_DATA.cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{formatCohortDate(c.startDate)}</option>
                    ))}
                  </select>
                  {selectedCohort && (
                    <div className="mt-2 text-sm text-slate-500 px-1">
                      <span>{selectedCohort.schedule}</span>
                      {(() => {
                        const hint = getCohortRelativeDays(selectedCohort.startDate);
                        return hint ? <span className="ml-2 text-slate-400">({hint})</span> : null;
                      })()}
                      {selectedCohort.seatsLeft !== undefined && selectedCohort.seatsLeft < 20 && (
                        <span className="ml-2 text-amber-700">· {selectedCohort.seatsLeft} spots left</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment mode + schedule — inside card when not checking/duplicate */}
            {!isChecking && !isDuplicateFound && (
              <>
                {/* Choose payment option */}
                <div className="border-t border-slate-100 px-5 pt-5 pb-5">
                  <p className="text-sm font-normal text-slate-500 mb-3">Choose payment option</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { mode: 'full' as const,    label: 'Full Payment',    amount: displayFeeDiscounted,                   sub: '' },
                      {
                        mode: 'partial' as const,
                        label: 'Booking Amount',
                        amount: partialDueTodayDiscounted,
                        sub:
                          addonsTotal > 0
                            ? 'Includes add-ons · remaining course fee on schedule'
                            : 'Pay remaining course fee later',
                      },
                    ].map(({ mode, label, amount, sub }) => {
                      const isSel = paymentMode === mode;
                      return (
                        <div key={mode} onClick={() => setPaymentMode(mode)}
                          className={clsx(
                            'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                            isSel ? 'border-primary bg-primary-light' : 'border-slate-200 hover:border-slate-300 bg-white'
                          )}
                        >
                          <div className={clsx('h-5 w-5 rounded-full border flex items-center justify-center mb-2', isSel ? 'border-primary' : 'border-slate-300')}>
                            {isSel && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </div>
                          <h3 className="font-medium text-base text-slate-900">{label}</h3>
                          <p className="text-xl font-semibold text-slate-900 mt-1">{formatPrice(amount)}</p>
                          {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment schedule — inside card when partial is selected */}
                {paymentMode === 'partial' && (
                  <div className="border-t border-slate-100 px-5 pt-4 pb-5">
                    <p className="text-sm font-medium text-slate-500 mb-3">Payment Schedule</p>
                    <div className="space-y-3">
                      {PROGRAM_DATA.installments.map((inst, i) => (
                        <div key={i} className="flex justify-between items-baseline text-sm">
                          <span className="text-slate-500">Due {formatDate(inst.dueDate)}</span>
                          <span className="font-medium text-slate-900">
                            {formatPrice(applyDisc(inst.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Duplicate payment check ─────────────────────────────────────── */}
          {isChecking && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm">
              <svg className="animate-spin h-5 w-5 text-primary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Checking for existing payments…
            </div>
          )}

          {isDuplicateFound && (
            <DuplicateWarning
              maskedEmail={duplicateMaskedEmail}
              onCheckDetails={handleCheckDetails}
              onForSomeoneElse={handleForSomeoneElse}
            />
          )}

          {/* Discount window — separate action card */}
          {!isChecking && !isDuplicateFound && paymentMode === 'partial' && discountWindow && discountSecs !== null && (
            <Card className="p-5 border border-[rgb(85,170,136)] bg-primary-light">
              <p className="text-base font-medium text-slate-900 mb-2">Limited-time offer</p>
              <p className="text-slate-800 text-sm mb-3">Pay the remaining balance at a discounted rate.</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-medium text-primary">{formatPrice(discountWindow.discountedRemainingAmount)}</span>
                <span className="text-sm line-through text-slate-400">{formatPrice(discountWindow.fullRemainingAmount)}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Discount valid for{' '}
                <span className="font-medium text-slate-700">
                  {Math.floor(discountSecs / 86400)}d {Math.floor((discountSecs % 86400) / 3600)}h {Math.floor((discountSecs % 3600) / 60)}m
                </span>
              </p>
              <Button className="w-full font-medium">{discountWindow.ctaLabel}</Button>
            </Card>
          )}

          {!isChecking && !isDuplicateFound && (
            <>

              {/* Bumps + Audio — "Don't miss out on these deals" */}
              {(bumpProducts.length > 0 || audioProducts.length > 0) && (
                <section>
                  <h3 className="text-base font-medium text-slate-900 mb-4">Optional Extras</h3>
                  <div className="space-y-4">
                    {bumpProducts.map((bp) => (
                      <AddonCard
                        key={bp.id}
                        product={bp}
                        isSelected={selectedBumpIds.includes(bp.id)}
                        onToggle={() => toggleBump(bp.id)}
                        formatPrice={formatPrice}
                        showIndianComplianceIds={isIndia}
                      />
                    ))}
                    {audioProducts.map((ap) => (
                      <AddonCard
                        key={ap.id}
                        product={ap}
                        isSelected={selectedAudioIds.includes(ap.id)}
                        onToggle={() => toggleAudio(ap.id)}
                        formatPrice={formatPrice}
                        showIndianComplianceIds={isIndia}
                      />
                    ))}
                  </div>
                </section>
              )}



              {/* What's included */}
              <div>
                <h3 className="text-base font-medium text-slate-900 mb-3">What's Included</h3>
                <Accordion items={[{
                  id: 'features',
                  title: 'View All Benefits',
                  content: (
                    <ul className="space-y-3">
                      {PROGRAM_DATA.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                          </svg>
                          <span className="text-slate-700 text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                }]} />
              </div>
            </>
          )}
        </div>

        {/* ── Right column — sticky order summary ──────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* ── Order Summary card ── */}
            <Card className="px-6 pt-6 pb-3 bg-white border-slate-200">
              <h3 className="text-base font-medium mb-1 text-slate-900">Order Summary</h3>
              {couponApplied && (
                <p className="text-xs text-emerald-700 font-normal mb-3">
                  {DUMMY_COUPON_CODE} applied · 20% off eligible lines
                </p>
              )}

              {/* Primary product */}
              <div className="pb-3 mb-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-700 font-normal text-sm">{PROGRAM_DATA.title}</span>
                  <span className="text-slate-900 font-medium text-sm whitespace-nowrap">
                    {formatPrice(applyDisc(basePrice))}
                  </span>
                </div>
              </div>

              {/* Add-ons */}
              {[...selectedBumps, ...selectedAudios].map((p) => (
                <div key={p.id} className="pb-3 border-b-0 border-slate-100 mb-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-700 text-sm">{p.name}</span>
                    <span className="text-slate-900 font-medium text-sm whitespace-nowrap">
                      {formatPrice(applyDisc(p.price))}
                    </span>
                  </div>
                </div>
              ))}

              {paymentMode === 'partial' && (
                <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
                  <div className="flex justify-between items-center gap-3 text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="text-slate-900 font-medium shrink-0 tabular-nums">
                      {formatPrice(displayFeeDiscounted)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3 text-sm pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Remaining · scheduled</span>
                    <span className="text-slate-500 shrink-0 tabular-nums">
                      {formatPrice(courseRemainderDiscounted)}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500 text-sm">
                    {paymentMode === 'partial' ? 'Paying today' : 'Total'}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{formatPrice(amountPayableToday)}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm pt-3 mt-1 mb-6 border-t border-slate-100">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500">Cohort</span>
                  <span className="text-slate-500 text-sm text-right">{selectedCohort?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500">Applicable Taxes</span>
                  <span className="text-slate-500 text-sm text-right">Included (GST inclusive)</span>
                </div>
              </div>

              {!isDuplicateFound && (
                <div>
                  <Button
                    onClick={handlePay}
                    disabled={isPaying || isChecking}
                    className="w-full font-semibold py-3 text-base shadow-md active:scale-[0.98]"
                  >
                    {isPaying ? 'Processing…' : `Pay ${formatPrice(amountPayableToday)}`}
                  </Button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>Secure Payment · 256-bit SSL Encrypted</span>
                  </div>
                </div>
              )}
            </Card>

            {/* ── Coupon & Taxes card ── */}
            <Card className="p-6 bg-white border-slate-200">
              <h3 className="text-base font-medium mb-3 text-slate-900">Coupon</h3>

              {/* Coupon input */}
              <div className="space-y-3">
                {!couponApplied ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="coupon-code"
                        className="block text-sm font-normal text-slate-700 leading-snug"
                      >
                        Have a code from sales?
                      </label>
                      <div
                        className={clsx(
                          'flex rounded-lg border bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0',
                          couponError ? 'border-red-300 focus-within:ring-red-500' : 'border-slate-300',
                        )}
                      >
                        <input
                          id="coupon-code"
                          type="text"
                          placeholder="e.g. SALES20"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            if (couponError) setCouponError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="shrink-0 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary-light/70 border-l border-slate-200 transition-colors"
                        >
                          APPLY
                        </button>
                      </div>
                      {couponError ? (
                        <p className="text-xs text-red-600">{couponError}</p>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Prototype: use <code className="font-mono text-slate-600">{DUMMY_COUPON_CODE}</code> for 20% off
                      full or partial checkout.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-900">
                    <span className="font-medium">{DUMMY_COUPON_CODE} · 20% off applied</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-normal text-emerald-800 underline underline-offset-2 self-start sm:self-auto"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>


            </Card>

            {/* ── GST Invoice card ── */}
            <Card className="px-6 py-4 bg-white border-slate-200">
              <GstControl
                gstEnabled={gstEnabled} onToggle={setGstEnabled}
                companyName={gstDetails.companyName} gstin={gstDetails.gstin} billingAddress={gstDetails.billingAddress}
                onChange={(f, v) => setGstDetails({ [f]: v })}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      {!isDuplicateFound && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 py-4 px-[70px] bg-white border-t border-slate-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500">Paying today</p>
              <p className="text-base font-medium text-slate-900">{formatPrice(amountPayableToday)}</p>
            </div>
            <button className="text-sm text-primary font-medium underline" onClick={() => setIsSummaryOpen(!isSummaryOpen)}>
              {isSummaryOpen ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          {isSummaryOpen && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span>Program Fee</span>
                <span>{formatPrice(applyDisc(basePrice))}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons</span>
                  <span>{formatPrice(applyDisc(addonsTotal))}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Payable Now</span>
                <span>{formatPrice(amountPayableToday)}</span>
              </div>
            </div>
          )}
          <Button onClick={handlePay} disabled={isPaying || isChecking} className="w-full font-medium">
            {paymentMode === 'partial' ? 'Pay Booking Amount' : 'Pay Full Amount'}
          </Button>
        </div>
      )}

      <div className="lg:hidden h-24" />
    </div>
  );
};
