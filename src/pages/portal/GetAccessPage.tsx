/**
 * GetAccessPage.tsx  —  Customer Portal: Get Access
 *
 * Route: /portal/access
 *
 * Fulfillment-first access dashboard. One card = one program the learner can
 * act on. Financial and transaction details live in the My Orders section;
 * this page is intentionally focused on access only.
 *
 * Data flow:
 *   mount → getOrders() → render fulfillment cards
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
  CalendarDaysIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

import { getOrders } from '../../services/portalService';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/Card';
import { ChangeCohortModal } from '../../components/ChangeCohortModal';
import { SuccessToast } from '../../components/SuccessToast';
import { formatDate } from '../../utils/formatters';
import { getAccessStatus } from '../../utils/accessStatus';
import type { Order } from '../../types/order';

// ─── Access status badge ──────────────────────────────────────────────────────

interface AccessStatusBadgeProps {
  type: 'action' | 'info' | 'success';
  label: string;
}

const AccessStatusBadge: React.FC<AccessStatusBadgeProps> = ({ type, label }) => {
  const styles = {
    action: 'bg-status-warning-bg/40 text-status-warning-text border-status-warning-border/60',
    info: 'bg-status-info-bg text-status-info-text border-status-info-border',
    success: 'bg-status-success-bg text-status-success-text border-status-success-border',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-normal ${styles[type]}`}>
      {label}
    </span>
  );
};

// ─── Fulfillment card ─────────────────────────────────────────────────────────

interface AccessCardProps {
  order: Order;
  onChangeBatch: (order: Order) => void;
}

const AccessCard: React.FC<AccessCardProps> = ({ order, onChangeBatch }) => {
  const status = getAccessStatus(order);

  return (
    <Card>
      <div className="p-5 sm:p-6">

        {/* Badge */}
        <div className="mb-2">
          <AccessStatusBadge type={status.type} label={status.label} />
        </div>

        {/* Left column (name + batch) center-aligned with Get Access button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-base font-medium leading-snug text-text-primary">
              {order.programName}
            </p>
            {order.cohortStartDate && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-sm text-text-muted">
                  <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  Starts {formatDate(order.cohortStartDate)}
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
                    onClick={() => onChangeBatch(order)}
                    className="text-xs font-medium text-blue-600 hover:underline underline-offset-2"
                  >
                    Change batch
                  </button>
                )}
              </div>
            )}
          </div>

          <Link
            to={`/portal/access/${order.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
          >
            Get Access
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </Card>
  );
};

// ─── Completed program card ───────────────────────────────────────────────────

interface CompletedProgramCardProps {
  order: Order;
}

const CompletedProgramCard: React.FC<CompletedProgramCardProps> = ({ order }) => {
  const isNearCompletion = order.completionStatus === 'near_completion';

  return (
    <Card>
      <div className="p-5 sm:p-6">
        {/* Badge */}
        <div className="mb-1">
          {isNearCompletion ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-status-info-border bg-status-info-bg px-2.5 py-0.5 text-xs font-normal text-status-info-text">
              Almost done
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-normal text-status-success-text">
              <CheckBadgeIcon className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
        </div>

        {/* Program name + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-base font-medium leading-snug text-text-primary">
              {order.programName}
            </p>
            {order.completedAt && !isNearCompletion && (
              <p className="text-sm text-text-muted">
                Completed {formatDate(order.completedAt)}
              </p>
            )}
            {isNearCompletion && (
              <p className="text-sm text-text-muted">
                Your certificate will be issued once you complete the program.
              </p>
            )}
          </div>

          {!isNearCompletion && order.certificateUrl && (
            <a
              href={order.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-2 flex-shrink-0"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              Download Certificate
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const AccessCardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div className="p-5 sm:p-6">
      {/* Name + badge row */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="h-4 w-2/5 skeleton-block" />
        <div className="h-5 w-20 rounded-full skeleton-block" />
      </div>
      {/* Batch + CTA row */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-3 w-36 bg-slate-100 rounded" />
        <div className="h-9 w-28 bg-slate-100 rounded-lg" />
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

  const activeOrders = orders.filter((o) => !o.completionStatus);
  const completedOrders = orders.filter((o) => !!o.completionStatus);

  // Sort active orders so action-required items appear first.
  const sortedOrders = [...activeOrders].sort((a, b) => {
    const priority = { action: 0, info: 1, success: 2 };
    return priority[getAccessStatus(a).type] - priority[getAccessStatus(b).type];
  });


  return (
    <div className="page-shell py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <h1 className="text-2xl font-medium text-text-primary mb-6">Get Access</h1>

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

        {/* ── Active fulfillment cards ── */}
        {!loading && !error && sortedOrders.length > 0 && (
          <div className="space-y-[18px]">
            {sortedOrders.map((order) => (
              <AccessCard
                key={order.id}
                order={order}
                onChangeBatch={(o) => setChangingOrder(o)}
              />
            ))}
          </div>
        )}

        {/* ── Completed / near-completion programs ── */}
        {!loading && !error && completedOrders.length > 0 && (
          <div className="space-y-2 mt-5">
            {sortedOrders.length > 0 && (
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Past programs
              </p>
            )}
            {completedOrders.map((order) => (
              <CompletedProgramCard key={order.id} order={order} />
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

      {/* Modals and toasts — mounted at page level so they sit above all cards */}
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
