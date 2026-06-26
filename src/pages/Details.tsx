import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROGRAM_DATA } from '../data/paymentLink';
import { COUNTRIES, COUNTRY_BY_CODE, isIndianCountryCode } from '../data/countryCodes';
import { useStore } from '../store/useStore';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { formatCheckoutPrice } from '../utils/formatters';
import { CohortSelector } from '../components/CohortSelector';
import nsdcLogo from '../assets/nsdc-logo.svg';
import { BRANDS } from '../data/brand';

export const DetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    selectedCohortId, 
    setCohortId, 
    userDetails, 
    setUserDetails,
    programType,
    gstEnabled,
    setGstEnabled,
    gstDetails,
    setGstDetails,
    brand,
  } = useStore();

  const isNsdc = programType === 'nsdc';

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!userDetails.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!userDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!userDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const digits = userDetails.phone.replace(/\D/g, '');
      const country = COUNTRY_BY_CODE[userDetails.countryCode];
      if (country?.digitLen && digits.length !== country.digitLen) {
        newErrors.phone = `Enter a valid ${country.digitLen}-digit number for ${country.name}`;
      } else if (digits.length < 6 || digits.length > 15) {
        newErrors.phone = 'Enter a valid phone number (6–15 digits)';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigate('/review');
    }
  };

  const isIndia = isIndianCountryCode(userDetails.countryCode);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-medium text-slate-900">{PROGRAM_DATA.title}</h1>
            {isNsdc && PROGRAM_DATA.isNsdcAligned && (
               <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 font-normal">
                 NSDC Training Partnership
               </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 mt-1">
            {isNsdc && isIndia && (
              <span className="text-sm text-slate-600">NSDC: {PROGRAM_DATA.nsdc_course_name}</span>
            )}
            <span className="text-sm text-slate-400">SKU ID: {PROGRAM_DATA.sku_id}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-medium text-slate-900 mb-4">Select Cohort</h2>
            <CohortSelector
              value={selectedCohortId}
              onChange={setCohortId}
              cohorts={PROGRAM_DATA.cohorts}
            />
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-900 mb-4">Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={userDetails.fullName}
                onChange={(e) => setUserDetails({ fullName: e.target.value })}
                error={errors.fullName}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={userDetails.email}
                onChange={(e) => setUserDetails({ email: e.target.value })}
                error={errors.email}
              />
              {/* ── Country + Phone composite ──────────────────────────────── */}
              <div>
                <label className="block text-sm font-normal text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  {/* Country selector — stores ISO code, shows flag + dial code */}
                  <select
                    value={userDetails.countryCode}
                    onChange={(e) => {
                      setUserDetails({ countryCode: e.target.value, phone: '' });
                    }}
                    aria-label="Country code"
                    className="rounded-lg border border-slate-300 bg-white text-slate-900 text-sm py-2.5 pl-3 pr-8 shadow-sm focus:border-primary focus:ring-primary appearance-none flex-shrink-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em',
                      minWidth: '6.5rem',
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </select>

                  {/* Phone number input */}
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={userDetails.phone}
                      onChange={(e) => setUserDetails({ phone: e.target.value.replace(/\D/g, '') })}
                      placeholder={
                        isIndianCountryCode(userDetails.countryCode)
                          ? '9876543210'
                          : 'Phone number'
                      }
                      className={[
                        'block w-full rounded-lg border shadow-sm sm:text-sm py-2.5 px-3 bg-white text-slate-900 placeholder-slate-400',
                        errors.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:border-primary focus:ring-primary',
                      ].join(' ')}
                    />
                  </div>
                </div>
                {/* Show the selected country name as a hint */}
                <p className="mt-1 text-xs text-slate-400">
                  {COUNTRY_BY_CODE[userDetails.countryCode]?.name}
                </p>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>
              {/* ──────────────────────────────────────────────────────────────── */}

              {/* GST toggle + fields + CTA in one autolayout column, 8px gap */}
              <div className="flex flex-col gap-[18px] mt-2">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setGstEnabled(!gstEnabled)}
                >
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300 accent-primary cursor-pointer flex-shrink-0"
                    style={{ width: '14px', height: '14px' }}
                  />
                  <span className="text-sm text-slate-700">I need a GST Invoice</span>
                </div>

                {gstEnabled && (
                  <div className="px-4 pb-4 pt-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <Input
                      label="GST Number (GSTIN)"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      value={gstDetails.gstin}
                      onChange={(e) => setGstDetails({ gstin: e.target.value.toUpperCase() })}
                    />
                    <Input
                      label="Company Name"
                      placeholder="Enter your company name"
                      value={gstDetails.companyName}
                      onChange={(e) => setGstDetails({ companyName: e.target.value })}
                    />
                    <Input
                      label="Billing Address"
                      placeholder="Enter your billing address"
                      value={gstDetails.billingAddress}
                      onChange={(e) => setGstDetails({ billingAddress: e.target.value })}
                    />
                  </div>
                )}

                <Button type="submit" fullWidth className="font-medium" disabled={!agreedToTerms}>
                  Proceed to Review
                </Button>
              </div>

              {/* Terms agreement checkbox */}
              <div className="flex items-start gap-2 mt-3">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-primary accent-primary cursor-pointer flex-shrink-0"
                  style={{ width: '14px', height: '14px' }}
                />
                <label htmlFor="terms-agreement" className="text-xs text-slate-500 cursor-pointer leading-relaxed">
                  By proceeding you agree to our{' '}
                  <a href="https://outskill.com/terms" target="_blank" rel="noopener noreferrer" className="underline text-slate-600 hover:text-slate-900">
                    Terms
                  </a>
                  ,{' '}
                  <a href="https://outskill.com/privacy" target="_blank" rel="noopener noreferrer" className="underline text-slate-600 hover:text-slate-900">
                    Privacy
                  </a>
                  {' '}&amp;{' '}
                  <a href="https://outskill.com/refund-policy" target="_blank" rel="noopener noreferrer" className="underline text-slate-600 hover:text-slate-900">
                    Refund Policy
                  </a>
                  .
                </label>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column - Summary (Static on this page) */}
        <div className="md:sticky md:top-6 h-fit">
          <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="text-base font-medium text-slate-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-600">Total Program Fee</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatCheckoutPrice(PROGRAM_DATA.totalFee, isIndia)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">(Inclusive of all taxes)</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-700">
                  Payment option starting from {formatCheckoutPrice(PROGRAM_DATA.bookingAmount, isIndia)}.
                </p>
              </div>
            </div>
          </Card>

          {isNsdc && PROGRAM_DATA.isNsdcAligned ? (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100 mt-6 relative overflow-hidden">
               <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-100 rounded-full opacity-50"></div>
               <div className="relative z-10">
                 <div className="flex flex-col items-start gap-3">
                   <img
                     src={nsdcLogo}
                     alt="NSDC"
                     className="h-12 w-auto flex-shrink-0 object-contain"
                   />
                   <div>
                     <h3 className="font-medium text-slate-900">NSDC Certification Included</h3>
                     <p className="text-sm text-slate-600 mt-1">
                       Upon successful completion, you will receive a government-recognized certificate from the {PROGRAM_DATA.sscName}.
                     </p>
                   </div>
                 </div>
               </div>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-100 mt-6 relative overflow-hidden">
               <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-100 rounded-full opacity-50"></div>
               <div className="relative z-10">
                 <div className="flex flex-col items-start gap-3">
                   <img
                     src={BRANDS[brand].logo}
                     alt={BRANDS[brand].logoAlt}
                     className="h-4 w-auto flex-shrink-0 object-contain"
                   />
                   <div>
                     <h3 className="font-medium text-slate-900">Certification of Completion included</h3>
                     <p className="text-sm text-slate-600 mt-1">
                       Upon successful completion, you will receive a Certificate of Completion from {BRANDS[brand].name}.
                     </p>
                   </div>
                 </div>
               </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
