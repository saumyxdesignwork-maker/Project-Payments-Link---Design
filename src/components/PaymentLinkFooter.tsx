import React from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

/** Legal pages — update to match production CMS when available. */
const TERMS_URL = 'https://www.growthschool.io/terms';
const PRIVACY_URL = 'https://www.growthschool.io/privacy';
const REFUND_URL = 'https://www.growthschool.io/refund-policy';

const SUPPORT_EMAIL = 'support@growthschool.io';

/**
 * Compliance footer for the payment-link checkout flow (PCI badge, merchant copy, policies, support).
 * PCI DSS mark is served from `/pci-dss-compliant.svg` (Vite `Public/` folder).
 */
export const PaymentLinkFooter: React.FC = () => {
  const year = new Date().getFullYear();

  const linkClass =
    'text-inherit underline underline-offset-2 decoration-white/40 hover:decoration-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm';

  return (
    <footer
      className="mt-auto w-full border-t border-white/10 bg-surface-inverse text-[#b8c9bc] text-sm"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 sm:flex-row sm:justify-between sm:items-start sm:gap-10">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <img
              src={`${import.meta.env.BASE_URL}pci-dss-compliant.svg`}
              width={53}
              height={24}
              alt="PCI DSS compliant"
              className="h-6 w-auto flex-shrink-0 object-contain object-left"
              loading="lazy"
              decoding="async"
            />
            <span className="font-medium text-[#dce6df] tracking-tight">100% Secure Transaction</span>
          </div>
          <p className="text-xs sm:text-sm text-[#9aaf9f]">
            © {year} Sisinty Pvt. Ltd (Singapore)
          </p>
        </div>

        <div className="space-y-4 sm:max-w-lg text-left">
          <p className="text-xs sm:text-sm leading-[1.6] text-[#b8c9bc]">
            By proceeding you agree to our{' '}
            <a href={TERMS_URL} className={linkClass} target="_blank" rel="noopener noreferrer">
              Terms
            </a>
            ,{' '}
            <a href={PRIVACY_URL} className={linkClass} target="_blank" rel="noopener noreferrer">
              Privacy
            </a>
            {' & '}
            <a href={REFUND_URL} className={linkClass} target="_blank" rel="noopener noreferrer">
              Refund Policy
            </a>
            . You&apos;re making a payment to Sisinty Pvt. Ltd (Singapore)
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#dce6df] hover:text-white transition-colors sm:ml-auto"
          >
            <EnvelopeIcon className="h-4 w-4 flex-shrink-0 opacity-90" aria-hidden />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
