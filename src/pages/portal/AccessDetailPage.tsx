/**
 * AccessDetailPage.tsx  —  Customer Portal: Get Access › Access Detail
 *
 * Route: /portal/access/:orderId
 *
 * This page belongs to the "Get Access" section and covers post-purchase
 * onboarding and access actions for a single program:
 *
 *   A. Access panel  — NSDC registration form / email confirmation / access links
 *   B. Tool access   — partner tools bundled with this order
 *
 * Financial / transaction details (order summary, payment history) live in the
 * "My Orders" section at /portal/orders/:orderId.
 *
 * When you have a real backend:
 *   - Replace getOrder() with a fetch() call using the user's session token.
 *   - Add auth guard / redirect to login if no session.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../../components/Card';
import { AccessPanel } from '../../components/AccessPanel';
import { ToolAccessList } from '../../components/ToolAccessList';
import { ProductAccessCard } from '../../components/ProductAccessCard';
import { getOrder } from '../../services/portalService';
import { getAccessStatus } from './GetAccessPage';
import type { Order, LmsEnrollmentStatus } from '../../types/order';

// ─── Access upgrade logic (mirrors OrderDetailPage) ───────────────────────────

const FULL_ACCESS_PAYMENT_THRESHOLD = 0.65;
const COHORT_PROXIMITY_DAYS = 14;

function isCohortClose(cohortStartDate?: string): boolean {
  if (!cohortStartDate) return false;
  const start = new Date(cohortStartDate).getTime();
  const now = Date.now();
  const diffDays = (start - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= COHORT_PROXIMITY_DAYS;
}

/**
 * Derives the effective LMS access level for the AccessPanel.
 * The frontend shows an optimistic 'real' state when the learner is close
 * to cohort start and has crossed the payment threshold — the backend will
 * confirm this on the next sync.
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

// ─── Status summary banner ────────────────────────────────────────────────────

interface StatusBannerProps {
  order: Order;
}

/**
 * A read-only orientation strip shown at the top of the detail page.
 * Colours mirror the left-border accent on the list page cards.
 */
const StatusBanner: React.FC<StatusBannerProps> = ({ order }) => {
  const status = getAccessStatus(order);

  const config = {
    action: {
      Icon: ExclamationTriangleIcon,
      wrapper: 'status-banner-warning',
      icon: 'text-status-warning-solid',
      title: 'text-status-warning-text',
      detail: 'text-status-warning-text',
    },
    info: {
      Icon: InformationCircleIcon,
      wrapper: 'status-banner-info',
      icon: 'text-status-info-solid',
      title: 'text-status-info-text',
      detail: 'text-status-info-text',
    },
    success: {
      Icon: CheckCircleIcon,
      wrapper: 'status-banner-success',
      icon: 'text-status-success-solid',
      title: 'text-status-success-text',
      detail: 'text-status-success-text',
    },
  }[status.type];

  const { Icon, wrapper, icon, title, detail } = config;

  return (
    <div className={`status-banner flex items-start gap-3 ${wrapper}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${icon}`} />
      <div className="min-w-0">
        <p className={`text-sm font-medium leading-snug ${title}`}>
          Current status: {status.label}
        </p>
        <p className={`text-sm mt-0.5 leading-normal ${detail}`}>
          {status.detail}
        </p>
      </div>
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="skeleton-card p-6 space-y-4">
      <div className="h-4 w-40 skeleton-block" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
      <div className="h-10 bg-slate-100 rounded-lg w-1/3" />
    </div>
    <div className="skeleton-card p-6 space-y-3">
      <div className="h-4 w-32 skeleton-block" />
      <div className="h-16 bg-slate-100 rounded" />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AccessDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    // Real version: GET /api/portal/orders/:orderId  (auth via session)
    getOrder(orderId)
      .then(({ order: fetchedOrder }) => setOrder(fetchedOrder))
      .catch(() => setError("We couldn't load access details. Please go back and try again."))
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

  return (
    <div className="page-shell py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Back link ── */}
        <Link
          to="/portal/access"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Get Access
        </Link>

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
            {/* Program name header */}
            <div>
              <h1 className="text-xl font-medium leading-snug text-text-primary">
                {order.programName}
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Complete any required steps below to activate your access.
              </p>
            </div>

            {/* Status summary banner — orients the learner at a glance */}
            <StatusBanner order={order} />

            {/* A. Per-product access cards — shown when products are attached to the order */}
            {(order.purchasedProducts ?? []).length > 0 && (
              <Card className="p-5 sm:p-6">
                <h2 className="mb-4 text-base font-medium text-text-primary">Your Products</h2>
                <div className="space-y-3">
                  {(order.purchasedProducts ?? []).map((product) => (
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
              </Card>
            )}

            {/* B. Access panel — NSDC form / email confirm / access links */}
            <Card id="get-access" className="p-5 sm:p-6 scroll-mt-6">
              <h2 className="mb-4 text-base font-medium text-text-primary">
                {order.nsdcRequired && !order.nsdcCompleted
                  ? 'Complete NSDC Registration'
                  : 'Access Details'}
              </h2>
              {/*
               * AccessPanel handles the full decision tree:
               *   Indian + NSDC pending    → NSDC form
               *   Indian + NSDC complete   → read-only profile + access links
               *   Non-Indian + no email    → email confirmation form
               *   Non-Indian + email done  → access links
               */}
              <AccessPanel
                order={{ ...order, lmsEnrollmentStatus: deriveEffectiveAccess(order) }}
                onOrderUpdated={handleOrderUpdated}
              />
            </Card>

            {/* C. Partner tools bundled with this order */}
            {(order.toolAccesses ?? []).length > 0 && (
              <Card className="p-5 sm:p-6">
                <ToolAccessList toolAccesses={order.toolAccesses ?? []} />
              </Card>
            )}
          </>
        )}

      </div>
    </div>
  );
};
