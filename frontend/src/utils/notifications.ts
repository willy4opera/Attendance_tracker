// Unified notification system with clear usage guidelines:
// - SweetAlert for interactions requiring user decisions
// - Toast for notifications that don't require further input

import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastPromise,
  dismissToast,
} from './toastHelpers'

import {
  alertSuccess,
  alertError,
  alertWarning,
  alertInfo,
  confirmDialog,
  confirmDelete,
  inputDialog,
  loadingDialog,
  closeLoadingDialog,
  actionWithFeedback,
  deleteWithFeedback,
  submitFormWithFeedback,
  batchOperationWithFeedback,
} from './sweetAlert'

// TOAST NOTIFICATIONS - For operations that don't require further input
export const toast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  dismiss: dismissToast,
}

// SWEETALERT DIALOGS - For interactions requiring user decisions
export const alert = {
  success: alertSuccess,
  error: alertError,
  warning: alertWarning,
  info: alertInfo,
  confirm: confirmDialog,
  confirmDelete,
  input: inputDialog,
  loading: loadingDialog,
  closeLoading: closeLoadingDialog,
}

// HYBRID ACTIONS - SweetAlert for confirmation + toast for feedback
export const actions = {
  actionWithFeedback,
  deleteWithFeedback,
  submitFormWithFeedback,
  batchOperationWithFeedback,
}

// Main notification object
export const notify = {
  toast,
  alert,
  actions,
}

// Usage guidelines:
/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE TOAST for notifications that DON'T require further input:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Operation results:
   toast.success('Data saved successfully!')
   toast.error('Failed to load data')
   toast.warning('Connection unstable')

✅ API responses:
   toast.success('User created successfully')
   toast.error('Network error occurred')

✅ Status updates:
   toast.info('Sync in progress...')
   toast.warning('Session expires in 5 minutes')

✅ Form validation feedback:
   toast.error('Please fill in all required fields')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE SWEETALERT for interactions that REQUIRE user decisions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Confirmations:
   const result = await alert.confirm('Delete Item?', 'This cannot be undone.')
   if (result.isConfirmed) { ... }

✅ Destructive actions:
   const result = await alert.confirmDelete('User')
   if (result.isConfirmed) { ... }

✅ Input required:
   const result = await alert.input('Enter new name:', 'Name')
   if (result.isConfirmed && result.value) { ... }

✅ Important information requiring acknowledgment:
   await alert.warning('Important!', 'Please review the changes before proceeding.')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE HYBRID ACTIONS for common patterns:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Delete operations (SweetAlert confirm + toast feedback):
   await actions.deleteWithFeedback('User', deleteUser, 'User deleted successfully')

✅ Form submissions (SweetAlert loading + toast feedback):
   await actions.submitFormWithFeedback(submitForm, 'Saving...', 'Form submitted successfully')

✅ Batch operations (SweetAlert confirm + toast feedback):
   await actions.batchOperationWithFeedback('Delete Users', users, deleteUser, 'Users deleted')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXAMPLES IN CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// API call result (no decision needed)
try {
  const data = await api.getUsers()
  toast.success('Users loaded successfully')
} catch (error) {
  toast.error('Failed to load users')
}

// Delete action (decision needed)
const handleDelete = async (userId: string) => {
  const result = await alert.confirmDelete('User')
  if (result.isConfirmed) {
    try {
      await api.deleteUser(userId)
      toast.success('User deleted successfully')
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }
}

// Form submission (decision + feedback)
const handleSubmit = async (formData: FormData) => {
  await actions.submitFormWithFeedback(
    () => api.createUser(formData),
    'Creating user...',
    'User created successfully'
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

export default notify
