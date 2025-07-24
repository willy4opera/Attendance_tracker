import React, { useState, useEffect } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { useProjectStatistics } from '../../hooks/useProjectStatistics'
import { ProjectStatisticsWidget } from '../../components/projects/ProjectStatisticsWidget'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { ProjectFilters } from '../../components/projects/ProjectFilters'
import { CreateProjectModal } from '../../components/projects/CreateProjectModal'
import { ProjectWorkflowDemo } from '../../components/projects/ProjectWorkflowDemo'
import { ProjectStatus, ProjectPriority } from '../../types'
import { 
  PlusIcon, 
  ChartBarIcon, 
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import ViewToggle from '../../components/common/ViewToggle'
import theme from '../../config/theme'

export default function ProjectList() {
  const { projects: rawProjects, loading: projectsLoading, error, createProject } = useProjects()
  const { statistics, loading: statsLoading } = useProjectStatistics()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | ''>('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showWorkflow, setShowWorkflow] = useState(false)
  
  const itemsPerPage = 9

  // Merge projects with real statistics
  const projects = rawProjects.map(project => {
    const projectStats = statistics?.projectLevelStats.find(stat => stat.project_id === project.id)
    return {
      ...project,
      stats: projectStats ? {
        boardCount: parseInt(projectStats.board_count),
        totalTasks: parseInt(projectStats.task_count),
        completedTasks: parseInt(projectStats.completed_tasks),
        inProgressTasks: parseInt(projectStats.in_progress_tasks),
        todoTasks: parseInt(projectStats.todo_tasks),
        reviewTasks: parseInt(projectStats.review_tasks),
        archivedTasks: parseInt(projectStats.archived_tasks),
        progress: parseFloat(projectStats.completion_percentage),
        activeMemberCount: parseInt(projectStats.member_count)
      } : project.stats
    }
  })

  // Calculate overall statistics
  const overallStats = statistics?.overallStats ? {
    totalProjects: parseInt(statistics.overallStats.total_projects),
    totalBoards: parseInt(statistics.overallStats.total_boards),
    totalTasks: parseInt(statistics.overallStats.total_tasks),
    completedTasks: parseInt(statistics.overallStats.completed_tasks),
    totalMembers: parseInt(statistics.overallStats.total_unique_members),
    overallProgress: parseFloat(statistics.overallStats.overall_completion_percentage)
  } : {
    totalProjects: projects.length,
    totalBoards: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    overallProgress: 0
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || project.status === statusFilter
    const matchesPriority = priorityFilter === '' || project.priority === priorityFilter
    const matchesDepartment = departmentFilter === '' || project.departmentId?.toString() === departmentFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment
  })

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage)

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject(projectData)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // Priority Distribution for Chart
  const priorityData = statistics?.priorityDistribution || []

  if (projectsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Manage and track your organization's projects</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowWorkflow(!showWorkflow)}
              className="btn btn-secondary flex items-center"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {showWorkflow ? 'Hide' : 'Show'} Workflow
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{overallStats.totalProjects}</p>
              </div>
              <FolderIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Boards</p>
                <p className="text-2xl font-bold">{overallStats.totalBoards}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{overallStats.totalTasks}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{overallStats.completedTasks}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{overallStats.totalMembers}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold">{overallStats.overallProgress.toFixed(1)}%</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Task Priority Distribution</h3>
            <div className="grid grid-cols-4 gap-4">
              {priorityData.map((priority) => (
                <div key={priority.priority} className="text-center">
                  <div className={`p-3 rounded-lg ${
                    priority.priority === 'urgent' ? 'bg-red-100' :
                    priority.priority === 'high' ? 'bg-orange-100' :
                    priority.priority === 'medium' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    <p className="text-sm font-medium capitalize">{priority.priority}</p>
                    <p className="text-2xl font-bold">{priority.total}</p>
                    <p className="text-xs text-gray-600">
                      {priority.completed} completed ({priority.completion_percentage}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completions */}
        {statistics?.recentCompletions && statistics.recentCompletions.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Recent Task Completions</h3>
            <div className="space-y-2">
              {statistics.recentCompletions.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.board_name} • {task.project_name || 'No Project'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{task.assigned_members || 'Unassigned'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Statistics Widget */}
        <ProjectStatisticsWidget />

        {/* Workflow Demo */}
        {showWorkflow && (
          <div className="mb-6">
            <ProjectWorkflowDemo />
          </div>
        )}
      </div>

      {/* Filters and View Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <ProjectFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
          />
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Projects Grid/List */}
      {paginatedProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No projects found</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {paginatedProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
