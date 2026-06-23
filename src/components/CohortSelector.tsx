/**
 * CohortSelector.tsx
 *
 * A reusable cohort (batch) date dropdown, extracted from the Details page so
 * it can be shared with the portal's batch-change flow without duplication.
 *
 * Renders:
 *   - A styled <select> listing cohort start dates
 *   - Helper text below: schedule, relative days ("in 5 days"), low-seat warning
 */

import React from 'react';
import type { Cohort } from '../data/paymentLink';
import { formatCohortDate, getCohortRelativeDays } from '../utils/formatters';

export interface CohortSelectorProps {
  /** The currently selected cohort id */
  value: string;
  onChange: (id: string) => void;
  cohorts: Cohort[];
  /** When true, the <select> is grayed out and non-interactive */
  disabled?: boolean;
}

export const CohortSelector: React.FC<CohortSelectorProps> = ({
  value,
  onChange,
  cohorts,
  disabled = false,
}) => {
  const selectedCohort = cohorts.find((c) => c.id === value);

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-4 pr-10 border bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 1rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        {cohorts.map((cohort) => (
          <option key={cohort.id} value={cohort.id}>
            {formatCohortDate(cohort.startDate)}
          </option>
        ))}
      </select>

      {selectedCohort && (
        <div className="text-sm text-slate-500 px-1">
          <span>{selectedCohort.schedule}</span>
          {(() => {
            const hint = getCohortRelativeDays(selectedCohort.startDate);
            return hint ? (
              <span className="ml-2 text-slate-400">({hint})</span>
            ) : null;
          })()}
          {selectedCohort.seatsLeft !== undefined && selectedCohort.seatsLeft < 20 && (
            <span className="ml-2 text-amber-700">
              · {selectedCohort.seatsLeft} spots left
            </span>
          )}
        </div>
      )}
    </div>
  );
};
