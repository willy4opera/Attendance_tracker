import { useState, useEffect, useCallback } from 'react'
import { taskService, type CreateTaskData } from '../services/taskService'
import type { Task, TasksResponse, UpdateTaskDto, TaskWithStats } from '../types'

export const useTasks = (params?: {
  boardId?: string
  listId?: string
  assigneeId?: string
  priority?: string
  status?: string
  search?: string
}) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let tasksData: Task[] = []
      
      if (params?.listId) {
        // Get tasks for a specific list
        tasksData = await taskService.getListTasks(params.listId)
      } else if (params?.boardId) {
        // Get tasks for a specific board
        tasksData = await taskService.getBoardTasks(params.boardId)
      } else {
        // Get all tasks for the current user with filters
        const result = await taskService.getAllTasks({
          search: params?.search,
          status: params?.status,
          priority: params?.priority
        })
        tasksData = result.tasks
      }
      
      setTasks(tasksData)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [params?.boardId, params?.listId, params?.assigneeId, params?.priority, params?.status, params?.search])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    setIsCreating(true)
    setError(null)
    
    try {
      const newTask = await taskService.createTask(data)
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      console.error('Error creating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [])

  const updateTask = useCallback(async (id: string, data: Partial<CreateTaskData>): Promise<Task> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      const updatedTask = await taskService.updateTask(id, data)
      setTasks(prev => prev.map(task => 
        task.id.toString() === id ? updatedTask : task
      ))
      return updatedTask
    } catch (err) {
      console.error('Error updating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null)
    
    try {
      await taskService.deleteTask(id)
      setTasks(prev => prev.filter(task => task.id.toString() !== id))
    } catch (err) {
      console.error('Error deleting task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const moveTask = useCallback(async (taskId: string, targetListId: string, position: number): Promise<void> => {
    setError(null)
    
    try {
      const updatedTask = await taskService.moveTask(taskId, targetListId, position)
      setTasks(prev => prev.map(task => 
        task.id.toString() === taskId ? updatedTask : task
      ))
    } catch (err) {
      console.error('Error moving task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to move task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const assignTask = useCallback(async (taskId: string, userId: string): Promise<void> => {
    setError(null)
    
    try {
      const updatedTask = await taskService.assignTask(taskId, userId)
      setTasks(prev => prev.map(task => 
        task.id.toString() === taskId ? updatedTask : task
      ))
    } catch (err) {
      console.error('Error assigning task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const unassignTask = useCallback(async (taskId: string, userId: string): Promise<void> => {
    setError(null)
    
    try {
      const updatedTask = await taskService.unassignTask(taskId, userId)
      setTasks(prev => prev.map(task => 
        task.id.toString() === taskId ? updatedTask : task
      ))
    } catch (err) {
      console.error('Error unassigning task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const watchTask = useCallback(async (taskId: string): Promise<void> => {
    setError(null)
    
    try {
      await taskService.watchTask(taskId)
    } catch (err) {
      console.error('Error watching task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to watch task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const unwatchTask = useCallback(async (taskId: string): Promise<void> => {
    setError(null)
    
    try {
      await taskService.unwatchTask(taskId)
    } catch (err) {
      console.error('Error unwatching task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to unwatch task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const refreshTasks = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    isLoading: loading, // alias for compatibility
    isCreating,
    isUpdating,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    unassignTask,
    watchTask,
    unwatchTask,
    refreshTasks,
    refetch: fetchTasks
  }
}

// Hook for single task
export const useTask = (id: string) => {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    
    try {
      const taskData = await taskService.getTask(id)
      setTask(taskData)
    } catch (err) {
      console.error('Error fetching task:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch task')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  const refreshTask = useCallback(() => {
    fetchTask()
  }, [fetchTask])

  return {
    task,
    loading,
    error,
    refreshTask,
    refetch: fetchTask
  }
}

export default useTasks
