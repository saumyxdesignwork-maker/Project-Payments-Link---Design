import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'inverse' | 'skeleton';
}

const VARIANT_STYLES: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'section-card',
  subtle: 'section-card-subtle',
  inverse: 'section-card-inverse',
  skeleton: 'skeleton-card',
};

export const Card: React.FC<CardProps> = ({ children, className, variant = 'default', ...rest }) => {
  return (
    <div
      className={twMerge(VARIANT_STYLES[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
};
