import React, { useState, useEffect } from 'react'
import { AiOutlineClose } from 'react-icons/ai'
import api from '../../services/api'
import type { Department } from "../../types"
import notify from '../../utils/notifications'
import theme from '../../config/theme'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: 'admin' | 'moderator' | 'user'
  department?: {
    id: number
    name: string
    code: string
  }
  isActive: boolean
  isEmailVerified: boolean
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
  departments: Department[]
}

export default function EditUserModal({ user, onClose, onSuccess, departments }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    departmentId: user.department?.id?.toString() || '',
    isActive: user.isActive,
    password: '',
    passwordConfirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password if changing
    if (showPasswordFields) {
      if (formData.password !== formData.passwordConfirm) {
        notify.toast.error('Passwords do not match')
        return
      }

      if (formData.password.length < 6) {
        notify.toast.error('Password must be at least 6 characters')
        return
      }
    }

    const success = await notify.actions.submitFormWithFeedback(
      async () => {
        const dataToSend: any = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || null,
          role: formData.role,
          departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
          isActive: formData.isActive
        }

        // Only include password if changing
        if (showPasswordFields && formData.password) {
          dataToSend.password = formData.password
        }

        await api.put(`/users/${user.id}`, dataToSend)
      },
      'Updating User',
      'User updated successfully',
      'Failed to update user'
    )

    if (success) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-3 sm:p-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.colors.secondary }}>
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                style={{ borderColor: theme.colors.primary }}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                style={{ borderColor: theme.colors.primary }}
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
              style={{ borderColor: theme.colors.primary }}
              placeholder="Enter email address"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
              style={{ borderColor: theme.colors.primary }}
              placeholder="Enter phone number"
            />
          </div>

          {/* Role and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                style={{ borderColor: theme.colors.primary }}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                style={{ borderColor: theme.colors.primary }}
              >
                <option value="">No Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                User is active
              </span>
            </label>
          </div>

          {/* Password Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                Password
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {showPasswordFields && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                      New Password *
                    </label>
                    <input
                      type="password"
                      required={showPasswordFields}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                      style={{ borderColor: theme.colors.primary }}
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required={showPasswordFields}
                      value={formData.passwordConfirm}
                      onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                      style={{ borderColor: theme.colors.primary }}
                      minLength={6}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              style={{ borderColor: theme.colors.primary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 text-sm sm:text-base"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary
              }}
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
