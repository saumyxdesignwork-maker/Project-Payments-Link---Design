import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...rest }) => {
  return (
    <div
      className={twMerge("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}
      {...rest}
    >
      {children}
    </div>
  );
};
