import { useState, useCallback } from 'react'
import { projectService } from '../services/projectService'
import { toast } from 'react-toastify'
import { ProjectRole } from '../types'

export function useProjectMembers(projectId: number) {
  const [loading, setLoading] = useState(false)

  const addMember = useCallback(async (userId: string, role: ProjectRole) => {
    try {
      setLoading(true)
      const newMember = await projectService.addProjectMember(
        projectId.toString(),
        userId,
        role
      )
      toast.success('Member added successfully')
      return newMember
    } catch (error) {
      toast.error('Failed to add member')
      throw error
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const removeMember = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      await projectService.removeProjectMember(projectId.toString(), userId)
      toast.success('Member removed successfully')
    } catch (error) {
      toast.error('Failed to remove member')
      throw error
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateMemberRole = useCallback(async (userId: string, role: ProjectRole) => {
    try {
      setLoading(true)
      const updatedMember = await projectService.updateProjectMemberRole(
        projectId.toString(),
        userId,
        role
      )
      toast.success('Member role updated successfully')
      return updatedMember
    } catch (error) {
      toast.error('Failed to update member role')
      throw error
    } finally {
      setLoading(false)
    }
  }, [projectId])

  return {
    addMember,
    removeMember,
    updateMemberRole,
    loading
  }
}
