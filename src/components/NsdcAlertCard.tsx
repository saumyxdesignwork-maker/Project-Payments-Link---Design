/**
 * NsdcAlertCard.tsx
 *
 * Standalone NSDC pending nudge card for light backgrounds (e.g. the non-partial
 * order flow where the dark hero card is not shown). Points the user to the
 * "Complete NSDC Registration" section below.
 *
 * For the partial-payment flow the inline dark-themed banner inside PartialPaymentStatus
 * is used instead — see NsdcInlineBanner in PartialPaymentStatus.tsx.
 */

import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import nsdcLogo from '../assets/nsdc-logo.svg';

interface NsdcAlertCardProps {
  /** Called when the CTA is clicked — typically scrolls to the NSDC form below. */
  onCtaClick?: () => void;
}

export const NsdcAlertCard: React.FC<NsdcAlertCardProps> = ({ onCtaClick }) => (
  <div className="overflow-hidden rounded-2xl border border-status-warning-border bg-status-warning-bg shadow-sm">
    <div className="flex items-start gap-4 p-4 sm:p-5">
      <img src={nsdcLogo} alt="NSDC" className="h-9 w-auto flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-status-warning-text leading-snug">
          Action required: Complete NSDC registration
        </p>
        <p className="mt-0.5 text-xs leading-normal text-status-warning-text">
          Required once to activate your government-certified LMS access. Takes under 2 minutes.
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-status-warning-border bg-status-warning-bg/70 px-4 py-3 sm:px-5">
      <p className="text-xs leading-normal text-status-warning-text">
        Your access is limited until this is complete.
      </p>
      <button
        type="button"
        onClick={onCtaClick}
        className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-status-warning-text transition-colors hover:opacity-80"
      >
        Complete now
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);
