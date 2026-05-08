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
import whatsappIcon from '../assets/whatsapp.svg';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

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
  /** Layout for NSDC step rows. Use stacked in narrow card contexts such as the success page. */
  stepLayout?: 'inline' | 'stacked';
}

// ─── Sub-renderers ─────────────────────────────────────────────────────────────

/** Step marker circle — filled green when done, outlined when pending. */
const StepCircle: React.FC<{ index: number; done: boolean }> = ({ index, done }) =>
  done ? (
    <CheckCircleIcon className="h-5 w-5 text-status-success-solid flex-shrink-0" />
  ) : (
    <span className="h-5 w-5 flex-shrink-0 rounded-full border border-border flex items-center justify-center text-xs font-medium text-text-muted">
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
  stepLayout = 'inline',
}) => {
  const navigate = useNavigate();
  const isStackedLayout = stepLayout === 'stacked';

  // Local step-completion state for the NSDC onboarding checklist.
  // This is UI-only feedback; persistence is handled by the portal layer later.
  const [whatsappJoined, setWhatsappJoined] = useState(false);

  // ── direct_link ─────────────────────────────────────────────────────────────
  const renderDirectLink = () => (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-text-secondary">Your access is ready. Click below to get started.</p>
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
      >
        Get access here
        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
      </a>
    </div>
  );

  // ── email_24h ───────────────────────────────────────────────────────────────
  const renderEmail24h = () => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-status-info-border bg-status-info-bg">
        <EnvelopeIcon className="h-4 w-4 text-status-info-solid" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">Access coming to your inbox</p>
        <p className="mt-0.5 text-sm text-text-muted">
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
        <p className="text-sm leading-[145%] text-text-muted">
          Complete both steps below to activate your program access and government-certified
          certification.
        </p>

        {/* Steps auto-layout — 16px gap */}
        <div className="flex flex-col gap-4">
          {/* Step 1 — WhatsApp */}
          <div className={`flex gap-3 ${isStackedLayout ? 'items-start' : 'items-center'}`}>
            <StepCircle index={1} done={whatsappJoined} />
            <div className={`flex-1 min-w-0 flex gap-2 ${isStackedLayout ? 'flex-col items-start' : 'items-center justify-between'}`}>
              <p className={`text-sm font-medium leading-snug ${whatsappJoined ? 'text-status-success-text line-through decoration-status-success-solid' : 'text-text-primary'}`}>
                Join the WhatsApp community
              </p>
              {!whatsappJoined && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsappJoined(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-whatsapp px-3 py-1.5 text-sm font-normal text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover focus:outline-none focus:ring-2 focus:ring-whatsapp focus:ring-offset-1"
                >
                  <img src={whatsappIcon} alt="" className="h-4 w-4" aria-hidden="true" />
                  Join WhatsApp group
                </a>
              )}
            </div>
          </div>

          {/* Step 2 — NSDC registration */}
          <div className={`flex gap-3 ${isStackedLayout ? 'items-start' : 'items-center'}`}>
            <StepCircle index={2} done={false} />
            <div className={`flex-1 min-w-0 flex gap-2 ${isStackedLayout ? 'flex-col items-start' : 'items-center justify-between'}`}>
              <p className="text-sm font-medium text-text-secondary leading-snug">
                Complete NSDC registration
              </p>
              <Button
                type="button"
                onClick={() => navigate(nsdcEnrollPath)}
                className="px-3 py-1.5 text-sm font-normal gap-1.5"
              >
                Complete registration
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </Button>
            </div>
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
          <p className="text-sm text-text-secondary flex-1 min-w-0">{description}</p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
        >
          {label}
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  };

  // ── Card shell ──────────────────────────────────────────────────────────────
  return (
    <Card className="p-4 space-y-3">
      {/* Header — product name + optional tag badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary leading-snug">{productName}</p>
        {productTag && (
          <Badge className="flex-shrink-0">{productTag}</Badge>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border-subtle" />

      {/* Access content */}
      {accessType === 'direct_link' && renderDirectLink()}
      {accessType === 'email_24h' && renderEmail24h()}
      {accessType === 'nsdc_onboarding' && renderNsdcOnboarding()}
      {accessType === 'custom_cta' && renderCustomCta()}
    </Card>
  );
};
