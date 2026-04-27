/**
 * ToolAccessList.tsx
 *
 * Renders the "Tools included with your subscription" section on the order detail page.
 * Each tool entitlement is shown as a card row with:
 *   - Tool icon (Emily / Perplexity logos or letter initial) + name
 *   - Notes / description
 *   - Validity dates (if provided)
 *   - Status badge
 *   - Action button (Activate / Open) or expiry note
 *
 * To add a new tool in the future:
 *   1. Extend `ToolName` in src/types/order.ts
 *   2. Add a colour entry in TOOL_COLORS below
 *   3. Add mock or DB data in portalService.ts
 */

import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Badge } from './Badge';
import { Button } from './Button';
import type { ToolAccess } from '../types/order';
import emilyLogo from '../assets/emily-logo.svg';
import perplexityLogo from '../assets/perplexity-logo.svg';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isFuture(iso: string): boolean {
  return new Date(iso) > new Date();
}

// ─── Per-tool accent colours ──────────────────────────────────────────────────────
// Add an entry here whenever a new ToolName is introduced.

const TOOL_COLORS: Record<string, string> = {
  emily_ai:   'bg-violet-100 text-violet-700',
  perplexity: 'bg-sky-100 text-sky-700',
  other:      'bg-slate-100 text-slate-600',
};

function toolColorClass(tool: string): string {
  return TOOL_COLORS[tool] ?? TOOL_COLORS['other'];
}

// ─── Status badge config ──────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'default' | 'error';

const STATUS_CONFIG: Record<
  ToolAccess['status'],
  { label: string; variant: BadgeVariant }
> = {
  active:              { label: 'ACTIVE',               variant: 'success' },
  pending_activation:  { label: 'PENDING ACTIVATION',   variant: 'warning' },
  expired:             { label: 'EXPIRED',              variant: 'default' },
  revoked:             { label: 'ACCESS REVOKED',       variant: 'error'   },
};

// ─── Single tool row ──────────────────────────────────────────────────────────────

interface ToolAccessCardProps {
  item: ToolAccess;
}

const ToolAccessCard: React.FC<ToolAccessCardProps> = ({ item }) => {
  const {
    tool,
    displayName,
    status,
    notes,
    startsAt,
    endsAt,
    activationUrl,
    loginUrl,
  } = item;

  const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[status];
  const colorClass = toolColorClass(tool);

  // Derive the primary action for this tool
  const action: { label: string; url: string } | null =
    status === 'pending_activation' && activationUrl
      ? { label: 'Activate', url: activationUrl }
      : status === 'active' && loginUrl
      ? { label: 'Open', url: loginUrl }
      : null;

  // Derive which date line to show
  const dateLine: string | null =
    startsAt && isFuture(startsAt)
      ? `Starts on ${formatDate(startsAt)}`
      : endsAt
      ? `Valid until ${formatDate(endsAt)}`
      : null;

  const hasActionsBlock =
    action != null || status === 'active' || status === 'pending_activation';

  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-b-0">
      {/* Tool icon: branded logos for known tools, otherwise letter initial */}
      {tool === 'emily_ai' ? (
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white ring-1 ring-slate-200 overflow-hidden p-0.5"
          aria-hidden
        >
          <img src={emilyLogo} alt="" className="h-full w-full object-contain" />
        </div>
      ) : tool === 'perplexity' ? (
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white ring-1 ring-slate-200 overflow-hidden p-0.5"
          aria-hidden
        >
          <img src={perplexityLogo} alt="" className="h-full w-full object-contain" />
        </div>
      ) : (
        <div
          className={[
            'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
            colorClass,
          ].join(' ')}
          aria-hidden
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Center: meta stack (8px) + 12px + actions stack (8px) */}
      <div
        className={[
          'flex flex-1 min-w-0 flex-col',
          hasActionsBlock ? 'gap-3' : '',
        ].join(' ')}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-slate-900 text-sm leading-normal">{displayName}</span>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          {notes && (
            <p className="text-sm text-slate-500 leading-normal">{notes}</p>
          )}

          {dateLine && (
            <p className="text-sm text-slate-400 leading-normal">{dateLine}</p>
          )}

          {status === 'expired' && (
            <p className="text-sm italic text-slate-400 leading-normal">This benefit has expired.</p>
          )}
          {status === 'revoked' && (
            <p className="text-sm italic text-slate-400 leading-normal">This access has been revoked.</p>
          )}
        </div>

        {hasActionsBlock && (
          <div className="flex flex-col gap-2">
            {action && (
              <a
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  variant={status === 'pending_activation' ? 'primary' : 'outline'}
                  className="text-sm px-3 py-1.5 h-auto leading-normal"
                >
                  {action.label}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </a>
            )}

            {status === 'pending_activation' && (
              <p className="text-sm text-slate-400 leading-normal">
                Finish activation to get access.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ToolAccessList ───────────────────────────────────────────────────────────────

interface ToolAccessListProps {
  toolAccesses: ToolAccess[];
}

export const ToolAccessList: React.FC<ToolAccessListProps> = ({ toolAccesses }) => {
  return (
    <div>
      {/* Section header */}
      <h3 className="text-base font-medium text-slate-900 mb-4">
        What's included with your order
      </h3>

      {/* Empty state */}
      {toolAccesses.length === 0 && (
        <p className="text-sm text-slate-500">
          No additional items are included with this order.
        </p>
      )}

      {/* Tool rows */}
      {toolAccesses.length > 0 && (
        <div className="divide-y divide-slate-100 -mb-4">
          {toolAccesses.map((item) => (
            <ToolAccessCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
