import React from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error:   'bg-red-100 text-red-800',
  info:    'bg-blue-100 text-blue-800',
};

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => {
  return (
    <span className={twMerge(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs",
      variant === 'default' || variant === 'warning' || variant === 'success'
        ? 'font-normal'
        : 'font-medium',
      VARIANT_STYLES[variant],
      className
    )}>
      {children}
    </span>
  );
};

