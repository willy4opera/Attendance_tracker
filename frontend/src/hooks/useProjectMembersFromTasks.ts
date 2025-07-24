import { useState, useEffect } from 'react'
import { useTasks } from './useTasks'
import type { ProjectMember } from '../types'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  profilePicture?: string
}

export function useProjectMembersFromTasks(projectId: number, boards: any[]) {
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const { tasks } = useTasks()

  useEffect(() => {
    if (!boards || boards.length === 0) {
      setProjectMembers([])
      setLoading(false)
      return
    }

    const fetchMembersFromTasks = async () => {
      try {
        setLoading(true)
        
        // Get all board IDs for this project
        const boardIds = boards.map(board => board.id)
        
        // Filter tasks that belong to project boards
        const projectTasks = tasks.filter(task => boardIds.includes(task.boardId))
        
        // Create a map to track unique users and their roles
        const userMap = new Map<string, { user: User, tasks: number, lastActivity: string }>()
        
        // Extract unique users from task assignments
        projectTasks.forEach(task => {
          if (task.assignee) {
            const userId = task.assignee.id.toString()
            if (!userMap.has(userId)) {
              userMap.set(userId, {
                user: {
                  id: task.assignee.id.toString(),
                  firstName: task.assignee.firstName || 'Unknown',
                  lastName: task.assignee.lastName || 'User',
                  email: task.assignee.email || `user${task.assignee.id}@example.com`,
                  profilePicture: task.assignee.profilePicture
                },
                tasks: 1,
                lastActivity: task.updatedAt || task.createdAt
              })
            } else {
              const userData = userMap.get(userId)!
              userData.tasks += 1
              // Update last activity if this task is more recent
              if (task.updatedAt && task.updatedAt > userData.lastActivity) {
                userData.lastActivity = task.updatedAt
              }
            }
          }
          
          // Also check task creator if different from assignee
          if (task.createdBy && (!task.assignee || task.createdBy !== task.assignee.id)) {
            const creatorId = task.createdBy.toString()
            if (!userMap.has(creatorId)) {
              // For now, we'll create a basic user object for creators
              // In a real app, you'd fetch this from the API
              userMap.set(creatorId, {
                user: {
                  id: creatorId,
                  firstName: 'User',
                  lastName: creatorId,
                  email: `user${creatorId}@example.com`,
                  profilePicture: undefined
                },
                tasks: 0,
                lastActivity: task.createdAt
              })
            }
          }
        })
        
        // Also include board owners/creators
        boards.forEach(board => {
          if (board.owner) {
            const ownerId = board.owner.id.toString()
            if (!userMap.has(ownerId)) {
              userMap.set(ownerId, {
                user: {
                  id: ownerId,
                  firstName: board.owner.firstName || 'Board',
                  lastName: board.owner.lastName || 'Owner',
                  email: board.owner.email || `owner${ownerId}@example.com`,
                  profilePicture: board.owner.profilePicture
                },
                tasks: 0,
                lastActivity: board.createdAt
              })
            }
          }
        })
        
        // Convert to ProjectMember format
        const members: ProjectMember[] = Array.from(userMap.entries()).map(([userId, userData], index) => {
          // Determine role based on activity
          let role: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
          
          // Board owners get admin role
          const isOwnerOfAnyBoard = boards.some(board => board.owner?.id.toString() === userId)
          if (isOwnerOfAnyBoard) {
            role = 'admin'
          }
          
          // Users with many tasks get member role, others get viewer
          if (userData.tasks === 0 && !isOwnerOfAnyBoard) {
            role = 'viewer'
          }
          
          return {
            id: `${projectId}-${userId}`,
            projectId: projectId.toString(),
            userId: userId,
            role: role,
            joinedAt: userData.lastActivity,
            user: userData.user
          }
        })
        
        // Sort by role importance and activity
        const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 }
        members.sort((a, b) => {
          const roleCompare = roleOrder[a.role] - roleOrder[b.role]
          if (roleCompare !== 0) return roleCompare
          // Sort by last activity within same role
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        })
        
        setProjectMembers(members)
      } catch (error) {
        console.error('Failed to fetch members from tasks:', error)
        setProjectMembers([])
      } finally {
        setLoading(false)
      }
    }

    fetchMembersFromTasks()
  }, [projectId, boards, tasks])

  return { projectMembers, loading }
}
