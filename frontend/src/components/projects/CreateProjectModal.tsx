import React, { useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { ProjectStatus, ProjectPriority } from '../../types'
import { notify } from '../../utils/notifications'
import { XMarkIcon } from '@heroicons/react/24/outline'
import theme from '../../config/theme'
import UserSelector from '../common/UserSelector'
import type { User } from '../../types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ProjectFormData {
  name: string
  code: string
  description: string
  projectManagerId: string
  departmentId: string
  startDate: string
  endDate: string
  budget: string
  status: ProjectStatus
  priority: ProjectPriority
  teamMembers: Array<{
    userId: number
    role: 'member' | 'lead' | 'viewer'
  }>
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    code: '',
    description: '',
    projectManagerId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    teamMembers: []
  })
  const [selectedProjectManager, setSelectedProjectManager] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createProject } = useProjects()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Transform form data to match backend expectations
      const projectData: any = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        teamMembers: formData.teamMembers.length > 0 ? formData.teamMembers : undefined,
        // Store priority in metadata as custom field
        metadata: {
          customFields: {
            priority: formData.priority
          }
        }
      }

      // Only add projectManagerId if it's a valid number
      if (formData.projectManagerId && !isNaN(parseInt(formData.projectManagerId))) {
        projectData.projectManagerId = parseInt(formData.projectManagerId)
      }

      // Only add departmentId if it's a valid number
      if (formData.departmentId && !isNaN(parseInt(formData.departmentId))) {
        projectData.departmentId = parseInt(formData.departmentId)
      }

      console.log('Creating project with data:', projectData)

      const result = await createProject(projectData)
      if (result) {
        notify.toast.success('Project created successfully!')
        onSuccess()
        // Reset form
        setFormData({
          name: '',
          code: '',
          description: '',
          projectManagerId: '',
          departmentId: '',
          startDate: '',
          endDate: '',
          budget: '',
          status: ProjectStatus.PLANNING,
          priority: ProjectPriority.MEDIUM,
          teamMembers: []
        })
        setSelectedProjectManager(null)
      } else {
        notify.toast.error('Failed to create project.')
      }
    } catch (error) {
      console.error('Create project error:', error)
      notify.toast.error('Failed to create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProjectManagerChange = (userId: string, user?: User) => {
    setFormData(prev => ({
      ...prev,
      projectManagerId: userId
    }))
    setSelectedProjectManager(user || null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Grid Layout - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                  placeholder="Enter project name"
                />
              </div>

              {/* Project Code */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Project Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                  placeholder="Enter project code (max 20 chars)"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                >
                  <option value={ProjectStatus.PLANNING}>Planning</option>
                  <option value={ProjectStatus.ACTIVE}>Active</option>
                  <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                  <option value={ProjectStatus.COMPLETED}>Completed</option>
                  <option value={ProjectStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                >
                  <option value={ProjectPriority.LOW}>Low</option>
                  <option value={ProjectPriority.MEDIUM}>Medium</option>
                  <option value={ProjectPriority.HIGH}>High</option>
                  <option value={ProjectPriority.URGENT}>Urgent</option>
                </select>
              </div>

              {/* Department ID */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Department (Optional)
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                >
                  <option value="">Select Department (Optional)</option>
                  <option value="2">Engineering Department</option>
                  <option value="3">Human Resources</option>
                </select>
              </div>

              {/* Project Manager */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Project Manager (Optional)
                </label>
                <UserSelector
                  value={formData.projectManagerId}
                  onChange={handleProjectManagerChange}
                  placeholder="Select project manager..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Budget
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                  placeholder="Enter budget amount"
                />
              </div>

              {/* Description - spans 3 rows */}
              <div className="md:row-span-3">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ 
                    borderColor: theme.colors.primary + '40',
                    focusRingColor: theme.colors.primary 
                  } as any}
                  placeholder="Enter project description..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{ borderColor: theme.colors.primary + '40' } as any}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium border border-transparent rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: theme.colors.secondary,
                borderColor: theme.colors.primary + '40'
              } as any}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal
