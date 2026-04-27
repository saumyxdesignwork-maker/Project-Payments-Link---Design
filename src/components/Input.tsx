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
        <label htmlFor={inputId} className="block text-sm font-normal text-slate-700 leading-snug">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            "block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 border bg-white text-slate-900 placeholder-slate-400",
            error && "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

