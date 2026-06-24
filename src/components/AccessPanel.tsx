/**
 * AccessPanel.tsx
 *
 * Encapsulates all access-related logic for the order detail page.
 *
 * Decision tree:
 *  - Indian learner (nsdcRequired = true)
 *      └─ programNsdcMandatory === false AND NOT nsdcRetroactiveCollectionRequired → skip NSDC; access links only
 *      └─ program mandates NSDC OR retroactive catch-up + !nsdcCompleted → editable NSDC form
 *      └─ NSDC collected (nsdcCompleted) → read-only NSDC profile + access links
 *  - Non-Indian learner (nsdcRequired = false)
 *      └─ emailConfirmed = false → email confirmation form
 *      └─ emailConfirmed = true  → access links
 *
 * All API calls are stubs — replace `submitNsdcForOrder` and
 * `submitEmailConfirmation` in portalService.ts with real fetch() calls.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import nsdcLogo from '../assets/nsdc-logo.svg';

import { Button } from './Button';
import { Input } from './Input';
import { submitNsdcForOrder, submitEmailConfirmation } from '../services/portalService';
import { formatDate } from '../utils/formatters';
import type { NsdcFormData } from '../types/portal';
import type { NsdcSubmittedProfile, Order } from '../types/order';

function formatDobDisplay(iso?: string): string {
  if (!iso) return '—';
  if (iso.split('-').length !== 3) return iso;
  return formatDate(iso);
}

// ─── NSDC Form sub-panel ─────────────────────────────────────────────────────────

interface NsdcFormPanelProps {
  orderId: string;
  /** Prefill from order.customerName or similar */
  prefillFullName?: string;
  onSuccess: (profile: NsdcSubmittedProfile) => void;
}

