import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Card } from '../components/Card';
import { ProductAccessCard } from '../components/ProductAccessCard';
import { PartialPaymentStatus } from '../components/PartialPaymentStatus';
import { useStore } from '../store/useStore';
import { PROGRAM_DATA } from '../data/paymentLink';
import { formatCheckoutPrice, localizeInrAmountsInCopy, formatCohortDate } from '../utils/formatters';
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
    checkoutFlatDiscount,
    selectedBumpIds,
    selectedAudioIds,
    programType,
  } = useStore();

  const isNsdc = programType === 'nsdc';
  const isIndianCustomer = isIndianCountryCode(userDetails.countryCode);

  const orderId = React.useMemo(() => `#4800${Math.floor(Math.random() * 1000000)}`, []);

  const selectedCohort = PROGRAM_DATA.cohorts.find((c) => c.id === selectedCohortId);
  const mult = checkoutDiscountMultiplier;
  const disc = (n: number) => applyCheckoutDiscount(n, mult);
  const amountPaid = Math.max(
    0,
    (paymentMode === 'partial'
      ? disc(partialBookingDueToday(checkoutAddonsTotal))
      : disc(PROGRAM_DATA.totalFee + checkoutAddonsTotal)) - checkoutFlatDiscount
  );

  const bumpProducts = PROGRAM_DATA.bump_products ?? [];
  const audioProducts = PROGRAM_DATA.audio_products ?? [];
  const selectedAddonLines = [
    ...bumpProducts.filter((b) => selectedBumpIds.includes(b.id)).map((p) => ({ id: p.id, name: p.name, price: p.price })),
    ...audioProducts.filter((a) => selectedAudioIds.includes(a.id)).map((p) => ({ id: p.id, name: p.name, price: p.price })),
  ];
  const courseRemainder = disc(courseInstallmentsRemainder());

  return (
    <div className="page-shell flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* ── Confirmation card — PartialPaymentStatus for partial, simple card for full ── */}
        {paymentMode === 'partial' ? (
          <PartialPaymentStatus
            orderId={orderId}
            programName={PROGRAM_DATA.title}
            email={userDetails.email}
            totalAmount={amountPaid + courseRemainder}
            paidAmount={amountPaid}
            pendingAmount={courseRemainder}
            currency={isIndianCustomer ? 'INR' : 'USD'}
            plan={{
              bookingAmount: disc(PROGRAM_DATA.bookingAmount),
              installments: PROGRAM_DATA.installments.map((inst) => ({
                amount: disc(inst.amount),
                dueDate: inst.dueDate,
                label: inst.label,
              })),
            }}
            paidScheduleSteps={1}
            lastPaidAt={new Date().toISOString()}
            nsdcRequired={isNsdc && isIndianCustomer}
            nsdcCompleted={false}
          />
        ) : (
          <div className="overflow-hidden bg-surface-inverse text-text-inverse shadow-lg rounded-2xl">
            <div className="p-5 sm:p-6 space-y-4">

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-status-success-solid/20">
                  <CheckCircleIcon className="h-6 w-6 text-status-success-border" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-medium text-text-inverse">Payment Confirmed!</h1>
                  <p className="mt-0.5 text-sm text-white/75">
                    Thank you, {userDetails.fullName || 'there'}. You're all set.
                  </p>
                  <p className="mt-0.5 text-sm text-white/55">
                    Order ID: <span className="text-white/85">{orderId}</span>
                    {userDetails.email && (
                      <> · <span className="text-white/75">{userDetails.email}</span></>
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5">
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-white/55">Program</span>
                    <span className="text-right text-white/85">{PROGRAM_DATA.title}</span>
                  </div>
                  {selectedCohort && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="shrink-0 text-white/55">Cohort</span>
                      <span className="text-right text-white/85">{formatCohortDate(selectedCohort.startDate)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-2.5 space-y-2">
                    {mult < 1 && (selectedAddonLines.length > 0 || checkoutAddonsTotal > 0) ? (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-white/55">Program + add-ons</span>
                        <span className="text-white/85 tabular-nums">{formatCheckoutPrice(amountPaid, isIndianCustomer)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-white/55">Program fee</span>
                          <span className="text-white/85 tabular-nums">{formatCheckoutPrice(disc(PROGRAM_DATA.totalFee), isIndianCustomer)}</span>
                        </div>
                        {selectedAddonLines.map((line) => (
                          <div key={line.id} className="flex justify-between gap-3 text-sm">
                            <span className="text-white/55 text-left min-w-0 pr-2">{localizeInrAmountsInCopy(line.name, isIndianCustomer)}</span>
                            <span className="text-white/85 tabular-nums shrink-0">{formatCheckoutPrice(disc(line.price), isIndianCustomer)}</span>
                          </div>
                        ))}
                        {checkoutAddonsTotal > 0 && selectedAddonLines.length === 0 && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-white/55">Add-ons</span>
                            <span className="text-white/85 tabular-nums">{formatCheckoutPrice(disc(checkoutAddonsTotal), isIndianCustomer)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between gap-3 border-t border-white/10 pt-2 text-sm font-normal text-white">
                      <span>Total paid</span>
                      <span className="tabular-nums">{formatCheckoutPrice(amountPaid, isIndianCustomer)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── What happens next + email note ───────────────────────── */}
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-normal text-text-muted">What happens next?</h2>
          <div className="space-y-3">

            {!isNsdc ? (
              <ProductAccessCard
                productName={PROGRAM_DATA.title}
                productTag="Main Program"
                accessType="non_nsdc_completion"
                nonNsdcCtaUrls={{
                  whatsappUrl: PROGRAM_DATA.whatsapp_group_url ?? '#',
                  dashboardUrl: PROGRAM_DATA.redirect_url ?? '#',
                  ordersPath: '/portal/orders',
                }}
              />
            ) : PROGRAM_DATA.isNsdcAligned && isIndianCustomer ? (
              <ProductAccessCard
                productName={PROGRAM_DATA.title}
                productTag="Main Program"
                accessType="nsdc_onboarding"
                stepLayout="stacked"
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

          <p className="mt-4 text-center text-xs text-text-muted">
            A confirmation has been sent to{' '}
            <span className="font-normal text-text-secondary">{userDetails.email || 'your email'}</span>.
          </p>
        </Card>

      </div>
    </div>
  );
};
