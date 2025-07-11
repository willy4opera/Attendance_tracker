import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { ProjectForm } from '../../components/projects/ProjectForm'
import type { CreateProjectDto } from '../../types'
import { notify } from '../../utils/notifications'

const CreateProject: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createProject } = useProjects()
  const navigate = useNavigate()

  const handleCreateProject = async (data: CreateProjectDto) => {
    setIsSubmitting(true)
    try {
      const result = await createProject(data)
      if (result) {
        notify.toast.success('Project created successfully!')
        navigate('/projects')
      } else {
        notify.toast.error('Failed to create project.')
      }
    } catch (error) {
      notify.toast.error('Failed to create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details below to create a new project.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <ProjectForm 
            onSubmit={handleCreateProject} 
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}

export default CreateProject
