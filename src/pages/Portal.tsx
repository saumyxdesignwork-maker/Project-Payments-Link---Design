/**
 * Portal.tsx  —  Post-Payment Customer Portal
 *
 * This page is the entry point after every payment (full or partial).
 * It walks the user through four steps:
 *
 *   Step 1 — Order Summary + Email Confirmation
 *   Step 2 — NSDC Data Collection  (Indian customers only, skipped if already on file)
 *   Step 3 — Course Enrollment     (auto-triggered, shows a spinner)
 *   Step 4 — Final Success View
 *
 * All API calls go through src/services/portalService.ts so they are easy
 * to replace with real fetch() calls later.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/solid';
import { ExclamationCircleIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';

import nsdcLogo from '../assets/nsdc-logo.svg';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { useStore } from '../store/useStore';
import {
  applyCheckoutDiscount,
  courseInstallmentsRemainder,
  partialBookingDueToday,
  partialOrderGrandTotal,
} from '../utils/partialPricing';
import { inrAmountToUsdRounded } from '../utils/formatters';
import { PROGRAM_DATA } from '../data/paymentLink';
import { COUNTRY_BY_CODE } from '../data/countryCodes';
import {
  getPostPaymentContext,
  submitNsdcData,
  enrollInCourse,
} from '../services/portalService';
import { PartialPaymentStatus } from '../components/PartialPaymentStatus';
import type { PostPaymentContext, NsdcFormData, CoursePurchase } from '../types/portal';

// (Indian states and education options removed — those fields are no longer collected)

// ─── Step indicator component ────────────────────────────────────────────────────
type PortalStep = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<PortalStep, string> = {
  1: 'Confirm Email',
  2: 'NSDC Details',
  3: 'Enrollment',
  4: 'Done',
};

interface StepIndicatorProps {
  currentStep: PortalStep;
  showNsdc: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, showNsdc }) => {
  // If the user is not Indian, we hide step 2 from the visual indicator.
  const visibleSteps: PortalStep[] = showNsdc ? [1, 2, 3, 4] : [1, 3, 4];
  const displaySteps = visibleSteps.map((s, i) => ({ step: s, label: STEP_LABELS[s], display: i + 1 }));

  return (
    <div className="flex items-center justify-between w-full mb-5">
      {displaySteps.map(({ step, label, display }, idx) => {
        const isCompleted = currentStep > step;
        const isCurrent = currentStep === step;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={[
                  'h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isCompleted ? 'bg-green-500 text-white' : '',
                  isCurrent ? 'bg-primary text-white border-2 border-primary/60' : '',
                  !isCompleted && !isCurrent ? 'bg-slate-200 text-slate-500' : '',
                ].join(' ')}
              >
                {isCompleted ? <CheckCircleIcon className="h-3 w-3" /> : display}
              </div>
              <span
                className={[
                  'mt-1 text-xs whitespace-nowrap',
                  isCurrent ? 'text-primary font-normal' : 'text-slate-300',
                  isCompleted ? 'text-green-600' : '',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {idx < displaySteps.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 mb-4 mx-1 transition-colors',
                  currentStep > step ? 'bg-green-400' : 'bg-slate-200',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Masks an email for display, e.g. "saumy@growthschool.io" → "s***y@growthschool.io".
 * Keeps the first character, replaces the middle with ***, keeps the last char + domain.
 */
