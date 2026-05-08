/**
 * OrderCard.tsx
 *
 * Displays a single order in the portal home order list.
 * Shows top-level order metadata and access status; the whole card navigates to the order detail page.
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
    paymentStatus,
  } = order;
  const accessStatus = getAccessStatus(order);

  const AccessIcon =
    accessStatus.type === 'action'
      ? ExclamationTriangleIcon
      : accessStatus.type === 'success'
      ? CheckCircleIcon
      : InformationCircleIcon;

  const accessIconClass =
    accessStatus.type === 'action'
      ? 'text-status-warning-solid'
      : accessStatus.type === 'success'
      ? 'text-status-success-solid'
      : 'text-status-info-solid';

  return (
    <Link
      to={`/portal/orders/${id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View order ${id}: ${programName}`}
    >
      <Card className="flex h-full cursor-pointer flex-col gap-4 p-5 transition-shadow transition-colors group-hover:border-border-strong group-hover:shadow-md sm:p-6">
      {/* ── Header row: program name + payment badge ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-base font-medium leading-snug text-text-primary">
            {programName}
          </h3>
          <p className="mt-0.5 text-sm text-text-muted">
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
            ? 'bg-status-warning-bg text-status-warning-text'
            : accessStatus.type === 'success'
            ? 'bg-status-success-bg text-status-success-text'
            : 'bg-status-info-bg text-status-info-text',
        ].join(' ')}
      >
        <AccessIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${accessIconClass}`} />
        <span>{accessStatus.message}</span>
      </div>
      </Card>
    </Link>
  );
};
