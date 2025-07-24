import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useProjects } from '../../hooks/useProjects'
import { useBoards } from '../../hooks/useBoards'
import { useProjectStatistics } from '../../hooks/useProjectStatistics'
import ProjectStats from '../../components/projects/ProjectStats'
import {
  ProjectHeader,
  QuickStatsCards,
  ProjectTabs,
  DeleteConfirmationModal,
  LoadingState,
  NotFoundState
} from '../../components/projects/project-details'
import '../../styles/project-details.css'

// Add CSS variable for secondary color
const style = document.createElement('style')
style.textContent = `
  :root {
    --secondary-color: ${import.meta.env.VITE_THEME_COLOR_SECONDARY || '#000000'};
  }
`
document.head.appendChild(style)

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, loading: projectLoading, refetch: refetchProject } = useProject(id || '0')
  const { deleteProject } = useProjects()
  const { boards, loading: boardsLoading } = useBoards({ projectId: parseInt(id || '0') })
  const { statistics, loading: statsLoading } = useProjectStatistics()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'boards' | 'activity'>('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Get statistics for this specific project
  const projectStats = statistics?.projectLevelStats?.find(stat => stat.project_id === parseInt(id || '0'))
  const stats = projectStats ? {
    boardCount: parseInt(projectStats.board_count),
    totalTasks: parseInt(projectStats.task_count),
    completedTasks: parseInt(projectStats.completed_tasks),
    inProgressTasks: parseInt(projectStats.in_progress_tasks),
    progress: parseFloat(projectStats.completion_percentage),
    activeMemberCount: parseInt(projectStats.member_count) || 0
  } : {
    boardCount: boards.length,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    progress: 0,
    activeMemberCount: 0
  }

  const loading = projectLoading || boardsLoading || statsLoading

  const handleProjectUpdate = useCallback(() => {
    // Refetch project data when members are updated
    refetchProject()
  }, [refetchProject])

  const handleDelete = async () => {
    const projectIdString = project?.id.toString() || id || '0'
    await deleteProject(projectIdString)
    navigate('/projects')
  }

  if (loading) {
    return <LoadingState />
  }

  if (!project) {
    return <NotFoundState />
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10">
        <ProjectHeader 
          project={project} 
          onDelete={() => setShowDeleteConfirm(true)} 
        />
      </div>

      {/* Statistics Overview */}
      <ProjectStats stats={stats} />

      {/* Quick Stats Cards */}
      <QuickStatsCards stats={stats} memberCount={project?.members?.length || 0} />

      {/* Tabs */}
      <ProjectTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
        boards={boards}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        projectName={project.name}
      />
    </div>
  )
}
