/**
 * MyOrdersPage.tsx  —  Customer Portal: My Orders
 *
 * Route: /portal/orders
 *
 * Landing page of the "My Orders" section. Shows a list of all orders for
 * the current user — payments, enrolment dates, and access status at a glance.
 * Clicking a card navigates to the full order detail (/portal/orders/:id).
 *
 * Data flow:
 *   mount → getOrders() (mock) → render OrderCard list
 *
 * When you have a real backend:
 *   - Replace getOrders() with a fetch() call using the user's session token.
 *   - Add a proper auth guard (redirect to login if no session).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

import { OrderCard } from '../../components/OrderCard';
import { LegacyNsdcCatchUpCard } from '../../components/LegacyNsdcCatchUpCard';
import { getOrders, isLegacyNsdcCatchUpOrder } from '../../services/portalService';
import { isIndianCountryCode } from '../../data/countryCodes';
import { useStore } from '../../store/useStore';
import type { Order } from '../../types/order';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const OrderCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-3 bg-slate-100 rounded w-32" />
      </div>
      <div className="h-5 bg-slate-200 rounded-full w-24" />
    </div>
    <div className="bg-slate-100 rounded-lg p-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
    <div className="rounded-lg bg-slate-100 p-3 space-y-2">
      <div className="h-3 bg-slate-200/80 rounded w-full" />
      <div className="h-3 bg-slate-200/80 rounded w-11/12" />
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <ShoppingBagIcon className="h-9 w-9 text-slate-400" />
    </div>
    <h3 className="text-base font-medium text-slate-900 mb-1">
      You don't have any orders yet.
    </h3>
    <p className="text-sm text-slate-500 mb-6">
      Once you enroll in a program, your order history will appear here.
    </p>
    <Link
      to="/"
      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
    >
      Browse programs →
    </Link>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const MyOrdersPage: React.FC = () => {
  const { userDetails, setUserDetails } = useStore();
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
      .then((fetched) => {
        setOrders(fetched);
        // Seed the header email from the order data when the store has no email
        // (e.g. user landed directly on /portal without going through checkout).
        const portalEmail = fetched[0]?.customerEmail;
        if (!userDetails.email && portalEmail) {
          setUserDetails({ email: portalEmail });
        }
      })
      .catch(() => setError("We couldn't load your orders. Please refresh or contact support."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-text-primary">My Orders</h1>

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
        <p className="text-center text-xs text-slate-400 mt-8">
          Need help?{' '}
          <a href="mailto:support@growthschool.io" className="underline">
            support@growthschool.io
          </a>
        </p>
      </div>
    </div>
  );
};
