import { useState, useEffect, useCallback } from 'react'
import { projectService } from '../services/projectService'
import type { Project, ProjectsResponse, CreateProjectDto, UpdateProjectDto, ProjectWithStats } from '../types'

export const useProjects = (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  departmentId?: string
  ownerId?: string
}) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response: ProjectsResponse = await projectService.getProjects(params)
      setProjects(response.projects || [])
      setTotal(response.total)
      setTotalPages(response.totalPages)
      setCurrentPage(response.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [params?.page, params?.limit, params?.search, params?.status, params?.departmentId, params?.ownerId])

  const createProject = async (data: CreateProjectDto): Promise<Project | null> => {
    try {
      const newProject = await projectService.createProject(data)
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      return null
    }
  }

  const updateProject = async (id: string, data: UpdateProjectDto): Promise<Project | null> => {
    try {
      const updatedProject = await projectService.updateProject(id, data)
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      return null
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      await projectService.deleteProject(id)
      setProjects(prev => prev.filter(project => project.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      return false
    }
  }

  const archiveProject = async (id: string): Promise<Project | null> => {
    try {
      const archivedProject = await projectService.archiveProject(id)
      setProjects(prev => prev.map(project => 
        project.id === id ? archivedProject : project
      ))
      return archivedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project')
      return null
    }
  }

  const unarchiveProject = async (id: string): Promise<Project | null> => {
    try {
      const unarchivedProject = await projectService.unarchiveProject(id)
      setProjects(prev => prev.map(project => 
        project.id === id ? unarchivedProject : project
      ))
      return unarchivedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive project')
      return null
    }
  }

  const refreshProjects = () => {
    fetchProjects()
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    refreshProjects
  }
}

export const useProject = (id: string) => {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const response = await projectService.getProject(id)
      setProject(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return {
    project,
    loading,
    error,
    refetch: fetchProject
  }
}

export const useProjectWithStats = (id: string) => {
  const [project, setProject] = useState<ProjectWithStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectWithStats = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const response = await projectService.getProjectWithStats(id)
      setProject(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project stats')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProjectWithStats()
  }, [fetchProjectWithStats])

  return {
    project,
    loading,
    error,
    refetch: fetchProjectWithStats
  }
}
