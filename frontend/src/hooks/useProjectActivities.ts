import { useState, useEffect } from 'react'
import activityService from '../services/activityService'

export interface ProjectActivity {
  id: string
  projectId: number
  boardId?: number
  taskId?: number
  userId: number
  activityType: string
  description: string
  createdAt: string
  user?: {
    id: number
    firstName: string
    lastName: string
    profilePicture?: string
  }
  board?: {
    id: number
    name: string
  }
  task?: {
    id: number
    title: string
  }
}

export function useProjectActivities(projectId: number) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    const fetchActivities = async () => {
      try {
        setLoading(true)
        // For now, we'll fetch activities from boards related to this project
        // This would need a backend endpoint for project-level activities
        const mockActivities: ProjectActivity[] = [
          {
            id: '1',
            projectId,
            userId: 1,
            activityType: 'project_created',
            description: 'Project was created',
            createdAt: new Date().toISOString(),
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        ]
        setActivities(mockActivities)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [projectId])

  return { activities, loading, error }
}
