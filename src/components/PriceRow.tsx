import React from 'react';
import { clsx } from 'clsx';
import { formatINR } from '../utils/formatters';

interface PriceRowProps {
  label: string;
  amount: number | string;
  isTotal?: boolean;
  className?: string;
  subtext?: string;
}

export const PriceRow: React.FC<PriceRowProps> = ({ 
  label, 
  amount, 
  isTotal = false, 
  className,
  subtext
}) => {
  return (
    <div className={clsx("flex justify-between items-start py-2", className)}>
      <div className="flex flex-col">
        <span className={clsx(
          "text-slate-600",
          isTotal && "text-slate-900 font-normal text-sm"
        )}>
          {label}
        </span>
        {subtext && <span className="text-xs text-slate-500 mt-0.5">{subtext}</span>}
      </div>
      <span className={clsx(
        isTotal ? "text-slate-900 font-medium text-base" : "text-slate-900 font-normal"
      )}>
        {typeof amount === 'number' ? formatINR(amount) : amount}
      </span>
    </div>
  );
};

