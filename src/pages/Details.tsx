import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROGRAM_DATA } from '../data/paymentLink';
import { COUNTRIES, COUNTRY_BY_CODE, isIndianCountryCode } from '../data/countryCodes';
import { useStore } from '../store/useStore';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Accordion } from '../components/Accordion';
import { formatCheckoutPrice } from '../utils/formatters';
import nsdcLogo from '../assets/nsdc-logo.svg';

export const DetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    selectedCohortId, 
    setCohortId, 
    userDetails, 
    setUserDetails 
  } = useStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const selectedCohort = PROGRAM_DATA.cohorts.find(c => c.id === selectedCohortId);
  const isIndia = isIndianCountryCode(userDetails.countryCode);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-medium text-slate-900">{PROGRAM_DATA.title}</h1>
            {PROGRAM_DATA.isNsdcAligned && (
               <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 font-normal">
                 NSDC Training Partnership
               </Badge>
            )}
          </div>
          <p className="text-slate-600 font-normal text-sm">
            The corresponding NSDC program name is Gen AI for Tech Professionals - On Demand.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-medium text-slate-900 mb-4">Select Cohort</h2>
            <div className="space-y-3">
              <select
                value={selectedCohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-4 pr-10 border bg-white appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {PROGRAM_DATA.cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
              {selectedCohort && (
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                  <p>{selectedCohort.description}</p>
                  {selectedCohort.seatsLeft && selectedCohort.seatsLeft < 20 && (
                     <p className="text-red-600 font-normal mt-1">
                       Only {selectedCohort.seatsLeft} seats left!
                     </p>
                  )}
                </div>
              )}
            </div>
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
                  {isIndianCountryCode(userDetails.countryCode) &&
                    ' · NSDC certification details will be collected after payment'}
                </p>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>
              {/* ──────────────────────────────────────────────────────────────── */}
              
              <Button type="submit" fullWidth className="mt-6 font-medium">
                Proceed to Review
              </Button>
            </form>
          </section>
        </div>

        {/* Right Column - Summary (Static on this page) */}
        <div className="md:sticky md:top-6 h-fit">
           {/* Included Features Accordion */}
           <div className="mb-6">
              <Accordion 
                items={[{
                  id: 'features',
                  title: 'What\'s included in the Program',
                  content: (
                    <ul className="space-y-3">
                       {PROGRAM_DATA.features?.map((feature, idx) => (
                         <li key={idx} className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-700 text-sm">{feature}</span>
                         </li>
                       ))}
                    </ul>
                  )
                }]}
                defaultOpen={false}
              />
           </div>

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
                  <span className="font-medium text-primary">Pay {formatCheckoutPrice(PROGRAM_DATA.bookingAmount, isIndia)} today</span> to confirm your seat in {selectedCohort?.name}.
                </p>
              </div>
            </div>
          </Card>

          {PROGRAM_DATA.isNsdcAligned && (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100 mt-6 relative overflow-hidden">
               {/* Decorative background circle */}
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
          )}
        </div>
      </div>
    </div>
  );
};
