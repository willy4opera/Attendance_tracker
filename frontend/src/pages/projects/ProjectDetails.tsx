import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProject, useProjectWithStats } from '../../hooks/useProjects'
import { useBoards } from '../../hooks/useBoards'
import { ProjectMembers } from '../../components/projects/ProjectMembers'
import { ProjectStats } from '../../components/projects/ProjectStats'
import { ProjectTimeline } from '../../components/projects/ProjectTimeline'
import { BoardCard } from '../../components/boards/BoardCard'
import { 
  PlusIcon, 
  ViewColumnsIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ClockIcon,
  ArrowRightIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'boards' | 'activity'>('overview')

  const { project, loading, error } = useProject(id!)
  const {
    project: projectWithStats,
    loading: statsLoading,
    error: statsError,
  } = useProjectWithStats(id!)

  // Fetch project boards
  const { 
    boards, 
    loading: boardsLoading, 
    error: boardsError 
  } = useBoards({ projectId: id, limit: 20 })

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || statsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error || statsError}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project || !projectWithStats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Project not found</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The project you're looking for doesn't exist or has been deleted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateBoard = () => {
    navigate('/boards/create', { 
      state: { 
        projectId: id, 
        projectName: projectWithStats.name 
      } 
    })
  }

  const quickStats = [
    {
      name: 'Total Boards',
      value: projectWithStats.stats?.boardCount || 0,
      icon: ViewColumnsIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Active Members',
      value: projectWithStats.stats?.activeMemberCount || 0,
      icon: UserGroupIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Progress',
      value: `${projectWithStats.stats?.progress || 0}%`,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'boards', name: 'Boards', icon: ViewColumnsIcon, count: boards.length },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/projects" className="text-gray-500 hover:text-gray-700">
                  <FolderIcon className="h-5 w-5" />
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 mr-4" />
                  <span className="text-sm font-medium text-gray-900">
                    {projectWithStats.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{projectWithStats.name}</h1>
              <p className="text-gray-600 mt-2">
                {projectWithStats.description}
              </p>
              <div className="flex items-center mt-3 space-x-4">
                <span className="text-sm text-gray-500">
                  Code: <span className="font-medium">{projectWithStats.code}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Manager: <span className="font-medium">
                    {projectWithStats.projectManager?.firstName} {projectWithStats.projectManager?.lastName}
                  </span>
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                projectWithStats.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : projectWithStats.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : projectWithStats.status === 'on_hold'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {projectWithStats.status.replace('_', ' ').toUpperCase()}
              </span>
              <button
                onClick={handleCreateBoard}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Board
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                    {tab.count !== undefined && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Stats and Members */}
              <div className="lg:col-span-2 space-y-8">
                {projectWithStats.stats && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Statistics</h2>
                    <ProjectStats stats={projectWithStats.stats} />
                  </div>
                )}
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
                  <ProjectMembers projectId={id!} />
                </div>

                {/* Recent Boards Preview */}
                {boards.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Boards</h2>
                      <button
                        onClick={() => setActiveTab('boards')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {boards.slice(0, 4).map((board) => (
                        <BoardCard 
                          key={board.id} 
                          board={board} 
                          onClick={() => navigate(`/boards/${board.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Timeline */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <ProjectTimeline projectId={id!} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'boards' && (
            <div className="space-y-6">
              {/* Boards Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Project Boards</h2>
                  <p className="text-gray-600 mt-1">
                    Organize your work with Kanban-style boards
                  </p>
                </div>
                <button
                  onClick={handleCreateBoard}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Board
                </button>
              </div>

              {/* Boards Grid */}
              {boardsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : boardsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error loading boards: {boardsError}</p>
                </div>
              ) : boards.length === 0 ? (
                <div className="text-center py-12">
                  <ViewColumnsIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new board for this project.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateBoard}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Board
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boards.map((board) => (
                    <BoardCard 
                      key={board.id} 
                      board={board} 
                      onClick={() => navigate(`/boards/${board.id}`)}
                      showProject={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Activity</h2>
              <ProjectTimeline projectId={id!} limit={50} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