const NsdcFormPanel: React.FC<NsdcFormPanelProps> = ({
  orderId,
  prefillFullName = '',
  onSuccess,
}) => {
  const [form, setForm] = useState<NsdcFormData>({
    fullName: prefillFullName,
    fatherName: '',
    dateOfBirth: '',
  });
  const [errors, setErrors] = useState<Partial<NsdcFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field: keyof NsdcFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<NsdcFormData> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.fatherName.trim()) errs.fatherName = "Father's full name is required.";
    if (!form.dateOfBirth) errs.dateOfBirth = 'Your date of birth is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      // Real version: POST /api/portal/orders/:orderId/nsdc
      const { profile } = await submitNsdcForOrder(orderId, form);
      onSuccess(profile);
    } catch {
      setApiError('Something went wrong. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* NSDC branding + explanation */}
      <div className="flex flex-col items-start gap-2 mb-3">
        <img src={nsdcLogo} alt="NSDC" className="h-16 w-auto" />
        <div>
          <h3 className="text-base font-medium text-text-primary">NSDC Registration</h3>

        </div>
      </div>

      <p className="mb-3 rounded-lg border border-status-info-border bg-status-info-bg p-3 text-sm text-text-secondary">
        These details are used to register you with the NSDC government portal.
        You only need to fill this once — it will be saved to your profile.
      </p>

      {apiError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error-text">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name (as per government records)"
          value={form.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Exactly as on your government ID"
          error={errors.fullName}
        />

        <Input
          label="Full Father's Name"
          value={form.fatherName}
          onChange={(e) => handleChange('fatherName', e.target.value)}
          placeholder="As per government records"
          error={errors.fatherName}
        />

        <Input
          label="Your Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          error={errors.dateOfBirth}
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit NSDC Details'}
          {!submitting && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </form>
    </div>
  );
};

// ─── NSDC read-only (already submitted) ────────────────────────────────────────

interface NsdcReadOnlySummaryProps {
  order: Order;
}

/**
 * Shown after the learner completed NSDC post-payment — no edits, profile reference only.
 * DB: return `nsdcProfile` (or equivalent) from GET /api/portal/orders/:id.
 */
const NsdcReadOnlySummary: React.FC<NsdcReadOnlySummaryProps> = ({ order }) => {
  const p = order.nsdcProfile;
  const email = p?.email ?? order.customerEmail ?? '—';
  const fullName = p?.fullName ?? order.customerName ?? '—';
  const fatherName = p?.fatherName ?? '—';
  const dob = formatDobDisplay(p?.dateOfBirth);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5 border-b border-border-subtle py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="text-sm font-normal text-text-muted sm:w-40 flex-shrink-0 leading-normal">{label}</span>
      <span className="text-sm text-text-primary leading-normal">{value}</span>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col items-start sm:flex-row sm:items-center gap-3 mb-4">
        <img src={nsdcLogo} alt="NSDC" className="h-12 w-auto flex-shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-medium text-text-primary leading-normal">NSDC details on file</h3>
          <p className="text-sm text-text-muted leading-loose">
            Submitted when you confirmed email and completed enrolment. Contact support to update.
          </p>
        </div>
      </div>

      <div className="section-card-subtle px-4 py-1">
        <Row label="Email" value={email} />
        <Row label="Name" value={fullName} />
        <Row label="Father's name" value={fatherName} />
        <Row label="Your Date of Birth" value={dob} />
      </div>
    </div>
  );
};

// ─── Email Confirmation sub-panel (OTP flow) ─────────────────────────────────────

/** Masks an email for display, e.g. "saumy@example.com" → "s***y@example.com". */
function maskEmail(raw: string): string {
  const [local, domain] = raw.split('@');
  if (!domain || local.length <= 2) return raw;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

const DEMO_VALID_OTP = '123456';

interface EmailConfirmPanelProps {
  orderId: string;
  prefillEmail?: string;
  onSuccess: () => void;
}

const EmailConfirmPanel: React.FC<EmailConfirmPanelProps> = ({
  orderId,
  prefillEmail = '',
  onSuccess,
}) => {
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpResentMessage, setOtpResentMessage] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const sendOtpMock = async (isResend: boolean) => {
    setIsSendingOtp(true);
    if (!isResend) setOtp('');
    setOtpError('');
    await new Promise((r) => setTimeout(r, 800));
    setIsSendingOtp(false);
    setResendCountdown(10);
    if (isResend) {
      setOtpResentMessage(true);
      setTimeout(() => setOtpResentMessage(false), 4000);
    }
  };

  const handleSendCode = () => {
    void (async () => {
      await sendOtpMock(false);
      setCodeSent(true);
    })();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, '').trim();
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }
    if (code !== DEMO_VALID_OTP) {
      setOtpError('That code is incorrect or expired. Try again or resend a new code.');
      return;
    }
    setOtpError('');
    setApiError('');
    try {
      await submitEmailConfirmation(orderId);
      onSuccess();
    } catch {
      setApiError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-medium text-text-primary leading-snug">Verify your email</h3>
        <p className="text-sm text-text-muted leading-[150%]">
          {codeSent
            ? `We sent a 6-digit code to ${maskEmail(prefillEmail)}. Enter it below to confirm your email.`
            : "We'll send a one-time code to confirm this is you before activating your access."}
        </p>
      </div>

      {!codeSent ? (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 select-all">
            {prefillEmail}
          </div>
          {isSendingOtp ? (
            <div className="flex items-center gap-3 text-sm text-text-muted py-1">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
              Sending verification code…
            </div>
          ) : (
            <Button fullWidth className="font-medium" onClick={handleSendCode}>
              Send verification code
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-normal text-text-secondary leading-snug">
                Registered email
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 select-all">
                {prefillEmail}
              </div>
            </div>
            <Input
              label="One-time code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(v);
                if (otpError) setOtpError('');
              }}
              placeholder="000000"
              maxLength={6}
              error={otpError}
            />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">Prototype:</span> use code{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-slate-800">{DEMO_VALID_OTP}</code>
          </div>

          {otpResentMessage && (
            <p className="text-sm text-green-700">A new code was sent. Check your inbox.</p>
          )}
          {apiError && <p className="text-sm text-status-error-text">{apiError}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="font-medium"
              disabled={isSendingOtp || resendCountdown > 0}
              onClick={() => void sendOtpMock(true)}
            >
              {isSendingOtp ? 'Sending…' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
            </Button>
            <Button type="submit" fullWidth className="font-medium" disabled={isSendingOtp}>
              Verify &amp; Continue
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Access links sub-panel ──────────────────────────────────────────────────────

interface AccessLinksPanelProps {
  order: Pick<Order, 'lmsEnrollmentStatus' | 'lmsLink' | 'couponLink' | 'emilyLink' | 'extraLinks' | 'nsdcRequired'>;
  // lmsEnrollmentStatus and nsdcRequired are still passed through for future use
}

const AccessLinksPanel: React.FC<AccessLinksPanelProps> = ({ order }) => {
  const { couponLink, emilyLink, extraLinks } = order;

  const hasAnyLink = couponLink || emilyLink || (extraLinks && extraLinks.length > 0);

  return (
    <div className="space-y-4">
      {/* Links — lmsLink is surfaced as "Open program" at the top of the page */}
      {hasAnyLink ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Your access links</p>

          {couponLink && (
            <a
              href={couponLink}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-link surface-link-secondary font-medium"
            >
              <span>Coupon / Discount Access</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}

          {emilyLink && (
            <a
              href={emilyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-link surface-link-secondary font-medium"
            >
              <span>Emily Access</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}

          {extraLinks?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-link surface-link-secondary font-medium"
            >
              <span>{link.label}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ─── Main AccessPanel ────────────────────────────────────────────────────────────

interface AccessPanelProps {
  /** The full order object; panel reads nsdcRequired, nsdcCompleted, emailConfirmed, etc. */
  order: Order;
  /** Called when NSDC submission or email confirmation succeeds, so the parent can refresh. */
  onOrderUpdated: (updates: Partial<Order>) => void;
  /**
   * When true, only renders the NSDC read-only profile (no links panel, no form).
   * Used in the "Your NSDC details" bottom section where registration is already done.
   */
  summaryOnly?: boolean;
}

export const AccessPanel: React.FC<AccessPanelProps> = ({ order, onOrderUpdated, summaryOnly }) => {
  const {
    id: orderId,
    nsdcRequired,
    nsdcCompleted,
    emailConfirmed,
    customerEmail,
    customerName,
  } = order;

  const prefillFullName = (customerName ?? '').trim();

  // ── Indian learner path (billing country India / nsdcRequired) ───────────────
  if (nsdcRequired) {
    const retroactive = order.nsdcRetroactiveCollectionRequired === true;
    // Program always mandated NSDC, or an older exempt purchase now needs a catch-up profile
    const mustCollectNsdc = order.programNsdcMandatory !== false || retroactive;
    if (!mustCollectNsdc) {
      return <AccessLinksPanel order={order} />;
    }

    if (!nsdcCompleted) {
      return (
        <NsdcFormPanel
          orderId={orderId}
          prefillFullName={prefillFullName}
          onSuccess={(profile) =>
            onOrderUpdated({
              nsdcCompleted: true,
              nsdcRetroactiveCollectionRequired: false,
              nsdcProfile: profile,
            })
          }
        />
      );
    }

    if (summaryOnly) {
      return <NsdcReadOnlySummary order={order} />;
    }

    return (
      <div className="space-y-6">
        {/* NSDC complete confirmation badge */}
        <div className="status-banner status-banner-success flex items-center gap-2 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-status-success-solid flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-status-success-text leading-snug">NSDC registration complete</p>
            <p className="text-xs text-status-success-text mt-0.5 leading-normal">Your details are on file.</p>
          </div>
        </div>
        <NsdcReadOnlySummary order={order} />
        <AccessLinksPanel order={order} />
      </div>
    );
  }

  // ── Non-Indian learner path ──────────────────────────────────────────────────
  if (!emailConfirmed) {
    return (
      <EmailConfirmPanel
        orderId={orderId}
        prefillEmail={customerEmail}
        onSuccess={() => onOrderUpdated({ emailConfirmed: true })}
      />
    );
  }

  return <AccessLinksPanel order={order} />;
};
