import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useProjects } from '../../hooks/useProjects'
import { ProjectForm } from '../../components/projects/ProjectForm'
import type { UpdateProjectDto } from '../../types'
import { notify } from '../../utils/notifications'

const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { project, loading, error } = useProject(id!)
  const { updateProject } = useProjects()
  const navigate = useNavigate()

  const handleUpdateProject = async (data: UpdateProjectDto) => {
    setIsSubmitting(true)
    try {
      const result = await updateProject(id!, data)
      if (result) {
        notify.toast.success('Project updated successfully!')
        navigate(`/projects/${id}`)
      } else {
        notify.toast.error('Failed to update project.')
      }
    } catch (error) {
      notify.toast.error('Failed to update project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Project not found</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The project you're trying to edit doesn't exist or has been deleted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">
            Update the details for "{project.name}".
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <ProjectForm 
            initialValues={project}
            onSubmit={handleUpdateProject} 
            isSubmitting={isSubmitting}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  )
}

export default EditProject
