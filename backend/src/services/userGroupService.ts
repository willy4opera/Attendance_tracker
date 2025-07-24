import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserGroupService {
  // Get all groups for a specific user
  static async getUserGroups(userId: number) {
    try {
      const userGroups = await prisma.userGroup.findMany({
        where: { userId },
        include: {
          group: {
            include: {
              _count: {
                select: { members: true }
              }
            }
          }
        }
      });

      return userGroups.map(ug => ({
        ...ug.group,
        memberCount: ug.group._count.members
      }));
    } catch (error) {
      throw new Error(`Failed to fetch user groups: ${error.message}`);
    }
  }

  // Join a group
  static async joinGroup(userId: number, groupId: number) {
    try {
      // Check if user is already a member
      const existingMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        }
      });

      if (existingMembership) {
        throw new Error('User is already a member of this group');
      }

      // Check if group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        throw new Error('Group not found');
      }

      // Add user to group
      const userGroup = await prisma.userGroup.create({
        data: {
          userId,
          groupId
        },
        include: {
          group: true
        }
      });

      return userGroup;
    } catch (error) {
      throw new Error(`Failed to join group: ${error.message}`);
    }
  }

  // Leave a group
  static async leaveGroup(userId: number, groupId: number) {
    try {
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        }
      });

      if (!userGroup) {
        throw new Error('User is not a member of this group');
      }

      await prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        }
      });

      return { message: 'Successfully left the group' };
    } catch (error) {
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  // Get group members (for group owners/admins)
  static async getGroupMembers(groupId: number, requesterId: number) {
    try {
      // Check if requester has permission to view members
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        throw new Error('Group not found');
      }

      // Check if requester is the owner or a member
      const requesterMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: requesterId,
            groupId
          }
        }
      });

      if (!requesterMembership && group.ownerId !== requesterId) {
        throw new Error('Permission denied: You must be a member or owner to view group members');
      }

      const members = await prisma.userGroup.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        }
      });

      return members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        joinedAt: member.joinedAt,
        isOwner: member.user.id === group.ownerId
      }));
    } catch (error) {
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }
  }

  // Remove a member from group (only for group owners)
  static async removeMember(groupId: number, memberToRemoveId: number, requesterId: number) {
    try {
      // Check if group exists and requester is the owner
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        throw new Error('Group not found');
      }

      if (group.ownerId !== requesterId) {
        throw new Error('Permission denied: Only group owners can remove members');
      }

      // Cannot remove the owner
      if (memberToRemoveId === group.ownerId) {
        throw new Error('Cannot remove the group owner');
      }

      // Check if the member exists in the group
      const memberToRemove = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: memberToRemoveId,
            groupId
          }
        }
      });

      if (!memberToRemove) {
        throw new Error('User is not a member of this group');
      }

      await prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId: memberToRemoveId,
            groupId
          }
        }
      });

      return { message: 'Member removed successfully' };
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  // Get available groups to join (groups user is not already a member of)
  static async getAvailableGroups(userId: number) {
    try {
      // Get all groups where user is not a member
      const availableGroups = await prisma.group.findMany({
        where: {
          members: {
            none: {
              userId
            }
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { members: true }
          }
        }
      });

      return availableGroups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        owner: group.owner,
        memberCount: group._count.members,
        createdAt: group.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to fetch available groups: ${error.message}`);
    }
  }
}
