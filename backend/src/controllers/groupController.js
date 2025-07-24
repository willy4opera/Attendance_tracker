const { Op, Sequelize } = require('sequelize');
const { Group, GroupMember, User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all groups with pagination and filtering
exports.getAllGroups = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows: groups } = await Group.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: GroupMember,
        as: 'groupMemberships',
        attributes: [],
        where: { isActive: true },
        required: false
      }
    ],
    attributes: {
      include: [
        [Sequelize.fn('COUNT', Sequelize.col('groupMemberships.id')), 'memberCount']
      ]
    },
    group: ['Group.id', 'groupAdmin.id'],
    subQuery: false,
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: groups.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count.length / limit),
      totalResults: count.length
    },
    data: {
      groups
    }
  });
});

// Get single group by ID
exports.getGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findByPk(id, {
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture'],
        through: {
          attributes: ['role', 'joinedAt', 'isActive'],
          where: { isActive: true }
        }
      }
    ]
  });

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      group
    }
  });
});

// Create new group
exports.createGroup = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const groupAdminId = req.user.id;

  // Check if user has permission to create groups
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(new AppError('You do not have permission to create groups', 403));
  }

  // Check if group name already exists
  const existingGroup = await Group.findOne({
    where: { name: { [Op.iLike]: name } }
  });

  if (existingGroup) {
    return next(new AppError('Group with this name already exists', 400));
  }

  // Create the group
  const group = await Group.create({
    name,
    description,
    groupAdminId
  });

  // Add the group admin as a member with admin role
  await GroupMember.create({
    groupId: group.id,
    userId: groupAdminId,
    role: 'admin',
    addedBy: groupAdminId
  });

  // Fetch the complete group data
  const completeGroup = await Group.findByPk(group.id, {
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  res.status(201).json({
    status: 'success',
    data: {
      group: completeGroup
    }
  });
});

// Update group
exports.updateGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && group.groupAdminId !== req.user.id) {
    return next(new AppError('You do not have permission to update this group', 403));
  }

  // Check if name already exists (exclude current group)
  if (name && name !== group.name) {
    const existingGroup = await Group.findOne({
      where: { 
        name: { [Op.iLike]: name },
        id: { [Op.ne]: id }
      }
    });

    if (existingGroup) {
      return next(new AppError('Group with this name already exists', 400));
    }
  }

  // Update the group
  const updatedGroup = await group.update({
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(isActive !== undefined && { isActive })
  });

  // Fetch complete updated data
  const completeGroup = await Group.findByPk(updatedGroup.id, {
    include: [
      {
        model: User,
        as: 'groupAdmin',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: {
      group: completeGroup
    }
  });
});

// Delete group
exports.deleteGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && group.groupAdminId !== req.user.id) {
    return next(new AppError('You do not have permission to delete this group', 403));
  }

  // Delete all group memberships first
  await GroupMember.destroy({
    where: { groupId: id }
  });

  // Delete the group
  await group.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add member to group
exports.addMember = catchAsync(async (req, res, next) => {
  const { id } = req.params; // group id
  const { userId, role = 'member' } = req.body;

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && group.groupAdminId !== req.user.id) {
    return next(new AppError('You do not have permission to add members to this group', 403));
  }

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if user is already a member
  const existingMember = await GroupMember.findOne({
    where: { groupId: id, userId }
  });

  if (existingMember) {
    if (existingMember.isActive) {
      return next(new AppError('User is already a member of this group', 400));
    } else {
      // Reactivate membership
      await existingMember.update({
        isActive: true,
        role,
        addedBy: req.user.id,
        joinedAt: new Date()
      });
    }
  } else {
    // Create new membership
    await GroupMember.create({
      groupId: id,
      userId,
      role,
      addedBy: req.user.id
    });
  }

  res.status(201).json({
    status: 'success',
    message: 'Member added to group successfully'
  });
});

// Remove member from group
exports.removeMember = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && group.groupAdminId !== req.user.id) {
    return next(new AppError('You do not have permission to remove members from this group', 403));
  }

  // Cannot remove the group admin
  if (parseInt(userId) === group.groupAdminId) {
    return next(new AppError('Cannot remove the group admin from the group', 400));
  }

  const membership = await GroupMember.findOne({
    where: { groupId: id, userId, isActive: true }
  });

  if (!membership) {
    return next(new AppError('User is not a member of this group', 404));
  }

  // Soft delete by setting isActive to false
  await membership.update({ isActive: false });

  res.status(200).json({
    status: 'success',
    message: 'Member removed from group successfully'
  });
});

// Get group members
exports.getGroupMembers = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  const { count, rows: members } = await GroupMember.findAndCountAll({
    where: { groupId: id, isActive: true },
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      },
      {
        model: User,
        as: 'addedByUser',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    order: [['joinedAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: members.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      members
    }
  });
});

// Update member role
exports.updateMemberRole = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    return next(new AppError('Invalid role. Must be either admin or member', 400));
  }

  const group = await Group.findByPk(id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator' && group.groupAdminId !== req.user.id) {
    return next(new AppError('You do not have permission to update member roles in this group', 403));
  }

  const membership = await GroupMember.findOne({
    where: { groupId: id, userId, isActive: true }
  });

  if (!membership) {
    return next(new AppError('User is not a member of this group', 404));
  }

  await membership.update({ role });

  res.status(200).json({
    status: 'success',
    message: 'Member role updated successfully'
  });
});
