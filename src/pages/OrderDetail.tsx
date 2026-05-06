/**
 * OrderDetail.tsx  —  Customer Portal: Order Detail
 *
 * Route: /portal/orders/:orderId
 *
 * Three sections:
 *   A. Order summary  — program name, ID, date, totals, payment status
 *   B. Payments table — list of individual transactions with receipt links
 *   C. Access panel   — NSDC form / email confirm / access links (via AccessPanel)
 *
 * Partial-payment info box is always shown when paymentStatus === 'partial'
 * so the learner is aware of the outstanding balance without being blocked.
 *
 * When you have a real backend:
 *   - Replace getOrder() with a fetch() call.
 *   - Add auth guard / redirect to login if no session.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { AccessPanel } from '../components/AccessPanel';
import { ToolAccessList } from '../components/ToolAccessList';
import { PartialPaymentStatus } from '../components/PartialPaymentStatus';
import { NsdcAlertCard } from '../components/NsdcAlertCard';
import { getOrder } from '../services/portalService';
import { formatDate, formatDateTime } from '../utils/formatters';
import type { Order, Payment, LmsEnrollmentStatus } from '../types/order';

// ─── Access upgrade logic ─────────────────────────────────────────────────────────

/**
 * Payment fraction at which a partial payer is eligible for a full-access upgrade,
 * provided their cohort is also starting soon (see COHORT_PROXIMITY_DAYS).
 * 0.65 = 65% of scheduled payments completed.
 */
const FULL_ACCESS_PAYMENT_THRESHOLD = 0.65;

/**
 * Number of days before cohort start within which we consider the cohort "close".
 * When both this and the payment threshold are met, 'dummy' access upgrades to 'real'.
 */
const COHORT_PROXIMITY_DAYS = 14;

function isCohortClose(cohortStartDate?: string): boolean {
  if (!cohortStartDate) return false;
  const start = new Date(cohortStartDate).getTime();
  const now = Date.now();
  const diffDays = (start - now) / (1000 * 60 * 60 * 24);
  // Cohort is "close" when it starts within the next COHORT_PROXIMITY_DAYS days
  return diffDays >= 0 && diffDays <= COHORT_PROXIMITY_DAYS;
}

/**
 * Derives the effective LMS access level for display purposes.
 * This may return 'real' even when the backend still stores 'dummy' — the upgrade
 * will be applied on the next backend sync. The frontend shows the optimistic state
 * so the learner is not confused when they are close to cohort start and nearly paid.
 */
function deriveEffectiveAccess(order: Order): LmsEnrollmentStatus {
  if (order.lmsEnrollmentStatus === 'real') return 'real';
  if (order.installmentPlan && order.paidScheduleSteps != null) {
    const total = 1 + order.installmentPlan.installments.length;
    const fraction = order.paidScheduleSteps / total;
    if (fraction >= FULL_ACCESS_PAYMENT_THRESHOLD && isCohortClose(order.cohortStartDate)) {
      return 'real';
    }
  }
  return order.lmsEnrollmentStatus;
}

// ─── Currency / date helpers ─────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}


// ─── Payment status helpers ──────────────────────────────────────────────────────

function PaymentStatusIcon({ status }: { status: Payment['status'] }) {
  if (status === 'success') return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  if (status === 'failed') return <XCircleIcon className="h-4 w-4 text-red-500" />;
  return <ClockIcon className="h-4 w-4 text-amber-500" />;
}

