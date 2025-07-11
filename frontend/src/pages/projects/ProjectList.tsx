import React, { useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { ProjectFilters } from '../../components/projects/ProjectFilters'
import { CreateProjectModal } from '../../components/projects/CreateProjectModal'
import { ProjectWorkflowDemo } from '../../components/projects/ProjectWorkflowDemo'
import { ProjectStatus, ProjectPriority } from '../../types'
import { 
  PlusIcon, 
  ViewColumnsIcon, 
  ListBulletIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'

export const ProjectList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | ''>('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showWorkflow, setShowWorkflow] = useState(false)

  const {
    projects = [],
    loading,
    error,
    total,
    totalPages,
    refreshProjects
  } = useProjects({
    page: currentPage,
    limit: 12,
    search: searchTerm,
    status: statusFilter,
    departmentId: departmentFilter
  })

  const handleCreateProject = () => {
    setIsCreateModalOpen(true)
  }

  const handleProjectCreated = () => {
    setIsCreateModalOpen(false)
    refreshProjects()
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: ProjectStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePriorityFilter = (priority: ProjectPriority | '') => {
    setPriorityFilter(priority)
    setCurrentPage(1)
  }

  const handleDepartmentFilter = (departmentId: string) => {
    setDepartmentFilter(departmentId)
    setCurrentPage(1)
  }

  const filteredProjects = React.useMemo(() => {
    return (projects || []).filter(project => {
      if (priorityFilter && project.priority !== priorityFilter) return false
      return true
    })
  }, [projects, priorityFilter])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.default }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                  Projects
                </h1>
                <p className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
                  Organize work with the integrated project-board-task workflow
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowWorkflow(!showWorkflow)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Workflow Guide
                  {showWorkflow ? (
                    <ChevronUpIcon className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  )}
                </button>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </button>
              </div>
            </div>

            {/* Workflow Demo */}
            {showWorkflow && (
              <div className="mt-6">
                <ProjectWorkflowDemo />
              </div>
            )}

            {/* Filters and Search */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    focusRingColor: theme.colors.primary,
                    '--tw-ring-color': theme.colors.primary 
                  } as any}
                  placeholder="Search projects..."
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 sm:col-start-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
                    color: viewMode === 'grid' ? theme.colors.secondary : undefined
                  }}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
                    color: viewMode === 'list' ? theme.colors.secondary : undefined
                  }}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters Component */}
            <div className="mt-4">
              <ProjectFilters
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                departmentFilter={departmentFilter}
                onStatusChange={handleStatusFilter}
                onPriorityChange={handlePriorityFilter}
                onDepartmentChange={handleDepartmentFilter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
                 style={{ borderColor: theme.colors.primary }}></div>
          </div>
        ) : projects && projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                No projects found
              </h3>
              <p className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new project.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Project Stats Summary */}
            {projects && projects.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    {projects.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Projects</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {projects.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {projects.reduce((sum, p) => sum + (p.stats?.boardCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Boards</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {projects.reduce((sum, p) => sum + (p.stats?.activeMemberCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
              </div>
            )}

            {/* Project Grid/List */}
            <div
              className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {(projects || []).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onUpdate={refreshProjects}
                />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              style={{
                borderColor: theme.colors.primary,
                color: currentPage === 1 ? theme.colors.text.secondary : theme.colors.text.primary
              }}
            >
              Previous
            </button>
            <span className="px-4 py-1" style={{ color: theme.colors.text.primary }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: currentPage === totalPages ? 'transparent' : theme.colors.primary,
                borderColor: theme.colors.primary,
                color: currentPage === totalPages ? theme.colors.text.secondary : theme.colors.secondary
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}

export default ProjectList
