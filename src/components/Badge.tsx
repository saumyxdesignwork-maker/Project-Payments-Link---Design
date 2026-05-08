import React from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-surface-subtle text-text-secondary',
  success: 'bg-status-success-bg text-status-success-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  error:   'bg-status-error-bg text-status-error-text',
  info:    'bg-status-info-bg text-status-info-text',
};

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => {
  return (
    <span className={twMerge(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border border-transparent",
      variant === 'default' || variant === 'warning' || variant === 'success'
        ? 'font-normal'
        : 'font-medium',
      variant === 'success' && 'border-status-success-border',
      variant === 'warning' && 'border-status-warning-border',
      variant === 'error' && 'border-status-error-border',
      variant === 'info' && 'border-status-info-border',
      variant === 'default' && 'border-border-subtle',
      VARIANT_STYLES[variant],
      className
    )}>
      {children}
    </span>
  );
};
