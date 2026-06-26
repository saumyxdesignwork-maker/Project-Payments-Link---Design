/**
 * OrderDetailPage.tsx  —  Customer Portal: My Orders › Order Detail
 *
 * Route: /portal/orders/:orderId
 *
 * This page belongs to the "My Orders" section and covers transaction/admin tasks:
 *   A. Order summary  — program name, ID, date, totals, payment status
 *   B. Instalment progress — payment schedule hero (partial orders only)
 *   C. Payment history — individual transactions with receipt links
 *
 * Access-related content (AccessPanel, ToolAccessList) has been moved to the
 * "Get Access" section: /portal/access/:orderId
 *
 * NSDC / access CTAs navigate to that route instead of scrolling in-page.
 *
 * When you have a real backend:
 *   - Replace getOrder() with a fetch() call.
 *   - Add auth guard / redirect to login if no session.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { DocumentSection } from '../../components/DocumentSection';
import type { DocumentItem } from '../../components/DocumentSection';
import { PartialPaymentStatus } from '../../components/PartialPaymentStatus';
import { NsdcAlertCard } from '../../components/NsdcAlertCard';
import { getOrder } from '../../services/portalService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { INVOICE_DOCUMENT_LABELS, REFUND_DOCUMENT_LABELS } from '../../types/order';
import type { Order, Payment, Receipt, Invoice, Refund, LmsEnrollmentStatus } from '../../types/order';

// ─── Access upgrade logic ─────────────────────────────────────────────────────

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

// ─── Invoice label derivation ─────────────────────────────────────────────────

/**
 * Returns the billing document label for the order summary card.
 * Indian orders with an NSDC-mandatory program generate both a Bill of Supply
 * (for NSDC-aligned items) and a GST Invoice (for non-NSDC items).
 * Returns null for non-Indian orders where GST invoices don't apply.
 */
function getInvoiceLabel(order: Order): string | null {
  if (order.currency !== 'INR') return null;
  if (order.nsdcRequired && order.programNsdcMandatory) {
    return 'Bill of Supply + GST Invoice';
  }
  return 'GST Invoice';
}

// ─── Currency / date helpers ──────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}


// ─── Payment status helpers ───────────────────────────────────────────────────

function PaymentStatusIcon({ status }: { status: Payment['status'] }) {
  if (status === 'success') return <CheckCircleIcon className="h-4 w-4 text-status-success-solid" />;
  if (status === 'failed') return <XCircleIcon className="h-4 w-4 text-status-error-solid" />;
  return <ClockIcon className="h-4 w-4 text-status-warning-solid" />;
}