function paymentStatusBadge(status: Payment['status']) {
  const map: Record<Payment['status'], { label: string; variant: 'success' | 'error' | 'warning' }> = {
    success: { label: 'Success', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
    pending: { label: 'Pending', variant: 'warning' },
  };
  return map[status];
}

// ─── Section A: Order Summary ────────────────────────────────────────────────────

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  const {
    id,
    programName,
    createdAt,
    totalAmount,
    currency,
    countryCode,
    paymentStatus,
    pendingAmount,
  } = order;

  const paidAmount = totalAmount - pendingAmount;
  const isIndian = countryCode === 'IN';

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-medium text-slate-900 leading-snug">{programName}</h2>
        <Badge variant={paymentStatus === 'paid' ? 'success' : 'warning'}>
          {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-slate-500">Order ID</span>
          <span className="font-mono text-sm text-slate-700">{id}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-slate-500">Created</span>
          <span className="text-slate-800">{formatDate(createdAt)}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-slate-500">Total</span>
          <span className="font-semibold text-slate-900">{formatAmount(totalAmount, currency)}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-slate-500">Country</span>
          <span className="text-slate-800">{isIndian ? 'India' : countryCode}</span>
        </div>
      </div>

      {/* Paid / Pending breakdown */}
      <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Paid</span>
          <span className="font-semibold text-slate-900">{formatAmount(paidAmount, currency)}</span>
        </div>
        {paymentStatus === 'partial' && (
          <div className="flex justify-between">
            <span className="text-slate-500">Pending</span>
            <span className="font-semibold text-amber-700">{formatAmount(pendingAmount, currency)}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Section B: Payments table ───────────────────────────────────────────────────

interface PaymentsTableProps {
  payments: Payment[];
  currency: string;
  /** For in-page anchors (e.g. partial-payment hero “View payments”) */
  sectionId?: string;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, currency, sectionId }) => {
  const wrap = (node: React.ReactNode) =>
    sectionId ? (
      <div id={sectionId} className="scroll-mt-24">
        {node}
      </div>
    ) : (
      node
    );

  if (payments.length === 0) {
    return wrap(
      <Card className="p-5 sm:px-6 sm:py-4">
        <h3 className="text-base font-medium text-slate-900 mb-3">Payment History</h3>
        <p className="text-sm text-slate-500">No payment records found for this order.</p>
      </Card>,
    );
  }

  return wrap(
      <Card className="p-5 sm:px-6 sm:py-4">
      <h3 className="text-base font-medium text-slate-900 mb-4">Payment History</h3>
      <div className="divide-y divide-slate-100">
        {payments.map((payment) => {
          const badge = paymentStatusBadge(payment.status);
          return (
            <div key={payment.id} className="py-3 flex items-start gap-3">
              {/* Status icon */}
              <div className="mt-0.5 flex-shrink-0">
                <PaymentStatusIcon status={payment.status} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-base font-medium text-slate-900 leading-normal">
                      {formatAmount(payment.amount, currency)}
                      {payment.isPartial && (
                        <span className="ml-2 text-sm font-normal text-slate-500">(Partial)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5 leading-normal">{formatDateTime(payment.createdAt)}</p>
                    <p className="text-sm text-slate-400 font-sans leading-normal">{payment.id}</p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                {payment.receiptUrl && (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-sm font-medium text-primary hover:underline leading-normal"
                  >
                    View receipt
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>,
  );
};

// ─── Loading skeleton ────────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="h-5 bg-slate-200 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
      <div className="h-4 bg-slate-200 rounded w-24" />
      <div className="h-12 bg-slate-100 rounded" />
    </div>
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
      <div className="h-4 bg-slate-200 rounded w-32" />
      <div className="h-20 bg-slate-100 rounded" />
    </div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────────

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    // Real version: GET /api/portal/orders/:orderId  (auth via session)
    getOrder(orderId)
      .then(({ order: fetchedOrder, payments: fetchedPayments }) => {
        setOrder(fetchedOrder);
        setPayments(fetchedPayments);
      })
      .catch(() => setError("We couldn't load this order. Please go back and try again."))
      .finally(() => setLoading(false));
  }, [orderId]);

  /**
   * Called by AccessPanel when NSDC or email confirmation succeeds.
   * Merges partial updates so the panel reflects the new state immediately
   * without needing a full page reload.
   */
  const handleOrderUpdated = (updates: Partial<Order>) => {
    setOrder((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const lastSuccessfulPaymentAt =
    payments
      .filter((p) => p.status === 'success')
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]?.createdAt ?? null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Back link ── */}
        {/* ── Error state ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && !error && <Skeleton />}

        {/* ── Content ── */}
        {!loading && !error && order && (
          <>
            {order.paymentStatus === 'partial' && order.installmentPlan ? (
              <>
                {/* A′. Instalment progress (hero + access status + NSDC nudge + schedule) */}
                <PartialPaymentStatus
                  orderId={order.id}
                  programName={order.programName}
                  email={order.customerEmail}
                  totalAmount={order.totalAmount}
                  paidAmount={order.totalAmount - order.pendingAmount}
                  pendingAmount={order.pendingAmount}
                  currency={order.currency}
                  plan={order.installmentPlan}
                  paidScheduleSteps={order.paidScheduleSteps ?? 1}
                  lastPaidAt={lastSuccessfulPaymentAt ?? order.createdAt}
                  payments={payments}
                  onPayFullRemaining={() => {
                    /* wire up to payment gateway for this order */
                  }}
                  onPayNextInstallment={() => {
                    /* wire up to payment gateway for this order */
                  }}
                  nsdcRequired={order.nsdcRequired}
                  nsdcCompleted={order.nsdcCompleted}
                  effectiveLmsStatus={deriveEffectiveAccess(order)}
                  bookingToolAccesses={(order.toolAccesses ?? []).filter((t) => t.includedInBooking)}
                  onNsdcCtaClick={() => {
                    document.getElementById('get-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </>
            ) : (
              <>
                <OrderSummary order={order} />
                {/* NSDC nudge for fully-paid / non-partial orders — surfaced immediately
                    after the order summary so it is not buried below access/tool sections */}
                {order.nsdcRequired && !order.nsdcCompleted && (
                  <NsdcAlertCard
                    onCtaClick={() => {
                      document.getElementById('get-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                )}
              </>
            )}

            {/* B. Get access / access panel — full NSDC form or access links */}
            <Card id="get-access" className="p-5 sm:p-6 scroll-mt-6">
              <h3 className="text-base font-medium text-slate-900 mb-4">
                {order.nsdcRequired && !order.nsdcCompleted
                  ? 'Complete NSDC Registration'
                  : 'Access Details'}
              </h3>
              {/* AccessPanel handles all the NSDC / email / access-links logic */}
              <AccessPanel
                order={{ ...order, lmsEnrollmentStatus: deriveEffectiveAccess(order) }}
                onOrderUpdated={handleOrderUpdated}
              />
            </Card>

            {/* C. Items and access included with this order */}
            {/* Visibility is independent of NSDC/email gating — shown as long as the
                user owns this order. To couple to access state, wrap in a condition here. */}
            <Card className="p-5 sm:p-6">
              <ToolAccessList toolAccesses={order.toolAccesses ?? []} />
            </Card>

            {/* D. Payment history — reference log, kept at the bottom */}
            <PaymentsTable
              payments={payments}
              currency={order.currency}
              sectionId={
                order.paymentStatus === 'partial' && order.installmentPlan
                  ? 'order-payments'
                  : undefined
              }
            />
          </>
        )}

      </div>
    </div>
  );
};
