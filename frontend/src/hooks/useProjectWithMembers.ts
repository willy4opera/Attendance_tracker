import { useState, useEffect } from 'react'
import { useProject } from './useProjects'
import userService from '../services/userService'
import type { Project, ProjectMember } from '../types'

export function useProjectWithMembers(projectId: string) {
  const { project, loading: projectLoading, error: projectError, refetch } = useProject(projectId)
  const [enhancedProject, setEnhancedProject] = useState<Project | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    if (!project) {
      setEnhancedProject(null)
      return
    }

    const fetchMemberDetails = async () => {
      if (!project.members || project.members.length === 0) {
        setEnhancedProject(project)
        return
      }

      // Check if members already have user details
      const needsUserData = project.members.some(member => !member.user)
      if (!needsUserData) {
        setEnhancedProject(project)
        return
      }

      setMembersLoading(true)
      try {
        // Fetch all users to get their details
        const response = await userService.getAllUsers({ limit: 100 })
        const allUsers = response.users

        // Create a map of userId to user details
        const userMap = new Map(
          allUsers.map(user => [user.id, user])
        )

        // Enhance members with user details
        const enhancedMembers: ProjectMember[] = project.members.map(member => {
          if (member.user) {
            return member // Already has user data
          }

          const userDetails = userMap.get(member.userId)
          if (userDetails) {
            return {
              ...member,
              user: {
                id: userDetails.id,
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                email: userDetails.email,
                profilePicture: userDetails.profilePicture
              }
            }
          }

          // If user not found, return with placeholder data
          return {
            ...member,
            user: {
              id: member.userId,
              firstName: 'Unknown',
              lastName: 'User',
              email: `user${member.userId}@example.com`,
              profilePicture: undefined
            }
          }
        })

        setEnhancedProject({
          ...project,
          members: enhancedMembers
        })
      } catch (error) {
        console.error('Failed to fetch member details:', error)
        // Fall back to original project data
        setEnhancedProject(project)
      } finally {
        setMembersLoading(false)
      }
    }

    fetchMemberDetails()
  }, [project])

  const refetchWithMembers = async () => {
    await refetch()
  }

  return {
    project: enhancedProject,
    loading: projectLoading || membersLoading,
    error: projectError,
    refetch: refetchWithMembers
  }
}
