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
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

import { getOrders } from '../../services/portalService';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/Card';
import { ProductAccessCard } from '../../components/ProductAccessCard';
import { ChangeCohortModal } from '../../components/ChangeCohortModal';
import { SuccessToast } from '../../components/SuccessToast';
import { formatDate } from '../../utils/formatters';
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

// ─── Access status badge ──────────────────────────────────────────────────────

interface AccessStatusBadgeProps {
  type: 'action' | 'info' | 'success';
  label: string;
}

const AccessStatusBadge: React.FC<AccessStatusBadgeProps> = ({ type, label }) => {
  const styles = {
    action: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
    info: 'bg-status-info-bg text-status-info-text border-status-info-border',
    success: 'bg-status-success-bg text-status-success-text border-status-success-border',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-normal ${styles[type]}`}>
      {label}
    </span>
  );
};

// ─── Product access card ──────────────────────────────────────────────────────

interface AccessCardProps {
  order: Order;
  onChangeBatch: (order: Order) => void;
}

const AccessCard: React.FC<AccessCardProps> = ({ order, onChangeBatch }) => {
  const status = getAccessStatus(order);

  const isDirectLms = status.type === 'success' && !!order.lmsLink;
  const toolCount = (order.toolAccesses ?? []).length;
  const products = order.purchasedProducts ?? [];

  // ── Order-level summary header (always shown, optionally clickable) ──────────
  const orderHeader = (
    <div className="p-5 sm:p-6">

      {/* Program name + meta row */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          {/* Title + badge on same row, space-between */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-medium leading-none text-text-primary">
              {order.programName}
            </p>
            <AccessStatusBadge type={status.type} label={status.label} />
          </div>

          {/* Cohort date + Change Batch button */}
          {order.cohortStartDate && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-sm text-text-muted">
                <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
                Batch: {formatDate(order.cohortStartDate)}
              </span>
              {order.cohortChangeUsed ? (
                <span className="text-xs text-text-muted border border-border-subtle rounded-full px-2 py-0.5">
                  Batch Updated
                </span>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChangeBatch(order); }}
                  className="text-xs font-medium text-blue-600 hover:underline underline-offset-2"
                >
                  Change Batch
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status description */}
      <p className="text-sm leading-relaxed text-text-muted">
        {status.detail}
      </p>

      {/* Tool count chip — only shown when no per-product cards are present */}
      {toolCount > 0 && products.length === 0 && (
        <div className="pl-7 mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
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
      <div className="border-t border-border-subtle pt-4">
        <p className="eyebrow-label mb-3">
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
        <Card>
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
      <Card>
        {orderHeader}
      </Card>
    );
  }

  return (
    <Card>
      {orderHeader}
      {productSection}
    </Card>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const AccessCardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full skeleton-block" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/5 skeleton-block" />
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
      <div className="border-t border-border-subtle pt-4">
        <div className="h-10 bg-slate-100 rounded-lg w-full" />
      </div>
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-surface-subtle">
      <KeyIcon className="h-9 w-9 text-text-muted" />
    </div>
    <h3 className="mb-1 text-base font-medium text-text-primary">
      No programs to access yet.
    </h3>
    <p className="mb-6 text-sm text-text-muted">
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
  const { userDetails, setUserDetails } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changingOrder, setChangingOrder] = useState<Order | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Real version: GET /api/portal/orders  (auth via session cookie / JWT)
    getOrders()
      .then((fetched) => {
        setOrders(fetched);
        // Seed the header email from the order data when the store has no email.
        const portalEmail = fetched[0]?.customerEmail;
        if (!userDetails.email && portalEmail) {
          setUserDetails({ email: portalEmail });
        }
      })
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
    <div className="page-shell py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-text-primary">Get Access</h1>

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
              <AccessCard
                key={order.id}
                order={order}
                onChangeBatch={(o) => setChangingOrder(o)}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="mt-8 text-center text-xs text-text-muted">
          Need help?{' '}
          <a href="mailto:support@growthschool.io" className="underline">
            support@growthschool.io
          </a>
        </p>

      </div>

      {/* Batch change modal — mounted at page level so it sits above all cards */}
      <SuccessToast
        show={showToast}
        message="Batch updated successfully"
        onDone={() => setShowToast(false)}
      />

      {changingOrder && (
        <ChangeCohortModal
          isOpen={!!changingOrder}
          onClose={() => setChangingOrder(null)}
          orderId={changingOrder.id}
          currentCohortId={changingOrder.cohortId}
          currentCohortStartDate={changingOrder.cohortStartDate}
          onSuccess={(cohortStartDate) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === changingOrder.id
                  ? { ...o, cohortStartDate, cohortChangeUsed: true }
                  : o,
              ),
            );
            setChangingOrder(null);
            setShowToast(true);
          }}
        />
      )}
    </div>
  );
};
