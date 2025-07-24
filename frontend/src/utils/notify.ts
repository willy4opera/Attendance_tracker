import { toastSuccess, toastError, toastWarning, toastInfo } from './toastHelpers';

// Sweet Alert style confirmation dialog
interface ConfirmResult {
  isConfirmed: boolean;
  isDenied?: boolean;
  isDismissed?: boolean;
}

const confirmDialog = (title: string, message: string): Promise<ConfirmResult> => {
  return new Promise((resolve) => {
    if (window.confirm(`${title}\n\n${message}`)) {
      resolve({ isConfirmed: true, isDenied: false, isDismissed: false });
    } else {
      resolve({ isConfirmed: false, isDenied: false, isDismissed: true });
    }
  });
};

const notify = {
  toast: {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
  },
  alert: {
    confirm: confirmDialog,
    success: (title: string, message?: string) => {
      toastSuccess(message || title);
      return Promise.resolve({ isConfirmed: true });
    },
    error: (title: string, message?: string) => {
      toastError(message || title);
      return Promise.resolve({ isConfirmed: true });
    },
    warning: (title: string, message?: string) => {
      toastWarning(message || title);
      return Promise.resolve({ isConfirmed: true });
    },
    info: (title: string, message?: string) => {
      toastInfo(message || title);
      return Promise.resolve({ isConfirmed: true });
    }
  }
};

export default notify;
