/**
 * SuccessToast.tsx
 *
 * A fixed notification bar that slides in from the top, stays for `duration`ms,
 * then fades out. Rendered at the top of the viewport, below the sticky header.
 *
 * Usage:
 *   const [toast, setToast] = useState(false);
 *   <SuccessToast show={toast} message="Batch updated successfully" onDone={() => setToast(false)} />
 */

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface SuccessToastProps {
  show: boolean;
  message: string;
  /** How long (ms) to stay visible before fading. Default: 3500 */
  duration?: number;
  /** Called after the toast has fully faded out */
  onDone: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  show,
  message,
  duration = 3500,
  onDone,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    // Trigger enter transition on next tick
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Start fade-out before calling onDone
    const exitTimer = setTimeout(() => setVisible(false), duration);

    // Remove from DOM after fade-out completes (300 ms transition)
    const doneTimer = setTimeout(() => onDone(), duration + 300);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;

  return (
    <div
      className={[
        'fixed top-16 left-1/2 -translate-x-1/2 z-[60]',
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-3' : 'opacity-0 -translate-y-1',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
        <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
        {message}
      </div>
    </div>
  );
};