function paymentStatusBadge(status: Payment['status']) {
  const map: Record<Payment['status'], { label: string; variant: 'success' | 'error' | 'warning' }> = {
    success: { label: 'Success', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
    pending: { label: 'Pending', variant: 'warning' },
  };
  return map[status];
}

// ─── Section A: Order Summary ─────────────────────────────────────────────────

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
  const invoiceLabel = getInvoiceLabel(order);

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-medium leading-snug text-text-primary">{programName}</h2>
        <Badge variant={paymentStatus === 'paid' ? 'success' : 'warning'}>
          {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-text-muted">Order ID</span>
          <span className="font-mono text-sm text-text-secondary">{id}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-text-muted">Created</span>
          <span className="text-text-secondary">{formatDate(createdAt)}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-text-muted">Total</span>
          <span className="font-semibold text-text-primary">{formatAmount(totalAmount, currency)}</span>
        </div>
        <div className="flex justify-between sm:flex-col sm:gap-0.5">
          <span className="text-text-muted">Country</span>
          <span className="text-text-secondary">{isIndian ? 'India' : countryCode}</span>
        </div>
        {invoiceLabel && (
          <div className="flex justify-between sm:flex-col sm:gap-0.5 sm:col-span-2">
            <span className="text-text-muted">Billing documents</span>
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <DocumentTextIcon className="h-3.5 w-3.5 flex-shrink-0 text-text-subtle" />
              {invoiceLabel}
            </span>
          </div>
        )}
      </div>

      {/* Paid / Pending breakdown */}
      <div className="border-t border-border-subtle pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Paid</span>
          <span className="font-semibold text-text-primary">{formatAmount(paidAmount, currency)}</span>
        </div>
        {paymentStatus === 'partial' && (
          <div className="flex justify-between">
            <span className="text-text-muted">Remaining</span>
            <span className="font-semibold text-status-warning-text">{formatAmount(pendingAmount, currency)}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Section C: Payments table ────────────────────────────────────────────────

interface PaymentsTableProps {
  payments: Payment[];
  currency: string;
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
        <h3 className="mb-3 text-base font-medium text-text-primary">Payment History</h3>
        <p className="text-sm text-text-muted">No payments on record.</p>
      </Card>,
    );
  }

  return wrap(
    <Card className="p-5 sm:px-6 sm:py-4">
      <h3 className="mb-4 text-base font-medium text-text-primary">Payment History</h3>
      <div className="divide-y divide-border-subtle">
        {payments.map((payment) => {
          const badge = paymentStatusBadge(payment.status);
          return (
            <div key={payment.id} className="py-3 flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <PaymentStatusIcon status={payment.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-base font-medium leading-normal text-text-primary">
                      {formatAmount(payment.amount, currency)}
                      {payment.isPartial && (
                        <span className="ml-2 text-sm font-normal text-text-muted">(Partial)</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm leading-normal text-text-muted">{formatDateTime(payment.createdAt)}</p>
                    <p className="font-sans text-sm leading-normal text-text-muted">{payment.id}</p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>,
  );
};

// ─── Document section mappers ─────────────────────────────────────────────────
//
// These pure helpers convert domain arrays into the generic DocumentItem shape
// consumed by DocumentSection. All layout/rendering logic lives in that component.

function receiptsToItems(receipts: Receipt[]): DocumentItem[] {
  const statusBadge: Record<Receipt['status'], { label: string; variant: 'success' | 'warning' | 'default' }> = {
    available:   { label: 'Ready',      variant: 'success' },
    pending:     { label: 'Generating', variant: 'warning' },
    unavailable: { label: 'N/A',        variant: 'default' },
  };
  // Sort ascending by issuedAt so booking receipt always appears first, then
  // instalment receipts in the order they were issued. Safe for single-receipt orders.
  const ordered = [...receipts].sort(
    (a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime(),
  );
  return ordered.map((r) => ({
    id: r.id,
    title: r.label ?? 'Receipt',
    meta: [
      { text: r.id, mono: true },
      { text: formatDate(r.issuedAt) },
    ],
    badge: statusBadge[r.status],
    actions: r.status === 'available' && r.downloadUrl
      ? [{ label: 'Download', href: r.downloadUrl }]
      : undefined,
  }));
}

/**
 * Resolves the display label for an invoice document.
 * Resolution order: explicit label → documentType map → fallback "Invoice".
 */
function resolveInvoiceLabel(inv: Invoice): string {
  if (inv.label) return inv.label;
  if (inv.documentType) return INVOICE_DOCUMENT_LABELS[inv.documentType];
  return 'Invoice';
}

function invoicesToItems(invoices: Invoice[]): DocumentItem[] {
  const statusBadge: Record<Invoice['status'], { label: string; variant: 'success' | 'warning' | 'default' }> = {
    available:   { label: 'Ready',      variant: 'success' },
    pending:     { label: 'Generating', variant: 'warning' },
    unavailable: { label: 'N/A',        variant: 'default' },
  };
  return invoices.map((inv) => ({
    id: inv.id,
    title: resolveInvoiceLabel(inv),
    meta: [
      { text: inv.id, mono: true },
      { text: formatDate(inv.issuedAt) },
      { text: formatAmount(inv.amount, inv.currency) },
      // Show outstanding balance on interim invoices; hidden when absent or zero
      ...(inv.amountDue && inv.amountDue > 0
        ? [{ text: `Amount due: ${formatAmount(inv.amountDue, inv.currency)}` }]
        : []),
    ],
    badge: statusBadge[inv.status],
    actions: inv.status === 'available' && inv.downloadUrl
      ? [{ label: 'Download', href: inv.downloadUrl }]
      : undefined,
  }));
}

/**
 * Resolves the display label for a refund document.
 * Resolution order: explicit label → documentType map → fallback "Refund".
 */
function resolveRefundLabel(refund: Refund): string {
  if (refund.label) return refund.label;
  if (refund.documentType) return REFUND_DOCUMENT_LABELS[refund.documentType];
  return 'Refund';
}

function refundsToItems(refunds: Refund[]): DocumentItem[] {
  const statusBadge: Record<Refund['status'], { label: string; variant: 'success' | 'warning' | 'error' }> = {
    processed: { label: 'Processed', variant: 'success' },
    pending:   { label: 'Pending',   variant: 'warning' },
    rejected:  { label: 'Rejected',  variant: 'error'   },
  };
  return refunds.map((refund) => ({
    id: refund.id,
    title: resolveRefundLabel(refund),
    meta: [
      { text: refund.id, mono: true },
      { text: formatDateTime(refund.initiatedAt) },
      { text: formatAmount(refund.amount, refund.currency) },
      ...(refund.reason ? [{ text: refund.reason }] : []),
      ...(refund.referenceId ? [{ text: `Ref: ${refund.referenceId}`, mono: true }] : []),
    ],
    badge: statusBadge[refund.status],
    actions: refund.downloadUrl
      ? [{ label: 'Download', href: refund.downloadUrl }]
      : undefined,
  }));
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="skeleton-card p-6 space-y-4">
      <div className="h-5 w-2/3 skeleton-block" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
    <div className="skeleton-card p-6 space-y-3">
      <div className="h-4 w-24 skeleton-block" />
      <div className="h-12 bg-slate-100 rounded" />
    </div>
    <div className="skeleton-card p-6 space-y-3">
      <div className="h-4 w-32 skeleton-block" />
      <div className="h-20 bg-slate-100 rounded" />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    // Real version: GET /api/portal/orders/:orderId  (auth via session)
    getOrder(orderId)
      .then(({ order: fetchedOrder, payments: fetchedPayments, receipts: fetchedReceipts, invoices: fetchedInvoices, refunds: fetchedRefunds }) => {
        setOrder(fetchedOrder);
        setPayments(fetchedPayments);
        setReceipts(fetchedReceipts);
        setInvoices(fetchedInvoices);
        setRefunds(fetchedRefunds);
      })
      .catch(() => setError("We couldn't load this order. Please go back and try again."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const lastSuccessfulPaymentAt =
    payments
      .filter((p) => p.status === 'success')
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]?.createdAt ?? null;

  /** Navigates to the "Get Access" tab for this order (used by NSDC alert only). */
  const goToAccess = () => navigate(`/portal/access/${orderId}`);

  return (
    <div className="page-shell py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Back link ── */}
        {/* ── Error state ── */}
        {error && (
          <div className="status-banner status-banner-error flex items-start gap-3 text-sm">
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
              /* A′. Instalment progress hero (partial orders) */
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
                onNsdcCtaClick={goToAccess}
                invoiceLabel={getInvoiceLabel(order)}
              />
            ) : (
              <>
                {/* A. Order summary (fully-paid / non-partial orders) */}
                <OrderSummary order={order} />
                {/* NSDC nudge — directs to the Get Access section */}
                {order.nsdcRequired && !order.nsdcCompleted && (
                  <NsdcAlertCard onCtaClick={goToAccess} />
                )}
              </>
            )}

            {/* C. Payment history */}
            <PaymentsTable
              payments={payments}
              currency={order.currency}
              sectionId={
                order.paymentStatus === 'partial' && order.installmentPlan
                  ? 'order-payments'
                  : undefined
              }
            />

            {/* D. Receipts */}
            <DocumentSection
              title="Receipts"
              emptyText="No receipts yet."
              items={receiptsToItems(receipts)}
            />

            {/* E. Invoices */}
            <DocumentSection
              title="Invoices"
              emptyText="No invoices yet."
              items={invoicesToItems(invoices)}
            />

            {/* F. Refunds */}
            <DocumentSection
              title="Refunds"
              emptyText="No refunds issued."
              items={refundsToItems(refunds)}
            />
          </>
        )}

      </div>
    </div>
  );
};
