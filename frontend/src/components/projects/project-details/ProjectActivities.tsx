import React, { useEffect, useState } from 'react'
import { ClockIcon, UserIcon, FolderIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useProjectActivities } from '../../../hooks/useProjectActivities'
import { useBoards } from '../../../hooks/useBoards'
import activityService from '../../../services/activityService'
import theme from '../../../config/theme'

interface ProjectActivitiesProps {
  projectId: number
  boards: any[]
}

export function ProjectActivities({ projectId, boards }: ProjectActivitiesProps) {
  const { activities: projectActivities, loading: projectLoading } = useProjectActivities(projectId)
  const [boardActivities, setBoardActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBoardActivities = async () => {
      try {
        setLoading(true)
        const allActivities: any[] = []
        
        // Fetch activities for each board in the project
        for (const board of boards) {
          try {
            const response = await activityService.getBoardActivityFeed(board.id, {
              limit: 10,
              timeRange: '7d'
            })
            
            if (response.data?.data) {
              const boardActivityData = response.data.data.map((activity: any) => ({
                ...activity,
                boardName: board.name,
                boardId: board.id
              }))
              allActivities.push(...boardActivityData)
            }
          } catch (error) {
            console.error(`Failed to fetch activities for board ${board.id}:`, error)
          }
        }
        
        // Sort activities by date (most recent first)
        allActivities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        setBoardActivities(allActivities.slice(0, 20)) // Limit to 20 most recent
      } catch (error) {
        console.error('Failed to fetch board activities:', error)
      } finally {
        setLoading(false)
      }
    }

    if (boards.length > 0) {
      fetchBoardActivities()
    } else {
      setLoading(false)
    }
  }, [boards])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return CheckCircleIcon
      case 'member_added':
      case 'member_removed':
        return UserIcon
      case 'board_created':
        return FolderIcon
      default:
        return ClockIcon
    }
  }

  const getActivityColor = (type: string) => {
    if (type.includes('created')) return theme.colors.success
    if (type.includes('updated')) return theme.colors.info
    if (type.includes('deleted') || type.includes('removed')) return theme.colors.error
    return theme.colors.secondary
  }

  const formatActivityDescription = (activity: any) => {
    const userName = activity.user ? 
      `${activity.user.firstName} ${activity.user.lastName}` : 
      'Unknown user'
    
    switch (activity.activityType) {
      case 'task_created':
        return `${userName} created task "${activity.task?.title || 'Unknown'}" in ${activity.boardName}`
      case 'task_updated':
        return `${userName} updated task "${activity.task?.title || 'Unknown'}" in ${activity.boardName}`
      case 'task_completed':
        return `${userName} completed task "${activity.task?.title || 'Unknown'}" in ${activity.boardName}`
      case 'member_added':
        return `${userName} was added to ${activity.boardName}`
      case 'board_created':
        return `${userName} created board "${activity.boardName}"`
      default:
        return activity.description || `${userName} performed an action in ${activity.boardName}`
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return activityDate.toLocaleDateString()
  }

  if (loading || projectLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
             style={{ borderColor: theme.colors.secondary }}></div>
      </div>
    )
  }

  const allActivities = [...projectActivities, ...boardActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 mb-4" style={{ color: theme.colors.text.secondary }} />
        <p style={{ color: theme.colors.text.secondary }}>
          No activities yet. Start by creating boards and tasks!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
        Recent Activity
      </h3>
      
      <div className="space-y-3">
        {allActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.activityType)
          const color = getActivityColor(activity.activityType)
          
          return (
            <div 
              key={`${activity.id}-${index}`} 
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ backgroundColor: theme.colors.background.paper }}
            >
              <div 
                className="p-2 rounded-lg mt-1"
                style={{ backgroundColor: color + '20' }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              
              <div className="flex-1">
                <p className="text-sm" style={{ color: theme.colors.text.primary }}>
                  {formatActivityDescription(activity)}
                </p>
                <p className="text-xs mt-1" style={{ color: theme.colors.text.secondary }}>
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {allActivities.length >= 20 && (
        <div className="text-center pt-4">
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Showing the 20 most recent activities
          </p>
        </div>
      )}
    </div>
  )
}
