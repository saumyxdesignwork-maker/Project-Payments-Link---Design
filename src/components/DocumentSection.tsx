/**
 * DocumentSection.tsx — Reusable document-list section for the order detail page.
 *
 * Renders a titled Card containing a list of individually-actionable documents
 * (receipts, invoices, refunds, or any future document type) with a consistent
 * layout and a graceful empty state.
 *
 * Usage:
 *   <DocumentSection
 *     title="Receipts"
 *     emptyText="No receipts yet."
 *     items={receiptsToItems(receipts)}
 *   />
 */

import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';
import { Badge } from './Badge';

// ─── Public types ─────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/** A single secondary line of metadata shown beneath the document title. */
export interface DocumentMetaLine {
  text: string;
  /** When true, renders in a monospace font (suitable for IDs and reference numbers). */
  mono?: boolean;
}

/** A clickable action attached to a single document row. */
export interface DocumentAction {
  label: string;
  href: string;
}

/** Normalised descriptor for one document row — domain-agnostic. */
export interface DocumentItem {
  id: string;
  /** Primary label shown as the row title, e.g. "Booking Receipt", "GST Invoice". */
  title: string;
  /** Optional secondary lines: date, document ID, reason, reference number, etc. */
  meta?: DocumentMetaLine[];
  /** Optional status badge. */
  badge?: { label: string; variant: BadgeVariant };
  /** Per-item actions, e.g. Download. Rendered as external links. */
  actions?: DocumentAction[];
}

export interface DocumentSectionProps {
  /** Section heading, e.g. "Receipts". */
  title: string;
  /** Normalised list of document rows to render. */
  items: DocumentItem[];
  /** Text shown when items is empty, e.g. "No receipts yet." */
  emptyText: string;
  /** Optional HTML id for in-page anchor scrolling. */
  sectionId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  items,
  emptyText,
  sectionId,
}) => {
  const content = (
    <Card className="p-5 sm:px-6 sm:py-4">
      <h3 className="mb-4 text-base font-medium text-text-primary">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyText}</p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-start justify-between gap-3 flex-wrap"
            >
              {/* Left: title + meta */}
              <div className="min-w-0">
                <p className="text-sm font-medium leading-normal text-text-primary">
                  {item.title}
                </p>
                {item.meta?.map((line, i) => (
                  <p
                    key={i}
                    className={
                      line.mono
                        ? 'mt-0.5 font-mono text-sm leading-normal text-text-muted'
                        : 'mt-0.5 text-xs leading-normal text-text-muted'
                    }
                  >
                    {line.text}
                  </p>
                ))}
              </div>

              {/* Right: badge + actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {item.badge && (
                  <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
                )}
                {item.actions?.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline leading-normal"
                  >
                    {action.label}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  if (sectionId) {
    return (
      <div id={sectionId} className="scroll-mt-24">
        {content}
      </div>
    );
  }

  return content;
};
