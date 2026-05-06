/**
 * PartialPaymentStatus.tsx
 *
 * Rich "booking confirmed + instalment progress" UI for partial payers
 * (matches the GrowthSchool mobile reference: dark hero card, progress bar,
 * pay-full vs next-part tiles, collapsible schedule with receipt links).
 *
 * Used from:
 *   - /portal/enroll Step 4 (post-checkout wizard)
 *   - /portal/orders/:id when order.installmentPlan is present
 *
 * DB integration: persist `installmentPlan` + `paidScheduleSteps` (or derive steps
 * from payment rows) on the order when the user chooses partial payment at checkout.
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import { Badge } from './Badge';
import { formatDate } from '../utils/formatters';
import nsdcLogo from '../assets/nsdc-logo.svg';
import type { LmsEnrollmentStatus, ToolAccess, PartialInstallmentPlan, Payment } from '../types/order';

/** Brand dark shell for partial-payment hero — exact hex (also `theme.colors.brand.hero` in Tailwind). */
const PARTIAL_PAYMENT_HERO_FILL = '#041B01';

// ─── Date / currency helpers ─────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Payment-to-schedule matching ────────────────────────────────────────────────

/**
 * Sorts successful payments by date (oldest first) and returns them so they can
 * be matched positionally to schedule steps: index 0 = booking, index 1 = installment 1, etc.
 */
