import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ShoppingBagIcon, KeyIcon } from '@heroicons/react/24/outline';
import outskillLogo from './assets/outskill-logo.svg';
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
import { PaymentLinkFooter } from './components/PaymentLinkFooter';

function App() {
  const location = useLocation();
  const { userDetails, resetToStep1 } = useStore();
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex w-full items-center">
          <img
            src={outskillLogo}
            alt="Outskill"
            className="h-auto max-h-[20px] w-auto max-w-[90px] object-contain object-center select-none sm:max-h-[22px] sm:max-w-[95px] flex-shrink-0"
          />

          {/* Portal tabs — centred in the remaining space, only on /portal/* */}
          {isPortalRoute ? (
            <nav className="flex-1 flex justify-center" aria-label="Portal sections">
              {[
                { label: 'My Orders', to: '/portal/orders', Icon: ShoppingBagIcon },
                { label: 'Get Access', to: '/portal/access', Icon: KeyIcon },
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
            {/* Default: redirect /portal → /portal/orders */}
            <Route index element={<Navigate to="orders" replace />} />
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

