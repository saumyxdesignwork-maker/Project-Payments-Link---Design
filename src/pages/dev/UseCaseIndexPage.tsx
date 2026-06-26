/**
 * UseCaseIndexPage.tsx  —  Development-only Use Case Index
 *
 * Route: /dev/use-cases  (registered only when import.meta.env.DEV === true)
 *
 * A living catalog of every learner/payment scenario this app models.
 * Each row links directly to a route and, where store state is needed,
 * offers an "Apply preset & open" button that seeds Zustand then navigates.
 *
 * This page is intentionally stripped of the app shell (no PaymentLinkFooter etc.)
 * so QA can reach it even when store state is incomplete.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BoltIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { USE_CASE_CATALOG, UC_SECTIONS } from '../../dev/useCaseCatalog';
import type { UseCase, UcSection } from '../../dev/useCaseCatalog';

// ─── Section color accents (one per UcSection) ──────────────────────────────

const SECTION_COLORS: Record<UcSection, { badge: string; ring: string; dot: string }> = {
  'Checkout': {
    badge: 'bg-violet-100 text-violet-700',
    ring: 'border-violet-200',
    dot: 'bg-violet-500',
  },
  'Post-payment': {
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'Enrollment Wizard': {
    badge: 'bg-sky-100 text-sky-700',
    ring: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  'Order Portal': {
    badge: 'bg-amber-100 text-amber-700',
    ring: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

// ─── Single use-case card ────────────────────────────────────────────────────

interface UcCardProps {
  uc: UseCase;
  index: number;
}

const UcCard: React.FC<UcCardProps> = ({ uc, index }) => {
  const navigate = useNavigate();
  const [launched, setLaunched] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const colors = SECTION_COLORS[uc.section];

  const handlePreset = () => {
    if (!uc.applyPreset) return;
    uc.applyPreset(navigate);
    setLaunched(true);
    setTimeout(() => setLaunched(false), 2000);
  };

  return (
    <div
      id={uc.id}
      className={[
        'bg-white rounded-xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden',
        colors.ring,
      ].join(' ')}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Index number + dot */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
          <span className="text-xs font-mono text-slate-400 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* ID badge + title */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-[11px] text-slate-400 select-all">{uc.id}</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
              {uc.section}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">{uc.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{uc.description}</p>
        </div>
      </div>

      {/* Notes accordion */}
      {uc.notes && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className="flex items-center gap-1.5 w-full px-5 py-2.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors text-left"
          >
            <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Mock limitation / note</span>
            <ChevronDownIcon
              className={['h-3 w-3 ml-auto transition-transform', notesOpen ? 'rotate-180' : ''].join(' ')}
            />
          </button>
          {notesOpen && (
            <div className="px-5 pb-3 pt-1">
              <p className="text-xs text-amber-800 leading-relaxed bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                {uc.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions footer */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 bg-slate-50/60">
        {/* Direct link — always shown */}
        <Link
          to={uc.primaryRoute}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white rounded-lg px-3 py-1.5 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          Open route
          <span className="font-mono text-slate-400">{uc.primaryRoute}</span>
        </Link>

        {/* Preset + navigate — only when applyPreset is defined */}
        {uc.applyPreset && (
          <button
            onClick={handlePreset}
            className={[
              'inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all',
              launched
                ? 'bg-emerald-500 text-white border border-emerald-500'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary',
            ].join(' ')}
          >
            {launched ? (
              <>
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Preset applied!
              </>
            ) : (
              <>
                <BoltIcon className="h-3.5 w-3.5" />
                Apply preset &amp; open
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Section group ────────────────────────────────────────────────────────────

interface SectionGroupProps {
  section: UcSection;
  cases: UseCase[];
}

const SectionGroup: React.FC<SectionGroupProps> = ({ section, cases }) => {
  const colors = SECTION_COLORS[section];
  return (
    <section id={`section-${section.toLowerCase().replace(/\s+/g, '-')}`} className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${colors.dot}`} />
        <h2 className="text-base font-semibold text-slate-900">{section}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
          {cases.length} scenario{cases.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {cases.map((uc, i) => (
          <UcCard key={uc.id} uc={uc} index={i} />
        ))}
      </div>
    </section>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const UseCaseIndexPage: React.FC = () => {
  const [filter, setFilter] = useState('');
  const query = filter.toLowerCase().trim();

  const filteredCatalog = query
    ? USE_CASE_CATALOG.filter(
        (uc) =>
          uc.id.toLowerCase().includes(query) ||
          uc.title.toLowerCase().includes(query) ||
          uc.description.toLowerCase().includes(query) ||
          uc.section.toLowerCase().includes(query),
      )
    : USE_CASE_CATALOG;

  // Group filtered results by section preserving original order
  const grouped = UC_SECTIONS.map((section) => ({
    section,
    cases: filteredCatalog.filter((uc) => uc.section === section),
  })).filter((g) => g.cases.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dev-only header banner */}
      <div className="bg-brand-hero text-white/80 text-xs text-center py-2 font-mono tracking-wide">
        🔬 DEV ONLY — Use Case Index — not visible in production builds
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BeakerIcon className="h-6 w-6 text-slate-500" />
            <h1 className="text-2xl font-semibold text-slate-900">Use Case Index</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every learner and payment scenario this app models — with direct route links and store presets for instant QA access.
          </p>
        </div>

        {/* How-to note */}
        <div className="flex gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-6">
          <InformationCircleIcon className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sky-800 leading-relaxed">
            <strong>Open route</strong> — navigates directly without changing the store (useful when the route has its own mock data, like portal orders).{' '}
            <strong>Apply preset &amp; open</strong> — seeds Zustand with the right payment mode, country, and email, then navigates so pages that read from the store render correctly.
          </p>
        </div>

        {/* Section jump links */}
        <div className="flex flex-wrap gap-2 mb-6">
          {UC_SECTIONS.map((section) => {
            const colors = SECTION_COLORS[section];
            const count = USE_CASE_CATALOG.filter((uc) => uc.section === section).length;
            return (
              <a
                key={section}
                href={`#section-${section.toLowerCase().replace(/\s+/g, '-')}`}
                className={[
                  'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80',
                  colors.badge,
                  colors.ring,
                ].join(' ')}
              >
                {section}
                <span className="ml-1.5 opacity-60">{count}</span>
              </a>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by ID, title, section…"
            className="w-full text-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-8 text-xs text-slate-400">
          <span>
            {filteredCatalog.length} / {USE_CASE_CATALOG.length} scenarios
          </span>
          {USE_CASE_CATALOG.filter((uc) => uc.applyPreset).length > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <BoltIcon className="h-3 w-3 text-primary" />
                {USE_CASE_CATALOG.filter((uc) => uc.applyPreset).length} have presets
              </span>
            </>
          )}
        </div>

        {/* Sections */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No use cases match "<span className="font-mono">{filter}</span>".
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(({ section, cases }) => (
              <SectionGroup key={section} section={section} cases={cases} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
          <p>
            Add or update entries in{' '}
            <code className="font-mono bg-slate-100 px-1 rounded">src/dev/useCaseCatalog.ts</code>
          </p>
          <p>This route is only registered when <code className="font-mono bg-slate-100 px-1 rounded">import.meta.env.DEV</code> is true.</p>
        </div>
      </div>
    </div>
  );
};