function matchPaymentsToSteps(payments: Payment[]): Payment[] {
  return [...payments]
    .filter((p) => p.status === 'success')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// ─── Schedule row (timeline) ─────────────────────────────────────────────────────

interface ScheduleRowProps {
  label: string;
  sublabel: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending';
  isLast?: boolean;
  /** Payment ID shown as a monospace chip on paid rows */
  paymentId?: string;
  /** Receipt URL shown as a link on paid rows */
  receiptUrl?: string;
  /** ISO datetime — if provided, replaces sublabel with "Paid on …" */
  paidOn?: string;
  /** Highlights this row as the next action item */
  isNext?: boolean;
  /** Called when the inline pay button is clicked on the next-pending row */
  onPay?: () => void;
  /** Amount shown on the inline pay button */
  payAmount?: number;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({
  label,
  sublabel,
  amount,
  currency,
  status,
  isLast = false,
  paymentId,
  receiptUrl,
  paidOn,
  isNext = false,
  onPay,
  payAmount,
}) => {
  // DUE NEXT rows get a left amber accent + slightly warmer background to feel actionable.
  // Future PENDING rows are dimmed so attention stays on what matters now.
  const isPending = status === 'pending' && !isNext;

  return (
    <div
      className={[
        'grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 items-stretch py-3',
        !isLast ? 'border-b border-white/10' : '',
        isNext ? '-mx-4 px-4 bg-amber-500/15' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Timeline dot + connector */}
      <div className="flex h-full min-h-0 w-full flex-col items-center pt-0.5 flex-shrink-0">
        {status === 'paid' ? (
          <div className="h-5 w-5 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
        ) : isNext ? (
          /* Due Next: amber-tinted ring to match the row accent */
          <div className="h-5 w-5 rounded-full border-2 border-amber-400 flex-shrink-0" />
        ) : (
          /* Future pending: dimmer dot */
          <div className="h-5 w-5 rounded-full border-2 border-white/25 flex-shrink-0" />
        )}
        {!isLast && (
          <div
            className={[
              'w-0.5 flex-1 min-h-[1.5rem] mt-1',
              status === 'paid' ? 'bg-green-500' : 'bg-white/20',
            ].join(' ')}
          />
        )}
      </div>

      {/* Row content — future pending rows are dimmed */}
      <div className={['min-w-0 pb-1', isPending ? 'opacity-50' : ''].filter(Boolean).join(' ')}>
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm font-normal text-slate-200 leading-tight">{label}</span>
          <Badge
            variant={status === 'paid' ? 'success' : isNext ? 'warning' : 'default'}
            className="flex-shrink-0"
          >
            {status === 'paid' ? 'PAID' : isNext ? 'DUE NEXT' : 'PENDING'}
          </Badge>
        </div>

        <p className="text-sm text-slate-400 mt-0.5">
          {paidOn ? `Paid on ${formatDate(paidOn)}` : sublabel}
        </p>

        <p className="text-sm font-medium text-white mt-1">{formatCurrency(amount, currency)}</p>

        {status === 'paid' && (paymentId || receiptUrl) && (
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {paymentId && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-xs text-slate-400 font-mono">
                {paymentId}
              </span>
            )}
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                View receipt
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {isNext && onPay && (
          <button
            type="button"
            onClick={onPay}
            className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Pay {payAmount != null ? formatCurrency(payAmount, currency) : 'now'}
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── NSDC Inline Banner (dark-themed, lives inside the dark hero card) ───────────

interface NsdcInlineBannerProps {
  onCtaClick?: () => void;
}

/**
 * Compact NSDC action strip rendered inside the dark hero card, right after the
 * booking confirmation header. Keeps NSDC visible before payment info so the user
 * sees the required next step without scrolling past payment details.
 */
const NsdcInlineBanner: React.FC<NsdcInlineBannerProps> = ({ onCtaClick }) => (
  <div className="rounded-xl bg-amber-500/15 border border-amber-500/25 overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3">
      <img src={nsdcLogo} alt="NSDC" className="h-7 w-auto flex-shrink-0 brightness-0 invert opacity-90" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-200 leading-snug">
          NSDC registration required
        </p>
        <p className="text-xs text-amber-300/70 mt-0.5 leading-normal">
          Needed once to activate government-certified LMS access. Takes under 2 minutes.
        </p>
      </div>
      <button
        type="button"
        onClick={onCtaClick}
        className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        Complete
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </div>
  </div>
);

// ─── Props ───────────────────────────────────────────────────────────────────────

export interface PartialPaymentStatusProps {
  orderId: string;
  programName: string;
  email?: string;
  phoneDisplay?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  currency: string;
  plan: PartialInstallmentPlan;
  /** 1 = booking paid only; 2 = + first part; … */
  paidScheduleSteps: number;
  /** Shown on the booking row ("Paid on …") — used as fallback when no matching payment found */
  lastPaidAt: string;
  /** In-page anchor id for the link next to Order ID (order detail: payments list) */
  orderSummaryAnchorId?: string;
  /** Link label next to Order ID */
  anchorLinkLabel?: string;
  /** Optional promotional discount on the remaining balance */
  discountedRemainingAmount?: number;
  discountExpiresAt?: string;
  onPayFullRemaining?: () => void;
  onPayNextInstallment?: () => void;

  /**
   * Successful payments for this order, used to surface payment IDs and receipt
   * links next to the corresponding schedule rows when the card is expanded.
   * Pass an empty array (or omit) if not yet available — receipt section simply
   * won't appear (e.g. immediately after checkout in the enroll wizard).
   */
  payments?: Payment[];

  // ── Access & NSDC state ──────────────────────────────────────────────────────
  /**
   * Whether NSDC registration is required for this learner (Indian customers only).
   * When true and nsdcCompleted is false, a nudge card is shown near the top.
   */
  nsdcRequired?: boolean;
  /** True once the learner has submitted NSDC details; hides the nudge card. */
  nsdcCompleted?: boolean;
  /**
   * Called when the learner clicks the NSDC nudge CTA.
   * Typically scrolls the page to the full NSDC form below.
   */
  onNsdcCtaClick?: () => void;
  /**
   * The computed LMS access level for this order.
   * Pass 'real' when the payment threshold + cohort proximity rules have been met,
   * even if the backend still shows 'dummy', so the UI reflects the upgrade immediately.
   */
  effectiveLmsStatus?: LmsEnrollmentStatus;
  /**
   * Tools that were paid as part of the booking amount and are therefore
   * available immediately, regardless of the remaining instalment balance.
   */
  bookingToolAccesses?: ToolAccess[];
  /**
   * When the parent cancels Card padding on top (e.g. Portal enroll), use a top radius
   * that matches a typical `rounded-xl` shell; bottom corners stay square (`rounded-b-none`).
   */
  flushTopWithCardShell?: boolean;
}

export const PartialPaymentStatus: React.FC<PartialPaymentStatusProps> = ({
  orderId,
  programName,
  email,
  phoneDisplay,
  totalAmount,
  paidAmount,
  pendingAmount,
  currency,
  plan,
  paidScheduleSteps,
  lastPaidAt,
  orderSummaryAnchorId = 'order-payments',
  anchorLinkLabel = 'View payments',
  discountedRemainingAmount,
  discountExpiresAt,
  onPayFullRemaining,
  onPayNextInstallment,
  payments = [],
  nsdcRequired = false,
  nsdcCompleted = false,
  onNsdcCtaClick,
  effectiveLmsStatus = 'dummy',
  bookingToolAccesses = [],
  flushTopWithCardShell = false,
}) => {
  // Controls whether the full payment schedule is revealed below the progress bar
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { bookingAmount, installments } = plan;
  const totalSteps = 1 + installments.length;
  const lastDue = installments[installments.length - 1];

  const isDiscountActive =
    discountedRemainingAmount != null &&
    discountExpiresAt != null &&
    new Date() < new Date(discountExpiresAt);
  const fullRemaining = pendingAmount;
  const effectiveRemaining =
    isDiscountActive && discountedRemainingAmount != null
      ? discountedRemainingAmount
      : fullRemaining;

  // nextIdx: 0-based index into installments[] for the next unpaid installment
  const nextIdx = paidScheduleSteps - 1;
  const nextInstallment = nextIdx >= 0 && nextIdx < installments.length ? installments[nextIdx] : null;

  const progressFraction = Math.min(1, paidScheduleSteps / totalSteps);

  const isFullAccess = effectiveLmsStatus === 'real';
  const showNsdcNudge = nsdcRequired && !nsdcCompleted;

  // Payments matched positionally to schedule steps (oldest first)
  const matchedPayments = matchPaymentsToSteps(payments);

  return (
    <div className="space-y-4">
      {/* ── Dark hero: booking confirmed + access status + progress + pay CTAs ── */}
      <div
        style={{ backgroundColor: PARTIAL_PAYMENT_HERO_FILL }}
        className={[
          'text-white shadow-lg overflow-hidden',
          flushTopWithCardShell ? 'rounded-t-xl rounded-b-none' : 'rounded-2xl',
        ].join(' ')}
        aria-label={`Booking confirmed: ${programName}`}
      >
        <div className="p-5 sm:p-6 space-y-4">

          {/* Booking confirmed header — access badge lives here to avoid a redundant section heading */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-medium text-white">Booking Confirmed!</h2>
              </div>
              {(email || phoneDisplay) && (
                <p className="text-sm text-slate-300 mt-1 truncate">
                  {email}
                  {email && phoneDisplay && ' · '}
                  {phoneDisplay}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-1">
                Order ID:{' '}
                <span className="font-sans text-slate-200">#{orderId}</span>
                {' · '}
                <a
                  href={`#${orderSummaryAnchorId}`}
                  className="text-emerald-400 font-medium hover:text-emerald-300 underline underline-offset-2"
                >
                  {anchorLinkLabel}
                </a>
              </p>
            </div>
          </div>

          {/* ── NSDC inline banner — shown before access detail so it is seen before payment info ── */}
          {showNsdcNudge && (
            <NsdcInlineBanner onCtaClick={onNsdcCtaClick} />
          )}

          {/* ── Booking tool links (when bundled tools exist) ── */}
          {bookingToolAccesses.length > 0 && (
            <div className="rounded-xl bg-white/5 border border-white/10">
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Included with booking</p>
                <div className="flex flex-wrap gap-2">
                  {bookingToolAccesses.map((tool) => {
                    const url = tool.activationUrl ?? tool.loginUrl;
                    return url ? (
                      <a
                        key={tool.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        {tool.displayName}
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-70" />
                      </a>
                    ) : (
                      <span
                        key={tool.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200"
                      >
                        {tool.displayName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Progress (expandable / collapsible) ── */}
          <div className="border-t border-white/10 pt-4">

            {/* Always-visible summary — clicking anywhere here toggles the schedule */}
            <button
              type="button"
              onClick={() => setScheduleOpen((prev) => !prev)}
              className="w-full text-left space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
              aria-expanded={scheduleOpen}
            >
              {/* Title row + toggle label */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Payment Progress</p>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  {scheduleOpen ? 'Hide schedule' : 'View schedule'}
                  <ChevronDownIcon
                    className={[
                      'h-4 w-4 text-slate-400 transition-transform duration-200',
                      scheduleOpen ? 'rotate-180' : '',
                    ].join(' ')}
                  />
                </span>
              </div>

              {/* Paid / total amounts */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-medium text-white">{formatCurrency(paidAmount, currency)}</span>
                <span className="text-slate-500 text-sm">/ {formatCurrency(totalAmount, currency)}</span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressFraction * 100}%` }}
                />
              </div>

              {/* Step count + percentage */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  {paidScheduleSteps}/{totalSteps} payments
                </p>
                <p className="text-xs font-medium text-emerald-400">
                  {Math.round(progressFraction * 100)}%
                </p>
              </div>
            </button>

            {/* Expandable schedule — slides in below the summary */}
            <div
              className={[
                'transition-all duration-300 ease-in-out overflow-hidden',
                scheduleOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0',
              ].join(' ')}
              aria-hidden={!scheduleOpen}
            >
              <div className="border-t border-white/10 mt-4 px-4">

                {/* Booking amount row */}
                <ScheduleRow
                  label="Booking Amount Paid"
                  sublabel={`Paid on ${formatDate(lastPaidAt)}`}
                  amount={bookingAmount}
                  currency={currency}
                  status={paidScheduleSteps >= 1 ? 'paid' : 'pending'}
                  paymentId={matchedPayments[0]?.id}
                  receiptUrl={matchedPayments[0]?.receiptUrl}
                  paidOn={paidScheduleSteps >= 1 ? (matchedPayments[0]?.createdAt ?? lastPaidAt) : undefined}
                />

                {/* Installment rows */}
                {installments.map((inst, idx) => {
                  const stepIndex = idx + 1;
                  const paid = paidScheduleSteps > stepIndex;
                  // The next unpaid step is the one where stepIndex equals paidScheduleSteps
                  const isNextPending = !paid && stepIndex === paidScheduleSteps;
                  const matchedPayment = matchedPayments[stepIndex];

                  return (
                    <ScheduleRow
                      key={inst.dueDate + String(idx)}
                      label={`Scheduled payment ${idx + 1}`}
                      sublabel={`Due ${formatDate(inst.dueDate)}`}
                      amount={inst.amount}
                      currency={currency}
                      status={paid ? 'paid' : 'pending'}
                      isLast={idx === installments.length - 1}
                      paymentId={paid ? matchedPayment?.id : undefined}
                      receiptUrl={paid ? matchedPayment?.receiptUrl : undefined}
                      paidOn={paid ? matchedPayment?.createdAt : undefined}
                      isNext={isNextPending}
                      onPay={isNextPending ? onPayNextInstallment : undefined}
                      payAmount={isNextPending ? inst.amount : undefined}
                    />
                  );
                })}

                {/* Footer: final due date reminder */}
                {lastDue && pendingAmount > 0 && (
                  <p className="text-sm text-slate-400 py-3 border-t border-white/10 leading-normal">
                    Complete all payments by{' '}
                    <span className="font-medium text-slate-200">
                      {formatDate(lastDue.dueDate)}
                    </span>{' '}
                    to unlock full access.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Pay options (always visible when there is a pending balance) ── */}
          {installments.length > 0 && pendingAmount > 0 && (
            <div className="border-t border-white/10 pt-4 space-y-3">
              {/* Pay in full row */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">Pay in full</p>
                  {isDiscountActive && discountedRemainingAmount != null && discountedRemainingAmount < fullRemaining && (
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      Save {formatCurrency(fullRemaining - discountedRemainingAmount, currency)}!
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onPayFullRemaining}
                  className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  Pay {formatCurrency(effectiveRemaining, currency)}
                </button>
              </div>

              {nextInstallment ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  {/* Pay next installment row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Scheduled payment {nextIdx + 1}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Due {formatDate(nextInstallment.dueDate)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onPayNextInstallment}
                      className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Pay {formatCurrency(nextInstallment.amount, currency)}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  All part payments are recorded. Pay any remaining balance above.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
