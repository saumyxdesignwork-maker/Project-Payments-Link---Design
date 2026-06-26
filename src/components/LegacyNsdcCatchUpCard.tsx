/**
 * Portal home — Indian learners with a pre-mandate purchase where NSDC was not collected
 * at checkout but must be completed now due to updated certification rules.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

import nsdcLogo from '../assets/nsdc-logo.svg';
import type { Order } from '../types/order';
import { formatDate } from '../utils/formatters';

export interface LegacyNsdcCatchUpCardProps {
  orders: Order[];
}

export const LegacyNsdcCatchUpCard: React.FC<LegacyNsdcCatchUpCardProps> = ({ orders }) => {
  if (orders.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50/90 to-white shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <img src={nsdcLogo} alt="NSDC" className="h-10 w-auto flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-slate-900 leading-snug">
              NSDC details for an earlier program
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2.5 text-xs text-slate-600">
          <InformationCircleIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden />
          <p className="leading-normal min-w-0 flex-1">
            This is separate from your newest orders. Open the order below and use{' '}
            <span className="font-medium text-slate-800">Complete NSDC Registration</span>.
          </p>
        </div>

        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{o.programName}</p>
                <p className="text-xs text-slate-500">
                  Order <span className="font-mono text-slate-600">{o.id}</span>
                  <span className="text-slate-400"> · </span>
                  Purchased {formatDate(o.createdAt)}
                </p>
              </div>
              <Link
                to={`/portal/orders/${o.id}`}
                className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                Complete NSDC
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
