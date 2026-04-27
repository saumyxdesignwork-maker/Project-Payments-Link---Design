import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { PROGRAM_DATA } from '../data/paymentLink';
import { formatCheckoutPrice, localizeInrAmountsInCopy } from '../utils/formatters';
import { isIndianCountryCode } from '../data/countryCodes';
import {
  applyCheckoutDiscount,
  courseInstallmentsRemainder,
  partialBookingDueToday,
} from '../utils/partialPricing';

/** Countdown before redirecting to enrollment (NSDC step for India when not already on file). */
const AUTO_ENROLL_REDIRECT_SECONDS = 8;

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    paymentMode,
    userDetails,
    selectedCohortId,
    checkoutAddonsTotal,
    checkoutDiscountMultiplier,
    selectedBumpIds,
    selectedAudioIds,
  } = useStore();
  const isIndianCustomer = isIndianCountryCode(userDetails.countryCode);
  const enrollRedirectLabel = isIndianCustomer ? 'NSDC registration' : 'email confirmation';

  const usesAutoEnrollCountdown = paymentMode === 'partial' || paymentMode === 'full';

  const [redirectSecondsLeft, setRedirectSecondsLeft] = React.useState<number | null>(() =>
    usesAutoEnrollCountdown ? AUTO_ENROLL_REDIRECT_SECONDS : null,
  );

  React.useEffect(() => {
    if (!usesAutoEnrollCountdown) return;
    const skipEmailStepForNsdc = isIndianCustomer;
    setRedirectSecondsLeft(AUTO_ENROLL_REDIRECT_SECONDS);
    /** DOM timer ids (avoid NodeJS.Timeout vs number mismatch from @types/node). */
    const timeouts: number[] = [];
    for (let i = 0; i < AUTO_ENROLL_REDIRECT_SECONDS; i++) {
      timeouts.push(
        window.setTimeout(() => {
          const left = AUTO_ENROLL_REDIRECT_SECONDS - i - 1;
          if (left <= 0) {
            setRedirectSecondsLeft(0);
            // India: skip Step 1 and open NSDC (or enrollment if already on file).
            // International: Step 1 email confirmation must run — do not pass auto-confirm state.
            if (skipEmailStepForNsdc) {
              navigate('/portal/enroll', {
                state: { autoConfirmEmailFromCheckout: true },
              });
            } else {
              navigate('/portal/enroll');
            }
          } else {
            setRedirectSecondsLeft(left);
          }
        }, (i + 1) * 1000) as unknown as number,
      );
    }
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [usesAutoEnrollCountdown, navigate, isIndianCustomer]);

  const orderId = React.useMemo(() => `#4800${Math.floor(Math.random() * 1000000)}`, []);

  const selectedCohort = PROGRAM_DATA.cohorts.find((c) => c.id === selectedCohortId);
  const mult = checkoutDiscountMultiplier;
  const disc = (n: number) => applyCheckoutDiscount(n, mult);
  const amountPaid =
    paymentMode === 'partial'
      ? disc(partialBookingDueToday(checkoutAddonsTotal))
      : disc(PROGRAM_DATA.totalFee + checkoutAddonsTotal);

  const bumpProducts = PROGRAM_DATA.bump_products ?? [];
  const audioProducts = PROGRAM_DATA.audio_products ?? [];
  const selectedAddonLines = [
    ...bumpProducts.filter((b) => selectedBumpIds.includes(b.id)).map((p) => ({ id: p.id, name: p.name, price: p.price })),
    ...audioProducts.filter((a) => selectedAudioIds.includes(a.id)).map((p) => ({ id: p.id, name: p.name, price: p.price })),
  ];
  const courseRemainder = disc(courseInstallmentsRemainder());

  // Find the last installment label for the remaining balance due date
  const lastInstallment = PROGRAM_DATA.installments?.at(-1);
  const dueDateLabel = lastInstallment?.label?.split('Due ')?.[1] ?? 'a later date';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full p-8">

        {/* ── Confirmation hero ───────────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-medium text-slate-900 mb-1">
            {paymentMode === 'partial' ? 'Booking confirmed' : 'Payment Confirmed!'}
          </h1>
          <p className="text-slate-600 text-sm">
            Thank you, <span className="font-normal">{userDetails.fullName || 'there'}</span>.
            {paymentMode === 'partial'
              ? ' Your seat is booked.'
              : ' You\'re all set.'}
          </p>
        </div>

        {/* ── Order summary (pricing breakdown) ───────────────────── */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4 divide-y divide-slate-200/90">
          <div className="space-y-2.5 pb-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-500 shrink-0">Order ID</span>
              <span className="font-normal text-slate-900 text-right tabular-nums">{orderId}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-500 shrink-0">Program</span>
              <span className="font-normal text-slate-900 text-right">{PROGRAM_DATA.title}</span>
            </div>
            {selectedCohort && (
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500 shrink-0">Cohort</span>
                <span className="font-normal text-slate-900 text-right">{selectedCohort.name}</span>
              </div>
            )}
          </div>

          <div className="pt-3 space-y-2">
            <p className="text-xs font-medium text-slate-500 mb-1">This payment</p>
            {paymentMode === 'partial' ? (
              <>
                {mult < 1 ? (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-600">Booking + add-ons (first payment)</span>
                    <span className="font-normal text-slate-900 tabular-nums">
                      {formatCheckoutPrice(amountPaid, isIndianCustomer)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">Course booking</span>
                      <span className="font-normal text-slate-900 tabular-nums">
                        {formatCheckoutPrice(PROGRAM_DATA.bookingAmount, isIndianCustomer)}
                      </span>
                    </div>
                    {selectedAddonLines.map((line) => (
                      <div key={line.id} className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-600 text-left min-w-0 pr-2">
                          {localizeInrAmountsInCopy(line.name, isIndianCustomer)}
                        </span>
                        <span className="font-normal text-slate-900 tabular-nums shrink-0">
                          {formatCheckoutPrice(line.price, isIndianCustomer)}
                        </span>
                      </div>
                    ))}
                    {checkoutAddonsTotal > 0 && selectedAddonLines.length === 0 && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-600">Add-ons</span>
                        <span className="font-normal text-slate-900 tabular-nums">
                          {formatCheckoutPrice(checkoutAddonsTotal, isIndianCustomer)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between gap-3 text-sm font-medium text-slate-900 border-t border-slate-200/90 pt-2 mt-1">
                  <span>Total paid now</span>
                  <span className="tabular-nums">{formatCheckoutPrice(amountPaid, isIndianCustomer)}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm pt-1">
                  <span className="text-slate-600">Remaining (course · on schedule)</span>
                  <span className="font-medium text-amber-800 tabular-nums">
                    {formatCheckoutPrice(courseRemainder, isIndianCustomer)}
                  </span>
                </div>
              </>
            ) : (
              <>
                {mult < 1 && (selectedAddonLines.length > 0 || checkoutAddonsTotal > 0) ? (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-600">Program + add-ons</span>
                    <span className="font-normal text-slate-900 tabular-nums">
                      {formatCheckoutPrice(amountPaid, isIndianCustomer)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">Program fee</span>
                      <span className="font-normal text-slate-900 tabular-nums">
                        {formatCheckoutPrice(disc(PROGRAM_DATA.totalFee), isIndianCustomer)}
                      </span>
                    </div>
                    {selectedAddonLines.map((line) => (
                      <div key={line.id} className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-600 text-left min-w-0 pr-2">
                          {localizeInrAmountsInCopy(line.name, isIndianCustomer)}
                        </span>
                        <span className="font-normal text-slate-900 tabular-nums shrink-0">
                          {formatCheckoutPrice(disc(line.price), isIndianCustomer)}
                        </span>
                      </div>
                    ))}
                    {checkoutAddonsTotal > 0 && selectedAddonLines.length === 0 && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-600">Add-ons</span>
                        <span className="font-normal text-slate-900 tabular-nums">
                          {formatCheckoutPrice(disc(checkoutAddonsTotal), isIndianCustomer)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between gap-3 text-sm font-medium text-slate-900 border-t border-slate-200/90 pt-2 mt-1">
                  <span>Total paid</span>
                  <span className="tabular-nums">{formatCheckoutPrice(amountPaid, isIndianCustomer)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Partial-payment schedule reminder (no duplicate of remaining ₹) ── */}
        {paymentMode === 'partial' && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-4">
            <ClockIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-0.5">Installments</p>
              <p className="text-amber-700">
                The remaining course fee is split across your payment schedule — complete all parts by{' '}
                <span className="font-medium text-amber-900">{dueDateLabel}</span>. You will receive reminders before
                each due date.
              </p>
            </div>
          </div>
        )}

        {/* ── Confirmation email note ──────────────────────────────── */}
        <p className="text-xs text-slate-500 text-center mb-6">
          A confirmation has been sent to{' '}
          <span className="font-normal text-slate-700">{userDetails.email || 'your email'}</span>.
        </p>

        {/* ── Auto-enroll countdown (partial + full — no manual CTAs) ─────────────── */}
        {usesAutoEnrollCountdown && redirectSecondsLeft !== null && redirectSecondsLeft > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {paymentMode === 'partial' ? 'Your booking is confirmed' : 'Your payment is confirmed'}
            </p>
            <p
              className="text-4xl font-semibold tabular-nums text-primary leading-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {redirectSecondsLeft}
            </p>
            <p className="text-xs text-slate-500">
              {redirectSecondsLeft === 1
                ? `Continuing to ${enrollRedirectLabel} in 1 second…`
                : `Continuing to ${enrollRedirectLabel} in ${redirectSecondsLeft} seconds…`}
            </p>
          </div>
        ) : null}

        {/* ── Reassurance copy ── */}
        <p className="text-xs text-slate-400 text-center mt-4">
          {isIndianCustomer
            ? "You'll be taken to NSDC registration next — have your government ID details ready."
            : "You'll confirm your email on the next screen, then we'll finish setting up your access."}
        </p>

      </Card>
    </div>
  );
};
