import { transformProjectMembers } from '../utils/projectHelpers'
import api from './api'
import type {
  Project,
  ProjectsResponse,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectWithStats,
  ProjectMember,
  ProjectRole
} from '../types'

export const projectService = {
  // Get all projects
  async getProjects(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    departmentId?: string
    ownerId?: string
  }): Promise<ProjectsResponse> {
    const response = await api.get('/projects', { params })
    // Backend returns data in response.data.data format
    return response.data.data
  },

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`)
    console.log("Raw project response:", response.data.data)
    return transformProjectMembers(response.data.data)
  },

  // Get project with stats
  async getProjectWithStats(id: string): Promise<ProjectWithStats> {
    const response = await api.get(`/projects/${id}`)
    return transformProjectMembers(response.data.data)
  },

  // Create new project
  async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await api.post('/projects', data)
    return response.data.data
  },

  // Update project
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data)
    return response.data.data
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  // Archive project
  async archiveProject(id: string): Promise<Project> {
    const response = await api.patch(`/projects/${id}/archive`)
    return response.data.data
  },

  // Unarchive project
  async unarchiveProject(id: string): Promise<Project> {
    const response = await api.patch(`/projects/${id}/unarchive`)
    return response.data.data
  },

  // Add project member
  async addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const response = await api.post(`/projects/${projectId}/members`, {
      userId: parseInt(userId),
      role,
      action: 'add'
    })
    return response.data.data
  },

  // Remove project member
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.post(`/projects/${projectId}/members`, {
      userId: parseInt(userId),
      action: 'remove'
    })
  },

  // Update project member role
  async updateProjectMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const response = await api.post(`/projects/${projectId}/members`, {
      userId: parseInt(userId),
      role,
      action: 'update'
    })
    return response.data.data
  }
}
