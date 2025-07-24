const { Op, Sequelize } = require('sequelize');
const { Group, GroupMember, User } = require('../../models');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

/**
 * Get groups for current user
 * GET /api/v1/groups/my-groups
 */
exports.getUserGroups = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, search, isActive } = req.query;
  const offset = (page - 1) * limit;

  // Build where clause for groups
  const groupWhere = {};
  if (search) {
    groupWhere[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (isActive !== undefined) {
    groupWhere.isActive = isActive === 'true';
  }

  // Find groups where user is a member
  const { count, rows: groups } = await Group.findAndCountAll({
    where: groupWhere,
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      },
      {
        model: GroupMember,
        as: 'groupMemberships',
        where: { 
          userId: userId,
          isActive: true 
        },
        attributes: ['role', 'joinedAt'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      }
    ],
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM "GroupMembers" 
            WHERE "GroupMembers"."group_id" = "Group"."id" 
            AND "GroupMembers"."is_active" = true
          )`), 
          'membersCount'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM "GroupMembers" 
            WHERE "GroupMembers"."group_id" = "Group"."id" 
            AND "GroupMembers"."is_active" = true 
            AND "GroupMembers"."role" = 'admin'
          )`), 
          'adminsCount'
        ]
      ]
    },
    order: [['createdAt', 'DESC']]
  });

  // Transform the response to include user's role in each group
  const transformedGroups = groups.map(group => {
    const groupData = group.toJSON();
    const membership = groupData.groupMemberships?.[0];
    
    return {
      ...groupData,
      userRole: membership?.role || 'member',
      userJoinedAt: membership?.joinedAt,
      // Remove the membership data from the response
      groupMemberships: undefined
    };
  });

  res.status(200).json({
    status: 'success',
    results: transformedGroups.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      groups: transformedGroups
    }
  });
});

/**
 * Get groups for a specific user (admin only)
 * GET /api/v1/groups/users/:userId
 */
exports.getUserGroupsById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Check permissions - only admin/moderator can view other users' groups
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && req.user.id !== parseInt(userId)) {
    return next(new AppError('You do not have permission to view this user\'s groups', 403));
  }

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Find groups where user is a member
  const { count, rows: groups } = await Group.findAndCountAll({
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      },
      {
        model: GroupMember,
        as: 'groupMemberships',
        where: { 
          userId: userId,
          isActive: true 
        },
        attributes: ['role', 'joinedAt']
      }
    ],
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM "GroupMembers" 
            WHERE "GroupMembers"."group_id" = "Group"."id" 
            AND "GroupMembers"."is_active" = true
          )`), 
          'membersCount'
        ]
      ]
    },
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: groups.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      groups,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    }
  });
});

/**
 * Check if current user is member of a specific group
 * GET /api/v1/groups/:groupId/membership/check
 */
exports.checkGroupMembership = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const membership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
      isActive: true
    },
    attributes: ['role', 'joinedAt']
  });

  res.status(200).json({
    status: 'success',
    data: {
      isMember: !!membership,
      role: membership?.role || null,
      joinedAt: membership?.joinedAt || null
    }
  });
});

/**
 * Leave a group (remove self from group)
 * DELETE /api/v1/groups/:groupId/membership
 */
exports.leaveGroup = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Check if group exists
  const group = await Group.findByPk(groupId);
  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check if user is the group admin
  if (group.groupAdminId === userId) {
    return next(new AppError('Group admin cannot leave the group. Please transfer admin rights first or delete the group.', 400));
  }

  // Find user's membership
  const membership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
      isActive: true
    }
  });

  if (!membership) {
    return next(new AppError('You are not a member of this group', 404));
  }

  // Remove membership (soft delete)
  await membership.update({ isActive: false });

  res.status(200).json({
    status: 'success',
    message: 'Successfully left the group'
  });
});

/**
 * Get available groups to join (groups user is not already a member of)
 * GET /api/v1/groups/available
 */
exports.getAvailableGroups = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  // Build where clause for groups
  const groupWhere = { isActive: true };
  if (search) {
    groupWhere[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Find groups where user is NOT a member
  const { count, rows: groups } = await Group.findAndCountAll({
    where: {
      ...groupWhere,
      id: {
        [Op.notIn]: Sequelize.literal(`(
          SELECT DISTINCT "group_id" 
          FROM "GroupMembers" 
          WHERE "user_id" = ${userId} 
          AND "is_active" = true
        )`)
      }
    },
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }
    ],
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM "GroupMembers" 
            WHERE "GroupMembers"."group_id" = "Group"."id" 
            AND "GroupMembers"."is_active" = true
          )`), 
          'membersCount'
        ]
      ]
    },
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: groups.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      groups
    }
  });
});

/**
 * Join a group
 * POST /api/v1/groups/:groupId/join
 */
exports.joinGroup = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Check if group exists and is active
  const group = await Group.findOne({
    where: { 
      id: groupId,
      isActive: true 
    }
  });

  if (!group) {
    return next(new AppError('Group not found or inactive', 404));
  }

  // Check if user is already a member
  const existingMembership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
      isActive: true
    }
  });

  if (existingMembership) {
    return next(new AppError('You are already a member of this group', 400));
  }

  // Add user to group as member
  const membership = await GroupMember.create({
    groupId,
    userId,
    role: 'member',
    addedBy: userId, // Self-join
    joinedAt: new Date(),
    isActive: true
  });

  // Get the created membership with user details
  const membershipWithDetails = await GroupMember.findByPk(membership.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      },
      {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'description']
      }
    ]
  });

  res.status(201).json({
    status: 'success',
    message: 'Successfully joined the group',
    data: {
      membership: membershipWithDetails
    }
  });
});
