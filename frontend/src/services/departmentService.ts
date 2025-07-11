import api from './api'
import { AxiosError } from 'axios'
import type {
  Department,
  DepartmentWithStats,
  DepartmentsResponse,
  CreateDepartmentDto,
  UpdateDepartmentDto
} from '../types'

interface DepartmentParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  parentDepartmentId?: string | null
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  includeStats?: boolean
  [key: string]: unknown
}

class DepartmentService {
  // Get all departments with filtering and pagination
  async getAllDepartments(params?: DepartmentParams): Promise<DepartmentsResponse> {
    try {
      const response = await api.get('/departments', { params })
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch departments')
    }
  }

  // Get department by ID with full details
  async getDepartmentById(id: string, includeStats = true): Promise<DepartmentWithStats> {
    try {
      const response = await api.get(`/departments/${id}`, {
        params: { includeStats }
      })
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch department')
    }
  }

  // Create a new department
  async createDepartment(departmentData: CreateDepartmentDto): Promise<Department> {
    try {
      const response = await api.post('/departments', departmentData)
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to create department')
    }
  }

  // Update department
  async updateDepartment(id: string, updates: UpdateDepartmentDto): Promise<Department> {
    try {
      const response = await api.put(`/departments/${id}`, updates)
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to update department')
    }
  }

  // Delete department (soft or hard delete)
  async deleteDepartment(id: string, force = false): Promise<void> {
    try {
      await api.delete(`/departments/${id}`, {
        params: { force }
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to delete department')
    }
  }

  // Get department hierarchy
  async getDepartmentHierarchy(): Promise<Department[]> {
    try {
      const response = await api.get('/departments/hierarchy')
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch department hierarchy')
    }
  }

  // Bulk update departments
  async bulkUpdateDepartments(departmentIds: string[], updates: Partial<UpdateDepartmentDto>): Promise<{ updatedCount: number }> {
    try {
      const response = await api.post('/departments/bulk-update', {
        departmentIds,
        updates
      })
      return response.data.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw new Error(axiosError.response?.data?.message || 'Failed to bulk update departments')
    }
  }
}

export default new DepartmentService()
