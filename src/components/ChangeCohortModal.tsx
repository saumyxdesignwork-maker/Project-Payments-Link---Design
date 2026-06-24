/**
 * ChangeCohortModal.tsx
 *
 * A two-step modal for the customer portal's self-serve batch change flow:
 *
 *   Step 1 — Select:  Customer picks a new cohort from the same selector used
 *                     at checkout (CohortSelector). Current cohort is shown but
 *                     the confirm button is disabled until a different one is chosen.
 *
 *   Step 2 — Confirm: Shows a clear before/after summary and a one-time-change
 *                     warning banner before the customer commits.
 *
 * Usage:
 *   <ChangeCohortModal
 *     isOpen={showModal}
 *     onClose={() => setShowModal(false)}
 *     orderId={order.id}
 *     currentCohortId={order.cohortId}
 *     currentCohortStartDate={order.cohortStartDate}
 *     onSuccess={(cohortStartDate) => handleOrderUpdated({ cohortStartDate, cohortChangeUsed: true })}
 *   />
 */

import React, { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { PROGRAM_DATA } from '../data/paymentLink';
import { changeCohort } from '../services/portalService';
import { formatCohortDate, getCohortRelativeDays } from '../utils/formatters';
import { CohortSelector } from './CohortSelector';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChangeCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  /** The cohort ID the learner is currently on, e.g. "c3" */
  currentCohortId?: string;
  /** ISO date of the current cohort, e.g. "2025-12-14" */
  currentCohortStartDate?: string;
  /** Called after a successful cohort change with the new cohortStartDate */
  onSuccess: (cohortStartDate: string) => void;
}

type Step = 'select' | 'confirm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns cohorts that haven't started yet, so customers can only pick future dates. */
function futureCohorts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return PROGRAM_DATA.cohorts.filter((c) => {
    const start = new Date(`${c.startDate}T12:00:00Z`);
    return start >= today;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChangeCohortModal: React.FC<ChangeCohortModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentCohortId,
  currentCohortStartDate,
  onSuccess,
}) => {
  const available = futureCohorts();

  const initialSelection =
    available.length > 0
      ? (available.find((c) => c.id !== currentCohortId)?.id ?? available[0].id)
      : '';

  const [step, setStep] = useState<Step>('select');
  const [selectedId, setSelectedId] = useState(initialSelection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset internal state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedId(
        available.find((c) => c.id !== currentCohortId)?.id ?? available[0]?.id ?? '',
      );
      setError('');
      setLoading(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trap scroll on body while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCohort = available.find((c) => c.id === selectedId);
  const isSameCohort = selectedId === currentCohortId;
  const hasNoCohorts = available.length === 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!selectedId || isSameCohort) return;
    setLoading(true);
    setError('');
    try {
      const { cohortStartDate } = await changeCohort(orderId, selectedId);
      onSuccess(cohortStartDate);
      onClose();
    } catch {
      setError('Something went wrong. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-cohort-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <CalendarDaysIcon className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 id="change-cohort-title" className="text-base font-medium text-text-primary">
                Change Batch
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-5">

            {/* ── No future cohorts edge-case ── */}
            {hasNoCohorts && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
                <p className="text-sm text-text-muted">
                  No upcoming batches are available right now.
                  <br />
                  Please contact support if you need help.
                </p>
              </div>
            )}

            {/* ── STEP 1: Select ── */}
            {!hasNoCohorts && step === 'select' && (
              <div className="space-y-4">
                {/* Current batch */}
                {currentCohortStartDate && (
                  <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                      Current Batch
                    </p>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-status-success-solid flex-shrink-0" />
                      <span className="text-sm text-text-primary font-medium">
                        {formatCohortDate(currentCohortStartDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* New batch selector */}
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                    New Batch
                  </p>
                  <CohortSelector
                    value={selectedId}
                    onChange={setSelectedId}
                    cohorts={available}
                  />
                  {isSameCohort && (
                    <p className="mt-2 text-xs text-amber-700 px-1">
                      Please select a different batch to continue.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Confirm summary ── */}
            {!hasNoCohorts && step === 'confirm' && selectedCohort && (
              <div className="space-y-4">

                {/* Timeline card */}
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">

                  {/* Row 1: Current batch — dot inline with label */}
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="h-2.5 w-2.5 mt-0.5 rounded-full border-2 border-slate-400 bg-white" />
                      {/* Dashed connector grows to fill space between rows */}
                      <div className="border-l-2 border-dashed border-slate-300 mt-1.5 mb-1.5" style={{ minHeight: '44px' }} />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-xs text-text-muted mb-0.5">Current batch</p>
                      <p className="text-sm text-text-secondary line-through">
                        {currentCohortStartDate
                          ? formatCohortDate(currentCohortStartDate)
                          : 'Current batch'}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: New batch — dot inline with label */}
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 flex items-start">
                      <div className="h-2.5 w-2.5 mt-0.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-text-muted mb-0.5">New batch</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCohortDate(selectedCohort.startDate)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {selectedCohort.schedule}
                        {(() => {
                          const hint = getCohortRelativeDays(selectedCohort.startDate);
                          return hint ? ` · ${hint}` : '';
                        })()}
                        {selectedCohort.seatsLeft !== undefined &&
                          selectedCohort.seatsLeft < 20 && (
                            <span className="text-amber-700 ml-1">
                              · {selectedCohort.seatsLeft} spots left
                            </span>
                          )}
                      </p>
                    </div>
                  </div>

                </div>

                {/* API error */}
                {error && (
                  <p className="text-sm text-status-error-text bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* One-time-change warning — sits just above the CTA buttons */}
          {!hasNoCohorts && (
            <div className="px-5 pb-3">
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 leading-snug">
                  This is a one-time action and cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          {!hasNoCohorts && (
            <div className="px-5 pb-5 flex gap-3">
              {step === 'select' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep('confirm')}
                    disabled={!selectedId || isSameCohort}
                    className="flex-1"
                  >
                    Review change
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { setStep('select'); setError(''); }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Go back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Confirming…
                      </span>
                    ) : (
                      'Confirm change'
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Close-only footer when no cohorts */}
          {hasNoCohorts && (
            <div className="px-5 pb-5">
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
