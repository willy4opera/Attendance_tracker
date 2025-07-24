import toast from 'react-hot-toast'
import theme from '../config/theme'
import { isInPopup } from './isInPopup'

export const toastDefaultOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    borderRadius: '8px',
    padding: '16px',
    fontSize: '14px',
  },
}

export const toastSuccess = (message: string, options?: Record<string, unknown>) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Success (suppressed in popup):', message);
    return;
  }
  
  toast.success(message, {
    ...toastDefaultOptions,
    ...options,
    style: {
      ...toastDefaultOptions.style,
      background: theme.colors.success,
      color: 'white',
    },
    iconTheme: {
      primary: 'white',
      secondary: theme.colors.success,
    },
  })
}

export const toastError = (message: string, options?: Record<string, unknown>) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Error (suppressed in popup):', message);
    return;
  }
  
  toast.error(message, {
    ...toastDefaultOptions,
    ...options,
    duration: 6000,
    style: {
      ...toastDefaultOptions.style,
      background: theme.colors.error,
      color: 'white',
    },
    iconTheme: {
      primary: 'white',
      secondary: theme.colors.error,
    },
  })
}

export const toastWarning = (message: string, options?: Record<string, unknown>) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Warning (suppressed in popup):', message);
    return;
  }
  
  toast(message, {
    ...toastDefaultOptions,
    ...options,
    style: {
      ...toastDefaultOptions.style,
      background: theme.colors.warning,
      color: 'white',
    },
    icon: '⚠️',
  })
}

export const toastInfo = (message: string, options?: Record<string, unknown>) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Info (suppressed in popup):', message);
    return;
  }
  
  toast(message, {
    ...toastDefaultOptions,
    ...options,
    style: {
      ...toastDefaultOptions.style,
      background: theme.colors.info,
      color: 'white',
    },
    icon: 'ℹ️',
  })
}

export const toastLoading = (message: string, options?: Record<string, unknown>) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Loading (suppressed in popup):', message);
    return null;
  }
  
  return toast.loading(message, {
    ...toastDefaultOptions,
    ...options,
    style: {
      ...toastDefaultOptions.style,
      background: theme.colors.secondary,
      color: theme.colors.primary,
    },
  })
}

export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: Error) => string)
  },
  options?: Record<string, unknown>
) => {
  // Don't show toast in popup windows
  if (isInPopup()) {
    console.log('[Toast] Promise (suppressed in popup):', messages);
    return promise;
  }
  
  return toast.promise(
    promise,
    messages,
    {
      ...toastDefaultOptions,
      ...options,
      success: {
        style: {
          ...toastDefaultOptions.style,
          background: theme.colors.success,
          color: 'white',
        },
        iconTheme: {
          primary: 'white',
          secondary: theme.colors.success,
        },
      },
      error: {
        style: {
          ...toastDefaultOptions.style,
          background: theme.colors.error,
          color: 'white',
        },
        iconTheme: {
          primary: 'white',
          secondary: theme.colors.error,
        },
      },
      loading: {
        style: {
          ...toastDefaultOptions.style,
          background: theme.colors.secondary,
          color: theme.colors.primary,
        },
      },
    }
  )
}

export const dismissToast = (toastId?: string) => {
  // Don't try to dismiss if in popup (nothing to dismiss)
  if (isInPopup()) {
    return;
  }
  
  if (toastId) {
    toast.dismiss(toastId)
  } else {
    toast.dismiss()
  }
}

// Aliases for backward compatibility
export const showErrorToast = toastError
export const showSuccessToast = toastSuccess
export const showWarningToast = toastWarning
export const showInfoToast = toastInfo

// Generic toast function for backward compatibility
export const showToast = toastInfo
