import React, { useState } from 'react'
import { AiOutlineClose } from 'react-icons/ai'
import api from '../../services/api'
import { toastSuccess, toastError } from '../../utils/toastHelpers'
import theme from '../../config/theme'

interface CreateUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'user',
    departmentId: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.passwordConfirm) {
      toastError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toastError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const dataToSend = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
      }
      delete dataToSend.passwordConfirm

      await api.post('/users', dataToSend)
      toastSuccess('User created successfully')
      onSuccess()
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.secondary }}>
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: theme.colors.primary }}
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: theme.colors.primary }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: theme.colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: theme.colors.primary }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: theme.colors.primary }}
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: theme.colors.primary }}
                minLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: theme.colors.primary }}
              >
                <option value="">No Department</option>
                {/* Department options would be loaded dynamically */}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              style={{ borderColor: theme.colors.primary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary
              }}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
