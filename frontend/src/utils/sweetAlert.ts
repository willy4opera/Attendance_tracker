import Swal from 'sweetalert2'
import theme from '../config/theme'
import { toastSuccess, toastError, toastWarning, toastInfo } from './toastHelpers'

// Types for SweetAlert
type SweetAlertOptions = Parameters<typeof Swal.fire>[0]
type SweetAlertResult = ReturnType<typeof Swal.fire> extends Promise<infer U> ? U : never

// Default configuration for SweetAlert
const defaultConfig: SweetAlertOptions = {
  customClass: {
    popup: 'rounded-lg',
    title: 'text-lg font-semibold',
    htmlContainer: 'text-sm',
    confirmButton: 'px-4 py-2 rounded-md text-white font-medium',
    cancelButton: 'px-4 py-2 rounded-md text-gray-700 font-medium border border-gray-300',
  },
  confirmButtonColor: theme.colors.primary,
  cancelButtonColor: theme.colors.secondary,
  focusConfirm: false,
  reverseButtons: true,
}

// Success alert
export const alertSuccess = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    icon: 'success',
    confirmButtonColor: theme.colors.success,
    timer: options?.timer || 3000,
    showConfirmButton: options?.showConfirmButton !== false,
  })
}

// Error alert
export const alertError = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    icon: 'error',
    confirmButtonColor: theme.colors.error,
    showConfirmButton: options?.showConfirmButton !== false,
  })
}

// Warning alert
export const alertWarning = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    icon: 'warning',
    confirmButtonColor: theme.colors.warning,
    showConfirmButton: options?.showConfirmButton !== false,
  })
}

// Info alert
export const alertInfo = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    icon: 'info',
    confirmButtonColor: theme.colors.info,
    showConfirmButton: options?.showConfirmButton !== false,
  })
}

// Confirmation dialog
export const confirmDialog = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || 'Yes',
    cancelButtonText: options?.cancelButtonText || 'Cancel',
    confirmButtonColor: theme.colors.primary,
  })
}

// Delete confirmation
export const confirmDelete = (
  itemName: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title: `Delete ${itemName}?`,
    text: options?.text || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: theme.colors.error,
    dangerMode: true,
  })
}

// Input dialog
export const inputDialog = (
  title: string,
  inputPlaceholder?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
  return Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    input: 'text',
    inputPlaceholder: inputPlaceholder || 'Enter value...',
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || 'Submit',
    cancelButtonText: options?.cancelButtonText || 'Cancel',
    inputValidator: (value) => {
      if (!value && options?.inputValidator) {
        return options.inputValidator(value)
      }
      if (!value) {
        return 'Please enter a value'
      }
      return null
    },
  })
}

// Loading dialog
export const loadingDialog = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
): void => {
  Swal.fire({
    ...defaultConfig,
    ...options,
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

// Close loading dialog
export const closeLoadingDialog = (): void => {
  Swal.close()
}

// Custom toast-like notification using SweetAlert
export const toastAlert = (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info',
  position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end'
): void => {
  const Toast = Swal.mixin({
    toast: true,
    position: position || 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
  })

  Toast.fire({
    icon,
    title,
  })
}

// Hybrid approach: Use SweetAlert for user actions, show toast for feedback
export const actionWithFeedback = async (
  confirmTitle: string,
  confirmText: string,
  action: () => Promise<void>,
  successMessage: string,
  errorMessage?: string
): Promise<boolean> => {
  try {
    const result = await confirmDialog(confirmTitle, confirmText)
    
    if (result.isConfirmed) {
      await action()
      toastSuccess(successMessage)
      return true
    }
    return false
  } catch (error) {
    console.error('Action failed:', error)
    toastError(errorMessage || 'Operation failed. Please try again.')
    return false
  }
}

// Delete action with feedback
export const deleteWithFeedback = async (
  itemName: string,
  deleteAction: () => Promise<void>,
  successMessage?: string,
  errorMessage?: string
): Promise<boolean> => {
  try {
    const result = await confirmDelete(itemName)
    
    if (result.isConfirmed) {
      await deleteAction()
      toastSuccess(successMessage || `${itemName} deleted successfully`)
      return true
    }
    return false
  } catch (error) {
    console.error('Delete failed:', error)
    toastError(errorMessage || `Failed to delete ${itemName.toLowerCase()}. Please try again.`)
    return false
  }
}

// Form submission with loading and feedback
export const submitFormWithFeedback = async (
  submitAction: () => Promise<void>,
  loadingTitle: string,
  successMessage: string,
  errorMessage?: string
): Promise<boolean> => {
  try {
    loadingDialog(loadingTitle, 'Please wait...')
    await submitAction()
    closeLoadingDialog()
    toastSuccess(successMessage)
    return true
  } catch (error) {
    closeLoadingDialog()
    console.error('Form submission failed:', error)
    toastError(errorMessage || 'Submission failed. Please try again.')
    return false
  }
}

// Batch operations
export const batchOperationWithFeedback = async (
  title: string,
  items: any[],
  operation: (item: any) => Promise<void>,
  successMessage: string,
  errorMessage?: string
): Promise<boolean> => {
  try {
    const result = await confirmDialog(
      title,
      `This will affect ${items.length} items. Are you sure you want to continue?`
    )
    
    if (result.isConfirmed) {
      loadingDialog('Processing', `Processing ${items.length} items...`)
      
      for (const item of items) {
        await operation(item)
      }
      
      closeLoadingDialog()
      toastSuccess(successMessage)
      return true
    }
    return false
  } catch (error) {
    closeLoadingDialog()
    console.error('Batch operation failed:', error)
    toastError(errorMessage || 'Operation failed. Please try again.')
    return false
  }
}

// Export all functions as a single object for convenience
export const swal = {
  success: alertSuccess,
  error: alertError,
  warning: alertWarning,
  info: alertInfo,
  confirm: confirmDialog,
  confirmDelete,
  input: inputDialog,
  loading: loadingDialog,
  closeLoading: closeLoadingDialog,
  toast: toastAlert,
  actionWithFeedback,
  deleteWithFeedback,
  submitFormWithFeedback,
  batchOperationWithFeedback,
}

export default swal
