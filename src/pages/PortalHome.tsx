/**
 * PortalHome.tsx  —  Customer Portal: Order History
 *
 * Landing page of the self-serve portal (/portal).
 * Shows a list of all orders for the current user in an Amazon-style card list.
 *
 * Data flow:
 *   mount → getOrders() (mock) → render OrderCard list
 *
 * When you have a real backend:
 *   - Replace getOrders() with a fetch() call using the user's session token.
 *   - Add proper auth guard (redirect to login if no session).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import { OrderCard } from '../components/OrderCard';
import { LegacyNsdcCatchUpCard } from '../components/LegacyNsdcCatchUpCard';
import { getOrders, isLegacyNsdcCatchUpOrder } from '../services/portalService';
import { isIndianCountryCode } from '../data/countryCodes';
import { useStore } from '../store/useStore';
import type { Order } from '../types/order';

// ─── Loading skeleton ────────────────────────────────────────────────────────────

const OrderCardSkeleton: React.FC = () => (
  <div className="skeleton-card p-5 sm:p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 w-48 skeleton-block" />
        <div className="h-3 w-32 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-24 rounded-full skeleton-block" />
    </div>
    <div className="rounded-lg bg-surface-subtle p-4 space-y-2">
      <div className="h-3 w-full skeleton-block" />
      <div className="h-3 w-3/4 skeleton-block" />
    </div>
    <div className="rounded-lg bg-surface-subtle p-3 space-y-2">
      <div className="h-3 bg-slate-200/80 rounded w-full" />
      <div className="h-3 bg-slate-200/80 rounded w-11/12" />
    </div>
  </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-surface-subtle">
      <ShoppingBagIcon className="h-9 w-9 text-text-muted" />
    </div>
    <h3 className="mb-1 text-base font-medium text-text-primary">
      You don't have any orders yet.
    </h3>
    <p className="mb-6 text-sm text-text-muted">
      Once you enrol in a program, your order history will appear here.
    </p>
    <Link
      to="/"
      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
    >
      Browse programs →
    </Link>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────────

export const PortalHomePage: React.FC = () => {
  const { userDetails } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const legacyNsdcOrders = orders.filter(isLegacyNsdcCatchUpOrder);
  const showLegacyNsdcCard =
    isIndianCountryCode(userDetails.countryCode) && legacyNsdcOrders.length > 0;

  useEffect(() => {
    setLoading(true);
    // Real version: GET /api/portal/orders  (auth via session cookie / JWT)
    getOrders()
      .then(setOrders)
      .catch(() => setError("We couldn't load your orders. Please refresh or contact support."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-text-primary">My Orders</h1>
          <p className="mt-1 text-sm text-text-muted">
            View your enrolled programs, payment status, and access links.
          </p>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="status-banner status-banner-error mb-6 flex items-start gap-3 text-sm">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && !error && (
          <div className="space-y-4">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && orders.length === 0 && <EmptyState />}

        {/* ── Order list (+ retroactive NSDC card when applicable) ── */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {showLegacyNsdcCard && <LegacyNsdcCatchUpCard orders={legacyNsdcOrders} />}
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="mt-8 text-center text-xs text-text-muted">
          Questions?{' '}
          <a href="mailto:support@growthschool.io" className="underline">
            support@growthschool.io
          </a>
        </p>
      </div>
    </div>
  );
};
