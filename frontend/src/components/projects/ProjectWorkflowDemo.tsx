import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FolderIcon,
  ViewColumnsIcon,
  CheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface ProjectWorkflowDemoProps {
  projectId?: string
  projectName?: string
}

export const ProjectWorkflowDemo: React.FC<ProjectWorkflowDemoProps> = ({ 
  projectId, 
  projectName 
}) => {
  const workflowSteps = [
    {
      id: 'project',
      title: 'Project',
      description: 'Plan and organize your work',
      icon: FolderIcon,
      color: 'bg-blue-500',
      link: projectId ? `/projects/${projectId}` : '/projects',
      action: projectId ? 'View Project' : 'Create Project'
    },
    {
      id: 'board',
      title: 'Boards',
      description: 'Visualize work with Kanban boards',
      icon: ViewColumnsIcon,
      color: 'bg-green-500',
      link: projectId ? `/boards/create?projectId=${projectId}` : '/boards',
      action: projectId ? 'Create Board' : 'View Boards'
    },
    {
      id: 'tasks',
      title: 'Tasks',
      description: 'Break down work into manageable tasks',
      icon: CheckIcon,
      color: 'bg-purple-500',
      link: '/tasks',
      action: 'Manage Tasks'
    },
    {
      id: 'activity',
      title: 'Activity',
      description: 'Track progress and collaboration',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      link: projectId ? `/projects/${projectId}?tab=activity` : '/dashboard',
      action: 'View Activity'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Project Workflow
          {projectName && (
            <span className="text-gray-500 font-normal ml-2">- {projectName}</span>
          )}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Organize your work from projects to tasks with our integrated workflow
        </p>
      </div>

      <div className="space-y-4">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === workflowSteps.length - 1

          return (
            <div key={step.id}>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${step.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    to={step.link}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {step.action}
                  </Link>
                </div>
              </div>
              
              {!isLast && (
                <div className="flex justify-center my-2">
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 transform rotate-90" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/projects/create"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            New Project
          </Link>
          <Link
            to="/boards/create"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            New Board
          </Link>
          <Link
            to="/tasks/create"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            New Task
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProjectWorkflowDemo
