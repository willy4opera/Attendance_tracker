import type { Project, ProjectMember } from '../types'

// Helper to transform backend member data to frontend format
export function transformProjectMembers(project: any): Project {
  if (!project) return project

  // Check if members exist and need transformation
  if (project.members && Array.isArray(project.members)) {
    const transformedMembers: ProjectMember[] = project.members.map((member: any) => {
      // Handle different possible backend formats
      
      // Format 1: Member with nested user object (expected format)
      if (member.user) {
        return member
      }
      
      // Format 2: Member IS the user with UserProject metadata (current backend format)
      if (member.firstName || member.email) {
        const userProjectData = member.UserProject || {}
        return {
          id: `${project.id}-${member.id}`, // Create composite ID
          projectId: project.id.toString(),
          userId: member.id.toString(),
          role: userProjectData.role || 'member', // Use role from UserProject
          joinedAt: userProjectData.joinedAt,
          user: {
            id: member.id.toString(),
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            profilePicture: member.profilePicture
          }
        }
      }
      
      // Format 3: Member with userId and separate user fields
      if (member.userId && (member.firstName || member.userFirstName)) {
        return {
          ...member,
          user: {
            id: member.userId,
            firstName: member.firstName || member.userFirstName || 'Unknown',
            lastName: member.lastName || member.userLastName || 'User',
            email: member.email || member.userEmail || `user${member.userId}@example.com`,
            profilePicture: member.profilePicture || member.userProfilePicture
          }
        }
      }
      
      // Format 4: Flat member object with user_ prefixed fields
      if (member.user_id || member.user_firstName) {
        return {
          id: member.id,
          projectId: member.projectId,
          userId: member.user_id || member.userId,
          role: member.role,
          joinedAt: member.joinedAt || member.createdAt,
          user: {
            id: member.user_id || member.userId,
            firstName: member.user_firstName || 'Unknown',
            lastName: member.user_lastName || 'User',
            email: member.user_email || `user${member.user_id || member.userId}@example.com`,
            profilePicture: member.user_profilePicture
          }
        }
      }
      
      // Default: return member as is (will show Unknown User)
      return member
    })
    
    return {
      ...project,
      members: transformedMembers
    }
  }
  
  return project
}
