import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ShoppingBagIcon, KeyIcon } from '@heroicons/react/24/outline';
import { DetailsPage } from './pages/Details';
import { ReviewPage } from './pages/Review';
import { SuccessPage } from './pages/Success';
import { PortalPage } from './pages/Portal';
import { PortalLayout } from './pages/portal/PortalLayout';
import { MyOrdersPage } from './pages/portal/MyOrdersPage';
import { OrderDetailPage } from './pages/portal/OrderDetailPage';
import { GetAccessPage } from './pages/portal/GetAccessPage';
import { AccessDetailPage } from './pages/portal/AccessDetailPage';
import { UseCaseIndexPage } from './pages/dev/UseCaseIndexPage';
import { useStore } from './store/useStore';
import type { ProgramType, CheckoutScenario, BrandType } from './store/useStore';
import { BRANDS } from './data/brand';
import { PaymentLinkFooter } from './components/PaymentLinkFooter';

function App() {
  const location = useLocation();
  const { userDetails, resetToStep1, programType, setProgramType, checkoutScenario, setCheckoutScenario, brand, setBrand } = useStore();
  const email = userDetails?.email?.trim() ?? '';
  /** Details (`/`) is before the learner has finished step 1 — no header email until `/review`+. */
  const showHeaderEmail = email.length > 0 && location.pathname !== '/';
  /** Show portal tabs only inside /portal/* but not on the enroll wizard. */
  const isPortalRoute =
    location.pathname.startsWith('/portal') &&
    !location.pathname.startsWith('/portal/enroll');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inject a <style> tag into <head> with !important overrides for every
  // brand-driven class. This is the most reliable approach — it bypasses all
  // Tailwind layer ordering and CSS variable resolution issues.
  useEffect(() => {
    const STYLE_ID = 'brand-theme-overrides';
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }

    if (brand === 'outskill') {
      el.textContent = ''; // remove overrides — stylesheet defaults apply
      return;
    }

    const t = BRANDS[brand].tokens;
    const [pr, pg, pb]   = t.primary.split(' ');
    const [hr, hg, hb]   = t.primaryHover.split(' ');
    const [lr, lg, lb]   = t.primaryLight.split(' ');
    const [fr, fg, fb]   = t.primaryForeground.split(' ');
    const [xr, xg, xb]   = t.hero.split(' ');
    const p  = `rgb(${pr} ${pg} ${pb})`;
    const ph = `rgb(${hr} ${hg} ${hb})`;
    const pl = `rgb(${lr} ${lg} ${lb})`;
    const pf = `rgb(${fr} ${fg} ${fb})`;
    const h  = `rgb(${xr} ${xg} ${xb})`;

    el.textContent = `
      .bg-primary                           { background-color: ${p}  !important; }
      .hover\\:bg-primary-hover:hover        { background-color: ${ph} !important; }
      .hover\\:bg-primary:hover              { background-color: ${p}  !important; }
      .bg-primary-light                     { background-color: ${pl} !important; }
      .hover\\:bg-primary-light:hover        { background-color: ${pl} !important; }
      .bg-primary-light\\/70                 { background-color: ${pl} !important; }
      .hover\\:bg-primary-light\\/70:hover    { background-color: ${pl} !important; }
      .text-primary                         { color: ${p}  !important; }
      .text-primary-foreground              { color: ${pf} !important; }
      .border-primary                       { border-color: ${p} !important; }
      .border-primary-light                 { border-color: ${pl} !important; }
      .bg-surface-inverse                   { background-color: ${h} !important; }
      .bg-brand-hero                        { background-color: ${h} !important; }
      .focus\\:ring-primary:focus            { --tw-ring-color: ${p}; }
      .ring-primary                         { --tw-ring-color: ${p}; }
      .hover\\:border-primary:hover          { border-color: ${p} !important; }
    `;
  }, [brand]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex w-full items-center">
          <img
            src={BRANDS[brand].logo}
            alt={BRANDS[brand].logoAlt}
            className="h-auto max-h-[40px] w-auto max-w-[180px] object-contain object-center select-none sm:max-h-[44px] sm:max-w-[190px] flex-shrink-0"
          />

          {/* Program type switcher — always visible for prototype testing */}
          <div className="flex items-center gap-1 ml-4 bg-slate-100 rounded-lg p-1 flex-shrink-0">
            {(
              [
                { value: 'nsdc' as ProgramType, label: 'NSDC' },
                { value: 'non-nsdc' as ProgramType, label: 'Non-NSDC' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setProgramType(value)}
                className={[
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  programType === value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Checkout scenario switcher — prototype testing of layout use cases */}
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">Scenario:</span>
            <select
              value={checkoutScenario}
              onChange={(e) => setCheckoutScenario(e.target.value as CheckoutScenario)}
              className="text-xs rounded-lg border border-slate-200 bg-white text-slate-700 py-1 pl-2 pr-6 appearance-none shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.25rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.1em 1.1em',
              }}
            >
              <option value="standard">Standard (all options)</option>
              <option value="no-addons">UC1 — No add-ons</option>
              <option value="full-no-addons">UC2 — Full only</option>
              <option value="full-with-addons">UC3 — Full only + add-ons</option>
            </select>
          </div>

          {/* Brand switcher — prototype testing of brand themes */}
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">Brand:</span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as BrandType)}
              className="text-xs rounded-lg border border-slate-200 bg-white text-slate-700 py-1 pl-2 pr-6 appearance-none shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.25rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.1em 1.1em',
              }}
            >
              <option value="outskill">Outskill</option>
              <option value="growthschool">GrowthSchool</option>
            </select>
          </div>

          {/* Portal tabs — centred in the remaining space, only on /portal/* */}
          {isPortalRoute ? (
            <nav className="flex-1 flex justify-center" aria-label="Portal sections">
              {[
                { label: 'Get Access', to: '/portal/access', Icon: KeyIcon },
                { label: 'My Orders', to: '/portal/orders', Icon: ShoppingBagIcon },
              ].map(({ label, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 px-4 h-16 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="flex-1" />
          )}

          {showHeaderEmail && (
            <div className="relative flex-shrink-0 ml-4" ref={dropdownRef}>
              {/* Trigger button — shows a truncated email + chevron */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors max-w-[200px]"
              >
                <span className="truncate">{email}</span>
                <ChevronDownIcon
                  className={[
                    'h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform duration-150',
                    dropdownOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {/* Email label — not clickable, just for context */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 truncate">{email}</p>
                  </div>

                  {/* Contact Support */}
                  <a
                    href="mailto:support@growthschool.io"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Contact Support
                  </a>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    {/* Log out */}
                    <button
                      onClick={() => { resetToStep1(); setDropdownOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <main className="flex-1 min-h-0">
        <Routes>
          {/* Checkout flow */}
          <Route path="/" element={<DetailsPage />} />
          <Route path="/review" element={<ReviewPage />} />

          {/* Post-payment enrollment wizard (immediate flow right after payment) */}
          <Route path="/portal/enroll" element={<PortalPage />} />

          {/* Self-serve customer portal — two sections: My Orders + Get Access */}
          <Route path="/portal" element={<PortalLayout />}>
            {/* Default: redirect /portal → /portal/access */}
            <Route index element={<Navigate to="access" replace />} />
            {/* My Orders section — transaction / admin tasks */}
            <Route path="orders" element={<MyOrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            {/* Get Access section — post-purchase onboarding and access */}
            <Route path="access" element={<GetAccessPage />} />
            <Route path="access/:orderId" element={<AccessDetailPage />} />
          </Route>

          {/* Payment confirmed — shown immediately after pay, before registration */}
          <Route path="/success" element={<SuccessPage />} />
          {/* Keep the old SuccessPage accessible at /success-legacy if needed */}
          <Route path="/success-legacy" element={<SuccessPage />} />
          {import.meta.env.DEV && (
            <Route path="/dev/use-cases" element={<UseCaseIndexPage />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PaymentLinkFooter />
    </div>
  );
}

export default App;

