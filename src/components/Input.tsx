import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  error, 
  className,
  id,
  ...props 
}, ref) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="block text-sm font-normal text-text-secondary leading-snug">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            "block w-full rounded-lg border border-border bg-surface-card px-3 py-2.5 text-text-primary shadow-sm placeholder:text-text-muted focus:border-primary focus:ring-primary sm:text-sm",
            error && "border-status-error-border text-status-error-text placeholder:text-status-error-text/70 focus:border-status-error-solid focus:ring-status-error-solid",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-status-error-text animate-fadeIn">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
