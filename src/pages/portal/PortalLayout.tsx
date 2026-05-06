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
import { Outlet } from 'react-router-dom';

// ─── Layout ───────────────────────────────────────────────────────────────────
// Tab navigation has been moved into the global App header to save vertical
// space. This layout now just provides the slate-50 background and renders
// whichever child route is active via <Outlet />.

export const PortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  );
};
