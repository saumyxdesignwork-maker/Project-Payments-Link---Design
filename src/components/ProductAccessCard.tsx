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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AccessType = 'direct_link' | 'email_24h' | 'nsdc_onboarding' | 'custom_cta' | 'non_nsdc_completion';

export interface NsdcOnboardingSteps {
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
  /** Required when accessType === 'non_nsdc_completion'. */
  nonNsdcCtaUrls?: {
    dashboardUrl: string;
    ordersPath: string;
  };
  /** Layout for NSDC step rows. Use stacked in narrow card contexts such as the success page. */
  stepLayout?: 'inline' | 'stacked';
}

// ─── Sub-renderers ─────────────────────────────────────────────────────────────

// ─── Main component ────────────────────────────────────────────────────────────

export const ProductAccessCard: React.FC<ProductAccessCardProps> = ({
  productName,
  productTag,
  accessType,
  ctaUrl,
  nsdcSteps,
  customCta,
  nonNsdcCtaUrls,
  stepLayout = 'inline',
}) => {
  const navigate = useNavigate();
  const isStackedLayout = stepLayout === 'stacked';

  // Local step-completion state for the NSDC onboarding checklist.
  // This is UI-only feedback; persistence is handled by the portal layer later.

  // ── direct_link ─────────────────────────────────────────────────────────────
  const renderDirectLink = () => (
    <a
      href={ctaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
    >
      Open program
      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
    </a>
  );

  // ── email_24h ───────────────────────────────────────────────────────────────
  const renderEmail24h = () => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-status-info-border bg-status-info-bg">
        <EnvelopeIcon className="h-4 w-4 text-status-info-solid" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">Check your inbox</p>
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
    const { nsdcEnrollPath } = nsdcSteps;

    return (
      <div className="space-y-4">
        <p className="text-sm leading-[145%] text-text-muted">
          Complete the step below to activate your program access and government-certified
          certification.
        </p>

        {/* NSDC registration */}
        <div className={`flex-1 min-w-0 flex gap-2 ${isStackedLayout ? 'flex-col items-start' : 'items-center justify-between'}`}>
          <p className="text-sm font-medium text-text-secondary leading-snug">
            NSDC registration required
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
        >
          {label}
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  };

  // ── non_nsdc_completion ──────────────────────────────────────────────────────
  const renderNonNsdcCompletion = () => {
    if (!nonNsdcCtaUrls) return null;
    const { ordersPath } = nonNsdcCtaUrls;
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-muted">You're all set. Here's what to do next.</p>
        <div className="flex flex-col gap-2">
          {/* View My Orders */}
          <button
            type="button"
            onClick={() => navigate(ordersPath)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-fit"
          >
            View my orders
          </button>
        </div>
      </div>
    );
  };

  // ── Card shell ──────────────────────────────────────────────────────────────

  // For direct_link: collapse name + CTA into one row, no divider needed.
  if (accessType === 'direct_link') {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary leading-snug truncate">{productName}</p>
            {productTag && <Badge className="flex-shrink-0">{productTag}</Badge>}
          </div>
          {renderDirectLink()}
        </div>
      </Card>
    );
  }

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
      {accessType === 'email_24h' && renderEmail24h()}
      {accessType === 'nsdc_onboarding' && renderNsdcOnboarding()}
      {accessType === 'custom_cta' && renderCustomCta()}
      {accessType === 'non_nsdc_completion' && renderNonNsdcCompletion()}
    </Card>
  );
};
