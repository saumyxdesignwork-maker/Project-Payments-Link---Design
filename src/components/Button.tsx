import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'ghost' | 'inverse';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className,
  ...props 
}) => {
  const baseStyles = "inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
    secondary: "bg-text-primary text-white hover:bg-text-secondary focus:ring-border-strong",
    outline: "border border-border bg-transparent text-text-secondary hover:bg-surface-subtle focus:ring-border-strong",
    success: "bg-status-success-solid text-white hover:bg-green-600 focus:ring-status-success-solid",
    warning: "bg-status-warning-solid text-slate-900 hover:bg-amber-400 focus:ring-status-warning-solid",
    ghost: "bg-transparent text-primary hover:bg-primary-light focus:ring-primary",
    inverse: "bg-surface-card/10 text-text-inverse border border-white/15 hover:bg-surface-card/20 focus:ring-white/40"
  };

  return (
    <button
      className={twMerge(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
