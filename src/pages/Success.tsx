import React from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Card } from '../components/Card';
import { ProductAccessCard } from '../components/ProductAccessCard';
import { useStore } from '../store/useStore';
import { PROGRAM_DATA } from '../data/paymentLink';
import { formatCheckoutPrice, localizeInrAmountsInCopy } from '../utils/formatters';
import { isIndianCountryCode } from '../data/countryCodes';
import {
  applyCheckoutDiscount,
  courseInstallmentsRemainder,
  partialBookingDueToday,
} from '../utils/partialPricing';

export const SuccessPage: React.FC = () => {
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

        {/* ── What happens next — product access cards ─────────────── */}
        <div className="mt-2 pt-4 border-t border-slate-200">
          <h2 className="text-sm font-normal text-slate-500 mb-3">What happens next?</h2>
          <div className="space-y-3">

            {/* Main program card */}
            {PROGRAM_DATA.isNsdcAligned && isIndianCustomer ? (
              <ProductAccessCard
                productName={PROGRAM_DATA.title}
                productTag="Main Program"
                accessType="nsdc_onboarding"
                nsdcSteps={{
                  whatsappUrl: PROGRAM_DATA.whatsapp_group_url ?? '#',
                  nsdcEnrollPath: '/portal/enroll',
                }}
              />
            ) : (
              <ProductAccessCard
                productName={PROGRAM_DATA.title}
                productTag="Main Program"
                accessType="direct_link"
                ctaUrl={PROGRAM_DATA.redirect_url}
              />
            )}

            {/* Bump product add-on cards */}
            {(PROGRAM_DATA.bump_products ?? [])
              .filter((b) => selectedBumpIds.includes(b.id))
              .map((b) => (
                <ProductAccessCard
                  key={b.id}
                  productName={b.name}
                  productTag="Add-on"
                  accessType={b.accessUrl ? 'direct_link' : 'email_24h'}
                  ctaUrl={b.accessUrl}
                />
              ))}

            {/* Audio product add-on cards */}
            {(PROGRAM_DATA.audio_products ?? [])
              .filter((a) => selectedAudioIds.includes(a.id))
              .map((a) => (
                <ProductAccessCard
                  key={a.id}
                  productName={a.name}
                  productTag="Add-on"
                  accessType={a.accessUrl ? 'direct_link' : 'email_24h'}
                  ctaUrl={a.accessUrl}
                />
              ))}

          </div>
        </div>

        {/* ── Confirmation email note ──────────────────────────────── */}
        <p className="text-xs text-slate-500 text-center mt-4">
          A confirmation has been sent to{' '}
          <span className="font-normal text-slate-700">{userDetails.email || 'your email'}</span>.
        </p>

      </Card>
    </div>
  );
};
