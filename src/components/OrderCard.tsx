/**
 * OrderCard.tsx
 *
 * Displays a single order in the portal home order list.
 * Shows payment summary and access status; the whole card navigates to the order detail page.
 *
 * Access status has 6 states derived from the order flags — all text-only,
 * no interactive elements here (those live on the OrderDetail page).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from './Badge';
import { Card } from './Card';
import type { Order } from '../types/order';
import { formatDate } from '../utils/formatters';

// ─── Currency formatting ─────────────────────────────────────────────────────────

/**
 * Formats an amount using the order's own currency code.
 * Falls back to INR formatting for Indian orders.
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Access status derivation ────────────────────────────────────────────────────

/**
 * Derives the access status message and icon for an order.
 * These 6 states map exactly to the spec.
 */
function getAccessStatus(order: Order): {
  message: string;
  type: 'action' | 'info' | 'success';
} {
  const { nsdcRequired, nsdcCompleted, lmsEnrollmentStatus, emailConfirmed } = order;

  // Indian learner path (NSDC required)
  if (nsdcRequired) {
    if (!nsdcCompleted && order.nsdcRetroactiveCollectionRequired) {
      return {
        message:
          'NSDC registration is now required for this earlier purchase (details were not collected when you enrolled). Complete it once to stay aligned with certification rules.',
        type: 'action',
      };
    }
    if (!nsdcCompleted) {
      return {
        message: 'Action needed: complete NSDC form to unlock full LMS access.',
        type: 'action',
      };
    }
    if (lmsEnrollmentStatus === 'real') {
      return { message: 'Full LMS access active.', type: 'success' };
    }
    // nsdcCompleted but still on dummy cohort (partial payment or processing)
    return {
      message: 'Temporary cohort access active; full access after NSDC + full payment.',
      type: 'info',
    };
  }

  // Non-Indian learner path (email confirmation required)
  if (!emailConfirmed) {
    return {
      message: 'Confirm your email to activate access.',
      type: 'action',
    };
  }
  return { message: 'Access active.', type: 'success' };
}

// ─── Component ───────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const {
    id,
    programName,
    createdAt,
    totalAmount,
    currency,
    paymentStatus,
    pendingAmount,
  } = order;

  const paidAmount = totalAmount - pendingAmount;
  const accessStatus = getAccessStatus(order);

  const AccessIcon =
    accessStatus.type === 'action'
      ? ExclamationTriangleIcon
      : accessStatus.type === 'success'
      ? CheckCircleIcon
      : InformationCircleIcon;

  const accessIconClass =
    accessStatus.type === 'action'
      ? 'text-amber-500'
      : accessStatus.type === 'success'
      ? 'text-green-500'
      : 'text-blue-500';

  return (
    <Link
      to={`/portal/orders/${id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View order ${id}: ${programName}`}
    >
      <Card className="p-5 sm:p-6 flex flex-col gap-4 h-full transition-shadow transition-colors group-hover:shadow-md group-hover:border-slate-300 cursor-pointer">
      {/* ── Header row: program name + payment badge ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900 text-base leading-snug">
            {programName}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Order #{id} · {formatDate(createdAt)}
          </p>
        </div>
        <Badge variant={paymentStatus === 'paid' ? 'success' : 'warning'} className="flex-shrink-0">
          {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </div>

      {/* ── Access status ── */}
      <div
        className={[
          'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm',
          accessStatus.type === 'action'
            ? 'bg-amber-50 text-amber-800'
            : accessStatus.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-blue-50 text-blue-800',
        ].join(' ')}
      >
        <AccessIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${accessIconClass}`} />
        <span>{accessStatus.message}</span>
      </div>
    </Card>
    </Link>
  );
};
