/**
 * GetAccessPage.tsx  —  Customer Portal: Get Access
 *
 * Route: /portal/access
 *
 * Landing page of the "Get Access" section. Lists all orders as individual
 * product access cards so the learner can instantly see their access state
 * and take action without navigating through payment or admin information.
 *
 * This section is intentionally separate from My Orders so:
 *   - Learners who only want to access their program don't need to navigate
 *     through payment / admin information.
 *   - Both sections can evolve independently.
 *
 * Data flow:
 *   mount → getOrders() → render access cards
 *
 * When you have a real backend:
 *   - Replace getOrders() with a fetch() using the user's session token.
 *   - Add an auth guard (redirect to login if no session).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

import { getOrders } from '../../services/portalService';
import { Card } from '../../components/Card';
import { ProductAccessCard } from '../../components/ProductAccessCard';
import type { Order } from '../../types/order';

// ─── Access status derivation ─────────────────────────────────────────────────

/**
 * Derives a human-readable access status and visual type for an order.
 * Mirrors the logic in OrderCard so both sections show consistent statuses.
 */
export function getAccessStatus(order: Order): {
  label: string;
  detail: string;
  type: 'action' | 'info' | 'success';
  actionKind?: 'nsdc' | 'email';
} {
  const { nsdcRequired, nsdcCompleted, lmsEnrollmentStatus, emailConfirmed } = order;

  if (nsdcRequired) {
    if (!nsdcCompleted && order.nsdcRetroactiveCollectionRequired) {
      return {
        label: 'NSDC required',
        detail: 'Complete NSDC registration to stay aligned with certification rules.',
        type: 'action',
        actionKind: 'nsdc',
      };
    }
    if (!nsdcCompleted) {
      return {
        label: 'Action needed',
        detail: 'Complete NSDC form to unlock full LMS access.',
        type: 'action',
        actionKind: 'nsdc',
      };
    }
    if (lmsEnrollmentStatus === 'real') {
      return {
        label: 'Access active',
        detail: 'Full LMS access is live. Open your program below.',
        type: 'success',
      };
    }
    return {
      label: 'Preview access',
      detail: 'Temporary cohort access is active. Full access after NSDC + full payment.',
      type: 'info',
    };
  }

  if (!emailConfirmed) {
    return {
      label: 'Email required',
      detail: 'Confirm your email address to activate access.',
      type: 'action',
      actionKind: 'email',
    };
  }
  return {
    label: 'Access active',
    detail: 'Your access is ready. Open your program below.',
    type: 'success',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCohortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Access status badge ──────────────────────────────────────────────────────

interface AccessStatusBadgeProps {
  type: 'action' | 'info' | 'success';
  label: string;
}

const AccessStatusBadge: React.FC<AccessStatusBadgeProps> = ({ type, label }) => {
  const styles = {
    action: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${styles[type]}`}>
      {label}
    </span>
  );
};

// ─── Product access card ──────────────────────────────────────────────────────

interface AccessCardProps {
  order: Order;
}

const AccessCard: React.FC<AccessCardProps> = ({ order }) => {
  const status = getAccessStatus(order);

  const StatusIcon =
    status.type === 'action'
      ? ExclamationTriangleIcon
      : status.type === 'success'
      ? CheckCircleIcon
      : InformationCircleIcon;

  const iconClass = {
    action: 'text-amber-500',
    info: 'text-blue-500',
    success: 'text-green-500',
  }[status.type];

  const isDirectLms = status.type === 'success' && !!order.lmsLink;
  const toolCount = (order.toolAccesses ?? []).length;
  const products = order.purchasedProducts ?? [];

  // ── Order-level summary header (always shown, optionally clickable) ──────────
  const orderHeader = (
    <div className="p-5 sm:p-6">

      {/* Program name + meta row */}
      <div className="flex items-start gap-2.5 mb-3">
        <StatusIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconClass}`} />
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          {/* Title + badge on same row, space-between */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-medium text-slate-900 leading-none">
              {order.programName}
            </p>
            <AccessStatusBadge type={status.type} label={status.label} />
          </div>

          {/* Cohort date below */}
          {order.cohortStartDate && (
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
              Cohort: {formatCohortDate(order.cohortStartDate)}
            </span>
          )}
        </div>
      </div>

      {/* Status description */}
      <p className="text-sm text-slate-500 leading-relaxed pl-7">
        {status.detail}
      </p>

      {/* Tool count chip — only shown when no per-product cards are present */}
      {toolCount > 0 && products.length === 0 && (
        <div className="pl-7 mt-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
            <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
            +{toolCount} tool{toolCount > 1 ? 's' : ''} included
          </span>
        </div>
      )}
    </div>
  );

  // ── Per-product access cards ──────────────────────────────────────────────────
  // When an order has purchasedProducts, render each as its own ProductAccessCard
  // so the learner sees a product-specific next step instead of a generic CTA.
  const productSection = products.length > 0 ? (
    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Your products
        </p>
        <div className="space-y-3">
          {products.map((product) => (
            <ProductAccessCard
              key={product.id}
              productName={product.name}
              productTag={product.productTag}
              accessType={product.accessType}
              ctaUrl={product.accessUrl}
              nsdcSteps={product.nsdcSteps}
              customCta={
                product.accessType === 'custom_cta' && product.ctaLabel && product.ctaUrl
                  ? { label: product.ctaLabel, url: product.ctaUrl, description: product.ctaDescription }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  ) : null;

  // When no per-product cards are present and the order has a direct LMS link,
  // make the whole card clickable (original behaviour).
  if (products.length === 0) {
    if (isDirectLms) {
      return (
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <a
            href={order.lmsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            aria-label={`Open ${order.programName} in learner dashboard`}
          >
            {orderHeader}
          </a>
        </Card>
      );
    }

    return (
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <Link
          to={`/portal/access/${order.id}`}
          className="block"
          aria-label={`Go to access details for ${order.programName}`}
        >
          {orderHeader}
        </Link>
      </Card>
    );
  }

  // When per-product cards are present, the header links to the detail page
  // but is not the sole click target — the product cards have their own CTAs.
  return (
    <Card className="transition-shadow hover:shadow-md">
      <Link
        to={`/portal/access/${order.id}`}
        className="block"
        aria-label={`Go to access details for ${order.programName}`}
      >
        {orderHeader}
      </Link>
      {productSection}
    </Card>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const AccessCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-2.5">
        <div className="h-5 w-5 bg-slate-200 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/5" />
          <div className="flex gap-2">
            <div className="h-3 bg-slate-100 rounded w-24" />
            <div className="h-3 bg-slate-100 rounded-full w-20" />
          </div>
        </div>
      </div>
      <div className="pl-7 mt-3 space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
      </div>
    </div>
    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
      <div className="border-t border-slate-100 pt-4">
        <div className="h-10 bg-slate-100 rounded-lg w-full" />
      </div>
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <KeyIcon className="h-9 w-9 text-slate-400" />
    </div>
    <h3 className="text-base font-medium text-slate-900 mb-1">
      No programs to access yet.
    </h3>
    <p className="text-sm text-slate-500 mb-6">
      Once you purchase a program, your access links will appear here.
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

export const GetAccessPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    // Real version: GET /api/portal/orders  (auth via session cookie / JWT)
    getOrders()
      .then(setOrders)
      .catch(() => setError("We couldn't load your programs. Please refresh or contact support."))
      .finally(() => setLoading(false));
  }, []);

  /*
   * Sort orders so "action needed" items appear first — learners are more
   * likely to visit this tab when they need to do something (e.g. NSDC form).
   */
  const sortedOrders = [...orders].sort((a, b) => {
    const priority = { action: 0, info: 1, success: 2 };
    return priority[getAccessStatus(a).type] - priority[getAccessStatus(b).type];
  });

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-slate-900">Get Access</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete registration and access your enrolled programs.
          </p>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && !error && (
          <div className="space-y-4">
            <AccessCardSkeleton />
            <AccessCardSkeleton />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && orders.length === 0 && <EmptyState />}

        {/* ── Access card list ── */}
        {!loading && !error && sortedOrders.length > 0 && (
          <div className="space-y-4">
            {sortedOrders.map((order) => (
              <AccessCard key={order.id} order={order} />
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
