import React, { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardDocumentListIcon, FolderIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { ProjectMembersEnhanced } from '../ProjectMembersEnhanced'
import { ProjectTimeline } from '../ProjectTimeline'
import ProjectBoardsOverview from '../ProjectBoardsOverview'
import { ProjectActivities } from './ProjectActivities'
import { DebugProjectData } from './DebugProjectData'
import { useTasks } from '../../../hooks/useTasks'
import { useProjectMembersFromTasks } from '../../../hooks/useProjectMembersFromTasks'
import theme from '../../../config/theme'

interface ProjectTabsProps {
  activeTab: 'overview' | 'boards' | 'activity'
  setActiveTab: (tab: 'overview' | 'boards' | 'activity') => void
  project: any
  boards: any[]
  onProjectUpdate?: () => void
}

export function ProjectTabs({ activeTab, setActiveTab, project, boards, onProjectUpdate }: ProjectTabsProps) {
  const [tasksForTimeline, setTasksForTimeline] = useState<any[]>([])
  const { tasks, loading: tasksLoading } = useTasks()
  const { projectMembers, loading: membersLoading } = useProjectMembersFromTasks(project.id, boards)
  
  // Use members from tasks if available, otherwise fall back to project members
  const members = projectMembers.length > 0 ? projectMembers : (project.members || [])

  // Get all tasks for this project's boards
  useEffect(() => {
    if (boards.length > 0 && tasks.length > 0) {
      const boardIds = boards.map(b => b.id)
      const projectTasks = tasks.filter(task => 
        boardIds.includes(task.boardId)
      ).map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        board: boards.find(b => b.id === task.boardId)
      }))
      setTasksForTimeline(projectTasks)
    }
  }, [boards, tasks])

  const tabIcons = {
    overview: ClipboardDocumentListIcon,
    boards: FolderIcon,
    activity: ChartBarIcon
  }

  const handleMembersUpdate = useCallback(() => {
    if (onProjectUpdate) {
      onProjectUpdate()
    }
  }, [onProjectUpdate])

  if (membersLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
             style={{ borderColor: theme.colors.secondary }}></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm" style={{ backgroundColor: theme.colors.background.paper }}>
      <div className="border-b" style={{ borderColor: theme.colors.secondary + '20' }}>
        <div className="flex space-x-8 px-6">
          {(['overview', 'boards', 'activity'] as const).map((tab) => {
            const Icon = tabIcons[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab ? 'border-current' : 'border-transparent'
                }`}
                style={{
                  color: activeTab === tab ? theme.colors.secondary : theme.colors.text.secondary,
                  borderColor: activeTab === tab ? theme.colors.secondary : 'transparent'
                }}
              >
                <Icon className="h-5 w-5 inline mr-2" />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Description */}
            {project.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Project Description
                </h4>
                <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  {project.description}
                </p>
              </div>
            )}

            {/* Team Members derived from tasks */}
            <div>
              <div className="mb-2">
                <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                  * Team members are derived from users assigned to tasks in project boards
                </p>
              </div>
              <ProjectMembersEnhanced 
                projectId={project.id} 
                members={members} 
                projectManagerId={project.projectManagerId}
                onMembersUpdate={handleMembersUpdate}
              />
            </div>

            {/* Project Timeline with real tasks */}
            <div className="bg-white rounded-lg p-6" style={{ backgroundColor: theme.colors.background.paper }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
                Project Timeline
              </h3>
              {project.startDate && (
                <ProjectTimeline 
                  startDate={project.startDate}
                  endDate={project.endDate}
                  tasks={tasksForTimeline}
                />
              )}
              {!project.startDate && (
                <p className="text-sm text-center py-4" style={{ color: theme.colors.text.secondary }}>
                  No timeline set for this project
                </p>
              )}
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-lg p-6" style={{ backgroundColor: theme.colors.background.paper }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
                Project Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    Project Code
                  </p>
                  <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                    {project.code}
                  </p>
                </div>
                {project.department && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                      Department
                    </p>
                    <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                      {project.department.name}
                    </p>
                  </div>
                )}
                {project.budget && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                      Budget
                    </p>
                    <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                      ${project.budget.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    Created
                  </p>
                  <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    Active Team Members
                  </p>
                  <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    Total Tasks
                  </p>
                  <p className="mt-1" style={{ color: theme.colors.text.primary }}>
                    {tasksForTimeline.length} {tasksForTimeline.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'boards' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                Project Boards ({boards.length})
              </h3>
              <Link
                to={`/boards/create?projectId=${project.id}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-button-primary"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text.primary
                }}
              >
                Create Board
              </Link>
            </div>
            
            {boards.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FolderIcon className="mx-auto h-12 w-12" style={{ color: theme.colors.text.secondary }} />
                <p className="mt-2" style={{ color: theme.colors.text.secondary }}>
                  No boards yet. Create your first board to get started.
                </p>
                <Link
                  to={`/boards/create?projectId=${project.id}`}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: '#ffffff'
                  }}
                >
                  Create Your First Board
                </Link>
              </div>
            ) : (
              <div>
                <ProjectBoardsOverview boards={boards} />
                
                {/* Board Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                      Total Tasks
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.text.primary }}>
                      {tasksForTimeline.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                      Active Boards
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.text.primary }}>
                      {boards.filter(b => b.isActive).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                      Avg. Tasks/Board
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.text.primary }}>
                      {boards.length > 0 ? Math.round(tasksForTimeline.length / boards.length) : 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <ProjectActivities 
            projectId={project.id} 
            boards={boards}
          />
        )}
      </div>
    </div>
  )
}
