/**
 * ProductAccessCard.tsx
 *
 * Renders one product's post-payment access state on the Success page.
 * Supports three access types:
 *   - direct_link   : "Get access here" button → opens ctaUrl
 *   - email_24h     : informational — "Access by email within 24 hours"
 *   - nsdc_onboarding: 2-step flow (WhatsApp join → NSDC registration)
 *
 * Designed to be modular so it can later be reused inside a customer portal.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AccessType = 'direct_link' | 'email_24h' | 'nsdc_onboarding' | 'custom_cta';

export interface NsdcOnboardingSteps {
  /** Full URL to the WhatsApp group. */
  whatsappUrl: string;
  /** In-app route for the NSDC enrollment form, e.g. "/portal/enroll". */
  nsdcEnrollPath: string;
}

export interface ProductAccessCardProps {
  /** Display name of the product, shown as the card title. */
  productName: string;
  /** Short label shown as a pill badge, e.g. "Main Program" or "Add-on". */
  productTag?: string;
  accessType: AccessType;
  /** Required when accessType === 'direct_link'. */
  ctaUrl?: string;
  /** Required when accessType === 'nsdc_onboarding'. */
  nsdcSteps?: NsdcOnboardingSteps;
  /** Required when accessType === 'custom_cta'. */
  customCta?: {
    label: string;
    url: string;
    description?: string;
  };
}

// ─── Sub-renderers ─────────────────────────────────────────────────────────────

/** Step marker circle — filled green when done, outlined when pending. */
const StepCircle: React.FC<{ index: number; done: boolean }> = ({ index, done }) =>
  done ? (
    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
  ) : (
    <span className="h-5 w-5 flex-shrink-0 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500">
      {index}
    </span>
  );

// ─── Main component ────────────────────────────────────────────────────────────

export const ProductAccessCard: React.FC<ProductAccessCardProps> = ({
  productName,
  productTag,
  accessType,
  ctaUrl,
  nsdcSteps,
  customCta,
}) => {
  const navigate = useNavigate();

  // Local step-completion state for the NSDC onboarding checklist.
  // This is UI-only feedback; persistence is handled by the portal layer later.
  const [whatsappJoined, setWhatsappJoined] = useState(false);

  // ── direct_link ─────────────────────────────────────────────────────────────
  const renderDirectLink = () => (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-slate-600">Your access is ready. Click below to get started.</p>
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
      >
        Get access here
        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
      </a>
    </div>
  );

  // ── email_24h ───────────────────────────────────────────────────────────────
  const renderEmail24h = () => (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <EnvelopeIcon className="h-4 w-4 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">Access coming to your inbox</p>
        <p className="text-xs text-slate-500 mt-0.5">
          You'll receive access details by email within 24 hours. Check your spam folder if you
          don't see it.
        </p>
      </div>
    </div>
  );

  // ── nsdc_onboarding ─────────────────────────────────────────────────────────
  const renderNsdcOnboarding = () => {
    if (!nsdcSteps) return null;
    const { whatsappUrl, nsdcEnrollPath } = nsdcSteps;

    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Complete both steps below to activate your program access and government-certified
          certification.
        </p>

        {/* Step 1 — WhatsApp */}
        <div
          className={`rounded-lg border p-3.5 flex items-start gap-3 transition-colors ${
            whatsappJoined
              ? 'bg-green-50 border-green-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <StepCircle index={1} done={whatsappJoined} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${whatsappJoined ? 'text-green-800 line-through decoration-green-400' : 'text-slate-800'}`}>
              Join the WhatsApp community
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Get program updates, peer support, and cohort announcements.
            </p>
            {!whatsappJoined && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappJoined(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-sm font-normal hover:bg-[#1ebe5d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-1"
              >
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                Join WhatsApp group
              </a>
            )}
          </div>
        </div>

        {/* Step 2 — NSDC registration */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
          <StepCircle index={2} done={false} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 leading-snug">
              Complete NSDC registration
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Required once to activate your government-certified LMS access. Takes under 2
              minutes.
            </p>
            <button
              type="button"
              onClick={() => navigate(nsdcEnrollPath)}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-700 text-white text-sm font-normal hover:bg-amber-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-1"
            >
              Complete registration
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── custom_cta ───────────────────────────────────────────────────────────────
  const renderCustomCta = () => {
    if (!customCta) return null;
    const { label, url, description } = customCta;

    return (
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {description && (
          <p className="text-sm text-slate-600 flex-1 min-w-0">{description}</p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
        >
          {label}
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  };

  // ── Card shell ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Header — product name + optional tag badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 leading-snug">{productName}</p>
        {productTag && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal bg-slate-100 text-slate-600 flex-shrink-0">
            {productTag}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Access content */}
      {accessType === 'direct_link' && renderDirectLink()}
      {accessType === 'email_24h' && renderEmail24h()}
      {accessType === 'nsdc_onboarding' && renderNsdcOnboarding()}
      {accessType === 'custom_cta' && renderCustomCta()}
    </div>
  );
};
