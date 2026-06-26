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
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AccessPanel } from '../../components/AccessPanel';
import { ToolAccessList } from '../../components/ToolAccessList';
import { ChangeCohortModal } from '../../components/ChangeCohortModal';
import { SuccessToast } from '../../components/SuccessToast';
import { getOrder } from '../../services/portalService';
import { getAccessStatus } from '../../utils/accessStatus';
import { formatCohortDate, getCohortRelativeDays } from '../../utils/formatters';
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
          {status.label}
        </p>
        <p className={`text-sm mt-0.5 leading-normal ${detail}`}>
          {status.detail}
        </p>
      </div>
    </div>
  );
};

// ─── Cohort Banner ────────────────────────────────────────────────────────────

interface CohortBannerProps {
  order: Order;
  onChangeBatch: () => void;
}

/**
 * Displays the learner's current batch date with an option to change it.
 * Once the change has been used (cohortChangeUsed === true), the button
 * is replaced by a read-only pill so the one-time limit is clear.
 * Hidden entirely when cohortStartDate is not set on the order.
 */
const CohortBanner: React.FC<CohortBannerProps> = ({ order, onChangeBatch }) => {
  if (!order.cohortStartDate) return null;

  const relativeHint = getCohortRelativeDays(order.cohortStartDate);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <CalendarDaysIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-0.5">
              Your Batch
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {formatCohortDate(order.cohortStartDate)}
            </p>
            {relativeHint && (
              <p className="text-xs text-text-muted mt-0.5">{relativeHint}</p>
            )}
          </div>
        </div>

        {order.cohortChangeUsed ? (
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs whitespace-nowrap self-center">
            Batch Updated
          </Badge>
        ) : (
          <Button
            variant="outline"
            onClick={onChangeBatch}
            className="text-xs px-3 py-2 whitespace-nowrap self-center"
          >
            Change Batch
          </Button>
        )}
      </div>
    </Card>
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
  const [showChangeCohort, setShowChangeCohort] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [nsdcGateError, setNsdcGateError] = useState(false);

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
            {/* 1. Program name header + Open program CTA */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-medium leading-snug text-text-primary mb-1">
                  {order.programName}
                </h1>
                {order.cohortStartDate && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-sm text-text-muted">
                      <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      Starts {formatCohortDate(order.cohortStartDate)}
                    </span>
                    {order.cohortChangeUsed ? (
                      <span className="relative group text-xs text-text-muted border border-border-subtle rounded-full px-2 py-0.5 cursor-default">
                        Batch updated
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          You've already used your one-time batch change
                        </span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowChangeCohort(true)}
                        className="text-xs font-medium text-blue-600 hover:underline underline-offset-2"
                      >
                        Change batch
                      </button>
                    )}
                  </div>
                )}
              </div>
              {order.lmsLink && (() => {
                const nsdcBlocked = order.nsdcRequired && !order.nsdcCompleted;
                const emailBlocked = !order.nsdcRequired && !order.emailConfirmed;
                const isBlocked = nsdcBlocked || emailBlocked;
                return (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {isBlocked ? (
                      <button
                        onClick={() => {
                          setNsdcGateError(true);
                          document.getElementById('get-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        Open program
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <a
                        href={order.lmsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        Open program
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 2. Cohort / batch card — only shown when the change hasn't been used yet */}
            {!order.cohortChangeUsed && (
              <CohortBanner
                order={order}
                onChangeBatch={() => setShowChangeCohort(true)}
              />
            )}

            {/* 3. Status banner — shown when NSDC is pending for an NSDC program */}
            <StatusBanner order={order} />

            {/* 4. NSDC form — only shown when registration is still pending */}
            {(order.nsdcRequired && !order.nsdcCompleted) || (!order.nsdcRequired && !order.emailConfirmed) ? (
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-medium text-text-primary">
                    {order.nsdcRequired ? 'Complete NSDC registration' : 'Confirm your email'}
                  </h2>
                  {nsdcGateError && (
                    <p className="mt-1 text-xs text-status-error-text">
                      {order.nsdcRequired
                        ? 'Complete NSDC registration to access your program.'
                        : 'Confirm your email to access your program.'}
                    </p>
                  )}
                </div>
                <Card id="get-access" className="p-5 sm:p-6 scroll-mt-6">
                  <AccessPanel
                    order={{ ...order, lmsEnrollmentStatus: deriveEffectiveAccess(order) }}
                    onOrderUpdated={(updates) => {
                      handleOrderUpdated(updates);
                      setNsdcGateError(false);
                    }}
                  />
                </Card>
              </div>
            ) : null}

            {/* Tools — shown before the completed NSDC summary */}
            {(order.toolAccesses ?? []).length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-medium text-text-primary">What's included</h2>
                <Card className="p-5 sm:p-6">
                  <ToolAccessList toolAccesses={order.toolAccesses ?? []} />
                </Card>
              </div>
            )}

            {/* NSDC profile summary — shown at the bottom only for NSDC programs once registration is done */}
            {order.nsdcRequired && order.nsdcCompleted && (
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-medium text-text-primary">Your NSDC details</h2>
                <Card id="get-access" className="p-5 sm:p-6 scroll-mt-6">
                  <AccessPanel
                    order={{ ...order, lmsEnrollmentStatus: deriveEffectiveAccess(order) }}
                    onOrderUpdated={(updates) => {
                      handleOrderUpdated(updates);
                      setNsdcGateError(false);
                    }}
                    summaryOnly
                  />
                </Card>
              </div>
            )}

            <SuccessToast
              show={showToast}
              message="Batch updated successfully"
              onDone={() => setShowToast(false)}
            />

            {/* Batch change modal — mounted here so it can access order state */}
            <ChangeCohortModal
              isOpen={showChangeCohort}
              onClose={() => setShowChangeCohort(false)}
              orderId={order.id}
              currentCohortId={order.cohortId}
              currentCohortStartDate={order.cohortStartDate}
              onSuccess={(cohortStartDate) => {
                handleOrderUpdated({ cohortStartDate, cohortChangeUsed: true });
                setShowToast(true);
              }}
            />
          </>
        )}

      </div>
    </div>
  );
};
