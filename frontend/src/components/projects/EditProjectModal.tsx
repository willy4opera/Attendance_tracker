import React, { useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import type { UpdateProjectDto, Project } from '../../types'
import { ProjectForm } from './ProjectForm'
import { notify } from '../../utils/notifications'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  project: Project
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateProject } = useProjects()

  const handleSubmit = async (data: UpdateProjectDto) => {
    setIsSubmitting(true)

    try {
      const result = await updateProject(project.id, data)
      if (result) {
        notify.toast.success('Project updated successfully!')
        onSuccess()
      } else {
        notify.toast.error('Failed to update project.')
      }
    } catch (error) {
      notify.toast.error('Failed to update project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Project</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6">
          <ProjectForm
            initialValues={project}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  )
}

export default EditProjectModal
