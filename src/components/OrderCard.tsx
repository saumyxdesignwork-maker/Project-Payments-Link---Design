/**
 * OrderCard.tsx
 *
 * Displays a single order in the My Orders list.
 * Focused on order-level payment, billing, and item context — not fulfillment.
 *
 * Card sections (top → bottom):
 *   1. Header — program name, Order ID, date, payment status badge, items summary
 *   2. Payment summary — partial progress bar OR full-paid row (DO NOT EDIT these elements)
 *   3. Invoice context — billing document type derived from order properties
 *   4. Action row — explicit links to order detail and Get Access
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Badge } from './Badge';
import { Card } from './Card';
import type { Order } from '../types/order';
import { formatDate } from '../utils/formatters';

// ─── Items summary ────────────────────────────────────────────────────────────

/**
 * Formats a compact, single-line summary of purchased products.
 * Shows up to 2 product names; truncates the rest to "+ N more".
 */
function formatItemsSummary(order: Order): string | null {
  const products = order.purchasedProducts;
  if (!products || products.length === 0) return null;
  if (products.length === 1) return products[0].name;
  if (products.length === 2) return `${products[0].name}, ${products[1].name}`;
  return `${products[0].name}, ${products[1].name} +${products.length - 2} more`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const navigate = useNavigate();

  const {
    id,
    programName,
    createdAt,
    paymentStatus,
    totalAmount,
    pendingAmount,
    currency,
  } = order;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const paidAmount = totalAmount - pendingAmount;
  const itemsSummary = formatItemsSummary(order);

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">

      {/* ── Header: program name, order meta, items, badge ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <Link
            to={`/portal/orders/${id}`}
            className="group/title focus-visible:outline-none"
          >
            <h3 className="text-base font-medium leading-snug text-text-primary group-hover/title:text-primary transition-colors">
              {programName}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-text-muted">
            Order #{id} · {formatDate(createdAt)}
          </p>
          {itemsSummary && (
            <p className="mt-1 text-xs text-text-muted truncate">
              {itemsSummary}
            </p>
          )}
        </div>
        <Badge
          variant={paymentStatus === 'paid' ? 'success' : 'warning'}
          className="flex-shrink-0"
        >
          {paymentStatus === 'paid' ? 'Paid' : 'Partial'}
        </Badge>
      </div>

      {/* ── Payment summary (DO NOT EDIT — preserved per spec) ── */}
      {paymentStatus === 'partial' ? (
        <div className="space-y-2">
          {/* Paid / remaining amounts */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-text-primary">
              {formatAmount(paidAmount)} paid
            </span>
            <span className="text-xs text-status-warning-text font-medium">
              {formatAmount(pendingAmount)} remaining
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden">
            <div
              className="h-full rounded-full bg-status-success-solid transition-all duration-500"
              style={{ width: `${Math.min(100, (paidAmount / totalAmount) * 100)}%` }}
            />
          </div>

          {/* Total */}
          <p className="text-xs text-text-muted">
            {formatAmount(totalAmount)} total
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-subtle px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-text-muted">Paid</span>
          <span className="font-medium text-text-primary">{formatAmount(totalAmount)}</span>
        </div>
      )}

      {/* ── Action row ── */}
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <button
          type="button"
          onClick={() => navigate(`/portal/orders/${id}`)}
          className="text-xs text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          View order details
        </button>
        <button
          type="button"
          onClick={() => navigate(`/portal/access/${id}`)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Get Access
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

    </Card>
  );
};
