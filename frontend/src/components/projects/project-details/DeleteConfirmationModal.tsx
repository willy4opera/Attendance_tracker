import React from 'react'
import theme from '../../../config/theme'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, projectName }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
          Delete Project
        </h3>
        <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
          Are you sure you want to delete "{projectName}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.background.default,
              color: theme.colors.text.primary
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.error,
              color: '#ffffff'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
