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

import React, { useState } from 'react';
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
          <h3 className="text-base font-medium text-slate-900">NSDC Registration</h3>

        </div>
      </div>

      <p className="text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
        These details are used to register you with the NSDC government portal.
        You only need to fill this once — it will be saved to your profile.
      </p>

      {apiError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
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
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-sm font-normal text-slate-500 sm:w-40 flex-shrink-0 leading-normal">{label}</span>
      <span className="text-sm text-slate-900 leading-normal">{value}</span>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col items-start sm:flex-row sm:items-center gap-3 mb-4">
        <img src={nsdcLogo} alt="NSDC" className="h-12 w-auto flex-shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-medium text-slate-900 leading-normal">NSDC details on file</h3>
          <p className="text-sm text-slate-500 leading-loose">
            Submitted when you confirmed email and completed enrolment. Contact support to update.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-1">
        <Row label="Email" value={email} />
        <Row label="Name" value={fullName} />
        <Row label="Father's name" value={fatherName} />
        <Row label="Your Date of Birth" value={dob} />
      </div>
    </div>
  );
};

// ─── Email Confirmation sub-panel ────────────────────────────────────────────────

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
  const [email, setEmail] = useState(prefillEmail);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // Real version: POST /api/portal/orders/:orderId/email-confirmation
      await submitEmailConfirmation(orderId);
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-medium text-slate-900 mb-1">Confirm Your Email</h3>
      <p className="text-sm text-slate-500 mb-4">
        We need to confirm your email to activate LMS access and send you login details.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
          placeholder="you@example.com"
          error={error}
        />
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Confirming…' : 'Confirm Email'}
          {!submitting && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </form>
    </div>
  );
};

// ─── Access links sub-panel ──────────────────────────────────────────────────────

interface AccessLinksPanelProps {
  order: Pick<Order, 'lmsEnrollmentStatus' | 'lmsLink' | 'couponLink' | 'emilyLink' | 'extraLinks' | 'nsdcRequired'>;
}

const AccessLinksPanel: React.FC<AccessLinksPanelProps> = ({ order }) => {
  const { lmsEnrollmentStatus, lmsLink, couponLink, emilyLink, extraLinks, nsdcRequired } = order;

  const isFullAccess = lmsEnrollmentStatus === 'real';
  const isPreviewAccess = lmsEnrollmentStatus === 'dummy';

  const hasAnyLink = lmsLink || couponLink || emilyLink || (extraLinks && extraLinks.length > 0);

  return (
    <div className="space-y-4">
      {/* Access tier badge + status */}
      {(isFullAccess || isPreviewAccess) && (
        <div
          className={[
            'rounded-xl p-4 border space-y-1',
            isFullAccess
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                isFullAccess
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200',
              ].join(' ')}
            >
              <span
                className={[
                  'h-1.5 w-1.5 rounded-full',
                  isFullAccess ? 'bg-green-500' : 'bg-amber-500',
                ].join(' ')}
              />
              {isFullAccess ? 'Full Access' : 'Preview Access'}
            </span>
          </div>
          <p
            className={[
              'text-sm leading-normal',
              isFullAccess ? 'text-green-800' : 'text-amber-800',
            ].join(' ')}
          >
            {isFullAccess
              ? nsdcRequired
                ? 'Your NSDC registration is complete and full LMS access is active.'
                : 'Your course access is fully active.'
              : 'You have temporary cohort access. Full access activates once all payments are complete and your cohort is close to starting.'}
          </p>
        </div>
      )}

      {/* Links */}
      {hasAnyLink ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Your access links</p>

          {lmsLink && (
            <a
              href={lmsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-primary hover:bg-primary-light transition-colors"
            >
              <span>Go to Learner's Dashboard</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}

          {couponLink && (
            <a
              href={couponLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
              className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
              className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>{link.label}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Access links will appear here once your enrollment is processed. Contact support
          if you believe this is a mistake.
        </p>
      )}
    </div>
  );
};

// ─── Main AccessPanel ────────────────────────────────────────────────────────────

interface AccessPanelProps {
  /** The full order object; panel reads nsdcRequired, nsdcCompleted, emailConfirmed, etc. */
  order: Order;
  /** Called when NSDC submission or email confirmation succeeds, so the parent can refresh. */
  onOrderUpdated: (updates: Partial<Order>) => void;
}

export const AccessPanel: React.FC<AccessPanelProps> = ({ order, onOrderUpdated }) => {
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

    return (
      <div className="space-y-6">
        {/* NSDC complete confirmation badge — visible at a glance when returning to the page */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-800 leading-snug">NSDC registration complete</p>
            <p className="text-xs text-emerald-700 mt-0.5 leading-normal">Your details are on file. Access links are active below.</p>
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
