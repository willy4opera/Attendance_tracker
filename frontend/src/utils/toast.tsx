export { 
  toastSuccess, 
  toastError, 
  toastWarning, 
  toastInfo, 
  toastLoading, 
  toastPromise,
  dismissToast 
} from './toastHelpers'

// Create showToast object for backward compatibility
import { toastSuccess, toastError, toastWarning, toastInfo } from './toastHelpers'

export const showToast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo
}
