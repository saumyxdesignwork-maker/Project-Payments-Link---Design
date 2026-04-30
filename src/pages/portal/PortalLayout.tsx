/**
 * PortalLayout.tsx  —  Customer Portal: Shared Layout
 *
 * Wraps all /portal/* routes and provides two clearly separated
 * top-level sections via tab navigation:
 *
 *   • My Orders  (/portal/orders)   — transaction and admin tasks
 *   • Get Access (/portal/access)   — post-purchase onboarding and access
 *
 * React Router's <Outlet /> renders whichever child route is active.
 * Each section can grow independently without touching the other.
 */

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ShoppingBagIcon, KeyIcon } from '@heroicons/react/24/outline';

// ─── Tab definition ───────────────────────────────────────────────────────────

const TABS = [
  {
    label: 'My Orders',
    to: '/portal/orders',
    Icon: ShoppingBagIcon,
    description: 'View and manage your purchases',
  },
  {
    label: 'Get Access',
    to: '/portal/access',
    Icon: KeyIcon,
    description: 'Activate and manage program access',
  },
] as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const PortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Portal tab navigation bar ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto">
          <nav className="flex gap-0" aria-label="Portal sections">
            {TABS.map(({ label, to, Icon }) => (
              <NavLink
                key={to}
                to={to}
                /*
                 * NavLink receives an `isActive` flag from React Router.
                 * We use it to highlight the current section's tab.
                 * The "end" prop is NOT set so that /portal/orders/:id also
                 * keeps the "My Orders" tab highlighted.
                 */
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors',
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
        </div>
      </div>

      {/* ── Active section content ── */}
      {/*
       * <Outlet /> is a React Router placeholder.
       * Think of it like a "slot" — whichever child route is active
       * (MyOrdersPage, GetAccessPage, etc.) gets rendered here.
       */}
      <Outlet />

    </div>
  );
};
