// Re-export all toast functions from toastHelpers
export * from './toastHelpers';

// Also create a showToast object for backward compatibility
import { toastSuccess, toastError, toastWarning, toastInfo, toastLoading, toastPromise, dismissToast } from './toastHelpers';

export const showToast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  dismiss: dismissToast
};
