import type { Order } from '../types/order';

/**
 * Derives a human-readable access status and visual type for an order.
 * Kept in a standalone utility file so it can be imported by both
 * GetAccessPage and AccessDetailPage without breaking Vite Fast Refresh
 * (which requires component files to export only React components).
 */
export function getAccessStatus(order: Order): {
  label: string;
  detail: string;
  type: 'action' | 'info' | 'success';
  actionKind?: 'nsdc' | 'email';
} {
  const { nsdcRequired, nsdcCompleted, lmsEnrollmentStatus, emailConfirmed } = order;

  if (nsdcRequired) {
    if (!nsdcCompleted && order.nsdcRetroactiveCollectionRequired) {
      return {
        label: 'NSDC Registration required',
        detail: 'Complete NSDC registration to stay compliant with certification rules.',
        type: 'action',
        actionKind: 'nsdc',
      };
    }
    if (!nsdcCompleted) {
      return {
        label: 'NSDC Registration required',
        detail: 'Complete NSDC registration to unlock full access.',
        type: 'action',
        actionKind: 'nsdc',
      };
    }
    if (lmsEnrollmentStatus === 'real') {
      return {
        label: 'Access active',
        detail: 'Full access active.',
        type: 'success',
      };
    }
    return {
      label: 'Partial access',
      detail: 'Temporary access active. Full access unlocks after NSDC registration and full payment.',
      type: 'info',
    };
  }

  if (!emailConfirmed) {
    return {
      label: 'Confirm email',
      detail: 'Confirm your email to activate access.',
      type: 'action',
      actionKind: 'email',
    };
  }
  return {
    label: 'Access active',
    detail: 'Your access is ready.',
    type: 'success',
  };
}