function maskEmail(raw: string): string {
  const [local, domain] = raw.split('@');
  if (!domain || local.length <= 2) return raw;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/** Case-insensitive email equality check */
function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Demo inbox — same address at checkout unlocks the magic-link confirmation path. */
const MAGIC_LINK_DEMO_EMAIL = 'sidharth@growthschool.io';

/** Prototype OTP accepted after “send” — replace with API verification in production. */
const DEMO_VALID_OTP = '123456';

// ─── Step 1: Email confirmation only (payment breakdown lives on Success / email receipt) ──

interface Step1Props {
  ctx: PostPaymentContext;
  onConfirm: (email: string) => void;
}

type Step1Phase = 'email' | 'magic_link' | 'otp';

const Step1OrderSummary: React.FC<Step1Props> = ({ ctx, onConfirm }) => {
  const [email, setEmail] = useState(ctx.customerEmail);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Step1Phase>('email');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpResentMessage, setOtpResentMessage] = useState(false);

  // True while the user has typed something that differs from their registration email.
  // We show a live warning as they type and block submission if they try to proceed.
  const isDifferentEmail =
    email.trim() !== '' && !emailsMatch(email, ctx.customerEmail);

  const resetToEmailStep = () => {
    setPhase('email');
    setOtp('');
    setOtpError('');
    setOtpResentMessage(false);
    setIsSendingOtp(false);
  };

  const sendOtpMock = async (isResend: boolean) => {
    setIsSendingOtp(true);
    setOtpError('');
    if (!isResend) setOtp('');
    await new Promise((r) => setTimeout(r, 800));
    setIsSendingOtp(false);
    if (isResend) {
      setOtpResentMessage(true);
      setTimeout(() => setOtpResentMessage(false), 4000);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingOtp) return;

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Block if the email doesn't match the one used at registration.
    if (isDifferentEmail) {
      setError(
        `This email doesn't match your registration email (${maskEmail(ctx.customerEmail)}). ` +
        `Please use the same email, or contact support to update it.`,
      );
      return;
    }

    setError('');
    const trimmed = email.trim();

    if (emailsMatch(trimmed, MAGIC_LINK_DEMO_EMAIL)) {
      setPhase('magic_link');
      return;
    }

    void (async () => {
      await sendOtpMock(false);
      setPhase('otp');
    })();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
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
    onConfirm(email.trim());
  };

  const handleMagicLinkConfirmed = () => {
    onConfirm(email.trim());
  };

  return (
    <div>
      {phase === 'email' && (
        <>
          <div className="flex flex-col gap-1.5 mb-6">
            <h2 className="text-xl font-medium text-slate-900 leading-snug">Confirm your email</h2>
            <p className="text-sm text-slate-500 leading-[150%]">
              Payment is complete. Use the same email you used at checkout so we can link your learner account.
            </p>
          </div>

          {isSendingOtp ? (
            <div className="py-10 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-9 w-9 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-slate-600">
                Sending a verification code to{' '}
                <span className="font-medium text-slate-800">{maskEmail(email.trim())}</span>…
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  error={error}
                />

                {isDifferentEmail && !error && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>
                        This doesn't match your registration email{' '}
                        <span className="font-medium">{maskEmail(ctx.customerEmail)}</span>.
                        Your LMS account is linked to that email.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setEmail(ctx.customerEmail); setError(''); }}
                        className="mt-1 text-sm font-normal text-amber-900 underline underline-offset-2 hover:text-amber-700"
                      >
                        Use my registered email instead
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" fullWidth className="font-medium">
                Confirm & Continue
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}
        </>
      )}

      {phase === 'magic_link' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={resetToEmailStep}
            className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2"
          >
            ← Change email
          </button>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-medium text-slate-900 leading-snug">Confirm from your inbox</h2>
            <p className="text-sm text-slate-500 leading-[150%]">
              We sent a <strong className="font-normal">magic link</strong> to{' '}
              <span className="font-normal text-slate-800">{email.trim()}</span>. Open the email and tap{' '}
              <strong className="font-normal">Confirm email</strong> to verify — then return here.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <EnvelopeOpenIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium text-slate-800">Prototype:</span> no real email is sent. Use the button
              below after you would have clicked the link in production.
            </p>
          </div>

          <Button type="button" fullWidth className="font-medium" onClick={handleMagicLinkConfirmed}>
            I've confirmed via the link
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {phase === 'otp' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={resetToEmailStep}
            className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2"
          >
            ← Change email
          </button>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-medium text-slate-900 leading-snug">Enter verification code</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="font-normal text-slate-700">{maskEmail(email.trim())}</span>. Enter it below to
              confirm this address.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">Prototype:</span> use OTP{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-slate-800">{DEMO_VALID_OTP}</code>
          </div>

          {otpResentMessage && (
            <p className="text-sm text-green-700">A new code was sent. Check your inbox.</p>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-4">
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="font-medium"
                disabled={isSendingOtp}
                onClick={() => void sendOtpMock(true)}
              >
                {isSendingOtp ? 'Sending…' : 'Resend code'}
              </Button>
              <Button type="submit" fullWidth className="font-medium" disabled={isSendingOtp}>
                Verify & Continue
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ─── Step 2: NSDC Form ───────────────────────────────────────────────────────────

interface Step2Props {
  hasNsdcDataOnFile: boolean;
  onSubmit: (data: NsdcFormData) => Promise<void>;
  isSubmitting: boolean;
}

const Step2NsdcForm: React.FC<Step2Props> = ({ hasNsdcDataOnFile, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState<NsdcFormData>({
    fullName: '', fatherName: '', dateOfBirth: '',
  });
  const [errors, setErrors] = useState<Partial<NsdcFormData>>({});
  const [showEdit, setShowEdit] = useState(false);

  // If data is already on file and user hasn't clicked Edit, show the summary.
  if (hasNsdcDataOnFile && !showEdit) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <img src={nsdcLogo} alt="NSDC" className="h-10 w-auto flex-shrink-0" />
          <div>
            <h2 className="text-xl font-medium text-slate-900">NSDC Details on File</h2>
            <p className="text-sm text-slate-500">Your details are already submitted.</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Your NSDC / government registration details are already on file. No action
            needed — we'll proceed to enrollment.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowEdit(true)} className="flex-1">
            Edit Details
          </Button>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Partial<NsdcFormData> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!form.fatherName.trim()) newErrors.fatherName = "Father's full name is required.";
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Your date of birth is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof NsdcFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user types
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <div>
      <div className="flex flex-col items-start justify-center gap-5 mb-2">
        <img src={nsdcLogo} alt="NSDC" className="h-[80px] w-auto flex-shrink-0" />
        <div>
          <h2 className="text-lg font-medium text-slate-900">NSDC Registration</h2>
          <p className="text-sm text-slate-500">Required once for government certification.</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5">
        This course is aligned with <strong className="font-medium">NSDC ({PROGRAM_DATA.sscName})</strong>. We need
        these details to register you with the government portal. You only fill this once —
        it will be saved to your profile for future courses.
      </p>

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

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Save & Continue'}
          {!isSubmitting && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </form>
    </div>
  );
};

// ─── Step 3: Enrollment ──────────────────────────────────────────────────────────

interface Step3Props {
  course: CoursePurchase;
  onComplete: (enrolledCourse: CoursePurchase) => void;
  customerId: string;
}

const Step3Enrollment: React.FC<Step3Props> = ({ course, onComplete, customerId }) => {
  const [status, setStatus] = useState<'enrolling' | 'done' | 'error'>('enrolling');

  useEffect(() => {
    let cancelled = false;
    enrollInCourse(customerId, course).then(({ enrollmentStatus }) => {
      if (cancelled) return;
      onComplete({ ...course, enrollmentStatus });
      setStatus('done');
    }).catch(() => {
      if (!cancelled) setStatus('error');
    });
    return () => { cancelled = true; };
  // We want this to run once when the component mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center py-8">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <AcademicCapIcon className="h-9 w-9 text-primary" />
      </div>
      <h2 className="text-xl font-medium text-slate-900 mb-2">
        {status === 'enrolling' ? 'Setting up your access…' : 'Enrollment Complete!'}
      </h2>
      {status === 'enrolling' && (
        <>
          <p className="text-slate-500 text-sm mb-6">
            We're enrolling you in{' '}
            <span className="font-medium">{course.name}</span>. This takes just a moment.
          </p>
          {/* Spinner */}
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </>
      )}
      {status === 'error' && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-left">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>
            Something went wrong during enrollment. Please contact support with your Order ID.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Step 4: Final Success ───────────────────────────────────────────────────────

interface Step4Props {
  ctx: PostPaymentContext;
  enrolledCourse: CoursePurchase | null;
  confirmedEmail: string;
}

const Step4Success: React.FC<Step4Props> = ({ ctx, enrolledCourse, confirmedEmail }) => {
  const navigate = useNavigate();
  const { userDetails, checkoutAddonsTotal, checkoutDiscountMultiplier } = useStore();

  const discountWindow = PROGRAM_DATA.discount_window;
  const isDiscountActive =
    discountWindow ? new Date() < new Date(discountWindow.expiresAt) : false;

  const dialCode = COUNTRY_BY_CODE[userDetails.countryCode]?.dialCode ?? '';
  const phoneDisplay =
    userDetails.phone.trim() !== '' ? `${dialCode ? `${dialCode}-` : ''}${userDetails.phone}` : undefined;

  // ── PARTIAL — booking + instalment progress (shared UI with order detail portal) ──
  if (ctx.paymentType === 'PARTIAL') {
    const disc = (n: number) => applyCheckoutDiscount(n, checkoutDiscountMultiplier);
    const firstPaymentTotal = disc(partialBookingDueToday(checkoutAddonsTotal));
    const orderGrandTotal = disc(partialOrderGrandTotal(checkoutAddonsTotal));
    const courseRemainderPending = disc(courseInstallmentsRemainder());
    const useInr = ctx.isIndianCustomer;
    const ledgerToDisplay = (inr: number) => (useInr ? inr : inrAmountToUsdRounded(inr));
    const displayCurrency = useInr ? 'INR' : 'USD';
    return (
      <div className="text-left space-y-5">
        {/* Bleed to Card edges: matches Card `p-6 sm:p-8` on all sides used here so the dark hero is flush with the white shell */}
        <div className="-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 min-w-0">
          <PartialPaymentStatus
            orderId={ctx.paymentId}
            programName={PROGRAM_DATA.title}
            email={confirmedEmail}
            phoneDisplay={phoneDisplay}
            totalAmount={ledgerToDisplay(orderGrandTotal)}
            paidAmount={ledgerToDisplay(firstPaymentTotal)}
            pendingAmount={ledgerToDisplay(courseRemainderPending)}
            currency={displayCurrency}
            plan={{
              bookingAmount: ledgerToDisplay(firstPaymentTotal),
              installments: PROGRAM_DATA.installments.map((i) => ({
                amount: ledgerToDisplay(disc(i.amount)),
                dueDate: i.dueDate,
                label: i.label,
              })),
            }}
            paidScheduleSteps={1}
            lastPaidAt={new Date().toISOString()}
            orderSummaryAnchorId="portal-enroll-order-summary"
            anchorLinkLabel="Check Order Summary"
            discountedRemainingAmount={
              isDiscountActive && discountWindow
                ? ledgerToDisplay(discountWindow.discountedRemainingAmount)
                : undefined
            }
            nsdcRequired={ctx.isIndianCustomer}
            nsdcCompleted={ctx.hasNsdcDataOnFile}
            effectiveLmsStatus="dummy"
            discountExpiresAt={discountWindow?.expiresAt}
            payments={[]}
            onPayFullRemaining={() => {
              /* wire up to payment gateway */
            }}
            onPayNextInstallment={() => {
              /* wire up to payment gateway */
            }}
            flushTopWithCardShell
          />
        </div>

        <p className="text-xs text-slate-400 text-center">
          Confirmation sent to{' '}
          <span className="font-medium text-slate-600">{confirmedEmail}</span>
        </p>

        <div className="space-y-3" id="portal-enroll-order-summary">
          {PROGRAM_DATA.redirect_url && (
            <Button
              fullWidth
              onClick={() => window.open(PROGRAM_DATA.redirect_url, '_blank')}
            >
              Go to Learner's Dashboard
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button variant="outline" fullWidth onClick={() => navigate('/portal/orders')}>
            View my orders
          </Button>
        </div>
      </div>
    );
  }

  // ── FULL payment — simple success ──────────────────────────────────────────
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <CheckCircleIcon className="h-10 w-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-medium text-slate-900 mb-2">You're all set!</h2>
      <p className="text-slate-500 text-sm mb-6">
        Your full course access is now active. Welcome to GrowthSchool!
      </p>

      {enrolledCourse && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Course</span>
            <span className="font-normal text-slate-900">{enrolledCourse.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Access</span>
            <Badge variant="success">Full Access</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">LMS Email</span>
            <span className="font-normal text-slate-900 truncate max-w-[60%]">
              {confirmedEmail}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mb-6">
        A confirmation email has been sent to{' '}
        <span className="font-normal text-slate-600">{confirmedEmail}</span>.
      </p>

      <div className="space-y-3">
        {PROGRAM_DATA.redirect_url && (
          <Button
            fullWidth
            onClick={() => window.open(PROGRAM_DATA.redirect_url, '_blank')}
          >
            Go to Learner's Dashboard
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        )}
        <Button variant="outline" fullWidth onClick={() => navigate('/portal/orders')}>
          View my orders
        </Button>
      </div>
    </div>
  );
};

// ─── Main Portal Page ────────────────────────────────────────────────────────────

type EnrollLocationState = {
  /** Set by Success page after checkout for India only — skip Step 1; NSDC (step 2) if not on file, else enrollment. */
  autoConfirmEmailFromCheckout?: boolean;
};

export const PortalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { paymentMode, userDetails, setPostPaymentContext } = useStore();

  const [step, setStep] = useState<PortalStep>(1);
  const [ctx, setCtx] = useState<PostPaymentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [enrolledCourse, setEnrolledCourse] = useState<CoursePurchase | null>(null);
  const [isSubmittingNsdc, setIsSubmittingNsdc] = useState(false);
  const checkoutAutoAdvanceDone = useRef(false);

  // Generate a stable mock payment ID for this session
  const mockPaymentId = React.useMemo(
    () => `PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    [],
  );

  // Load context from backend (mock) on mount
  useEffect(() => {
    setLoading(true);
    getPostPaymentContext(mockPaymentId, paymentMode, userDetails.countryCode)
      .then((data) => {
        // Merge the email we already have from the checkout form
        const merged = { ...data, customerEmail: userDetails.email };
        setCtx(merged);
        setConfirmedEmail(userDetails.email);
        setPostPaymentContext(merged);
      })
      .finally(() => setLoading(false));
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step transition helpers ────────────────────────────────────────────────────

  const handleEmailConfirmed = (email: string) => {
    setConfirmedEmail(email);
    if (!ctx) return;
    const updated = { ...ctx, customerEmail: email };
    setCtx(updated);
    setPostPaymentContext(updated);

    // Decide next step: skip NSDC if not Indian or already on file
    if (ctx.isIndianCustomer && !ctx.hasNsdcDataOnFile) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleNsdcSubmit = async (data: NsdcFormData) => {
    if (!ctx) return;
    setIsSubmittingNsdc(true);
    try {
      await submitNsdcData(ctx.customerId, data);
      const updated = { ...ctx, hasNsdcDataOnFile: true };
      setCtx(updated);
      setPostPaymentContext(updated);
      setStep(3);
    } finally {
      setIsSubmittingNsdc(false);
    }
  };

  const handleEnrollmentComplete = (enrolled: CoursePurchase) => {
    setEnrolledCourse(enrolled);
    // Small delay so the "Enrollment Complete!" text is visible before advancing
    setTimeout(() => setStep(4), 1000);
  };

  // After Success countdown: Indian checkout only — skip Step 1 email confirm → NSDC or enrollment.
  // International users never receive this state; they complete Step 1 (email) first.
  useEffect(() => {
    if (loading || !ctx || checkoutAutoAdvanceDone.current) return;
    const st = location.state as EnrollLocationState | null | undefined;
    if (!st?.autoConfirmEmailFromCheckout) return;
    checkoutAutoAdvanceDone.current = true;
    navigate('.', { replace: true, state: {} });

    const email = userDetails.email?.trim() || ctx.customerEmail;
    setConfirmedEmail(email);
    const updated = { ...ctx, customerEmail: email };
    setCtx(updated);
    setPostPaymentContext(updated);
    if (ctx.isIndianCustomer && !ctx.hasNsdcDataOnFile) {
      setStep(2);
    } else {
      setStep(3);
    }
  }, [loading, ctx, location.state, navigate, setPostPaymentContext, userDetails.email]);

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your order details…</p>
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm">
            We couldn't load your payment details. Please contact support.
          </p>
        </Card>
      </div>
    );
  }

  const showNsdc = ctx.isIndianCustomer;
  const primaryCourse = ctx.courses[0];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="p-6 sm:p-8">
          {/* Step indicator — hide on final success */}
          {step !== 4 && <StepIndicator currentStep={step} showNsdc={showNsdc} />}

          {step === 1 && (
            <Step1OrderSummary ctx={ctx} onConfirm={handleEmailConfirmed} />
          )}

          {step === 2 && (
            <Step2NsdcForm
              hasNsdcDataOnFile={ctx.hasNsdcDataOnFile}
              onSubmit={handleNsdcSubmit}
              isSubmitting={isSubmittingNsdc}
            />
          )}

          {step === 3 && primaryCourse && (
            <Step3Enrollment
              course={primaryCourse}
              customerId={ctx.customerId}
              onComplete={handleEnrollmentComplete}
            />
          )}

          {step === 4 && (
            <Step4Success
              ctx={ctx}
              enrolledCourse={enrolledCourse}
              confirmedEmail={confirmedEmail}
            />
          )}
        </Card>

        {/* Footer note */}
        {step !== 4 && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Having trouble? Email us at{' '}
            <a href="mailto:support@growthschool.io" className="underline">
              support@growthschool.io
            </a>
          </p>
        )}
      </div>
    </div>
  );
};
