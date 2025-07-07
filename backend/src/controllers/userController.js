const { User, Department, Project, Session, Attendance, UserProject, Task } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

class UserController {
  // Create user with dynamic fields
  async create(req, res) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role = 'user',
        departmentId,
        profilePicture,
        preferences,
        metadata,
        ...dynamicFields
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Generate verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create user with dynamic metadata
      const userData = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role,
        departmentId,
        profilePicture,
        emailVerificationToken,
        emailVerificationExpires,
        preferences: {
          ...preferences,
          customSettings: dynamicFields.customSettings || {}
        },
        metadata: {
          ...metadata,
          customFields: dynamicFields,
          createdBy: req.user.id,
          createdAt: new Date()
        }
      };

      const user = await User.create(userData);

      // Send welcome email with verification
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Welcome! Please verify your email',
        template: 'welcome',
        data: {
          firstName: user.firstName,
          verificationLink,
          verificationCode: emailVerificationToken.slice(-6).toUpperCase()
        }
      });

      // Get user without sensitive data
      const userResponse = await User.findByPk(user.id, {
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
        ]
      });

      logger.info(`User created: ${user.email} by admin ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  // Get all users with dynamic filtering
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        departmentId,
        isActive,
        isEmailVerified,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        includeStats = false,
        ...customFilters
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Basic filters
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phoneNumber: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (role && role !== 'all') {
        where.role = role;
      }

      if (departmentId) {
        where.departmentId = departmentId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (isEmailVerified !== undefined) {
        where.isEmailVerified = isEmailVerified === 'true';
      }

      // Apply custom filters to metadata
      if (Object.keys(customFilters).length > 0) {
        where[Op.and] = Object.entries(customFilters).map(([key, value]) => ({
          [`metadata.customFields.${key}`]: value
        }));
      }

      // Build include array
      const include = [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ];

      if (includeStats === 'true') {
        include.push(
          { model: Project, as: 'projects', through: { attributes: ['role'] } },
          { model: Attendance, as: 'attendances', attributes: ['id', 'status'] }
        );
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Calculate stats if requested
      let usersWithStats = users;
      if (includeStats === 'true') {
        usersWithStats = await Promise.all(
          users.map(async (user) => {
            const totalSessions = await Session.count();
            const attendedSessions = user.attendances?.filter(a => a.status === 'present').length || 0;
            const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions * 100).toFixed(2) : 0;

            return {
              ...user.toJSON(),
              stats: {
                projectCount: user.projects?.length || 0,
                totalSessions,
                attendedSessions,
                attendanceRate: parseFloat(attendanceRate),
                lastActivity: user.lastLogin
              }
            };
          })
        );
      }

      res.json({
        success: true,
        data: {
          users: usersWithStats,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  }

  // Get user by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { includeFullStats = true } = req.query;

      const include = [
        { model: Department, as: 'department' },
        {
          model: Project,
          as: 'projects',
          through: { attributes: ['role', 'joinedAt', 'isActive'] },
          include: [
            { model: Department, as: 'department', attributes: ['name'] }
          ]
        }
      ];

      const user = await User.findByPk(id, { include });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      let responseData = user.toJSON();

      if (includeFullStats === 'true') {
        // Calculate comprehensive statistics
        const attendances = await Attendance.findAll({
          where: { userId: id },
          include: [{ model: Session, as: 'session' }]
        });

        const taskStats = await Task.count({
          where: { 
            assignedTo: { [Op.contains]: [parseInt(id)] }
          }
        });

        const completedTasks = await Task.count({
          where: {
            assignedTo: { [Op.contains]: [parseInt(id)] },
            status: 'done'
          }
        });

        responseData.stats = {
          attendance: {
            total: attendances.length,
            present: attendances.filter(a => a.status === 'present').length,
            late: attendances.filter(a => a.status === 'late').length,
            absent: attendances.filter(a => a.status === 'absent').length,
            rate: attendances.length > 0 
              ? ((attendances.filter(a => a.status === 'present').length / attendances.length) * 100).toFixed(2)
              : 0
          },
          projects: {
            total: user.projects.length,
            active: user.projects.filter(p => p.status === 'active').length,
            asLead: user.projects.filter(p => p.UserProject.role === 'lead').length
          },
          tasks: {
            assigned: taskStats,
            completed: completedTasks,
            completionRate: taskStats > 0 
              ? ((completedTasks / taskStats) * 100).toFixed(2)
              : 0
          },
          activity: {
            lastLogin: user.lastLogin,
            accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
          }
        };
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  }

  // Update user with dynamic fields
  async update(req, res) {
    try {
      const { id } = req.params;
      const { password, metadata, preferences, ...updates } = req.body;

      // Check permissions
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Handle email change
      if (updates.email && updates.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updates.email } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use'
          });
        }
        // Reset email verification
        updates.isEmailVerified = false;
        updates.emailVerificationToken = crypto.randomBytes(32).toString('hex');
        updates.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      // Handle password change
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      // Handle dynamic fields and preferences
      if (metadata || updates.customFields || preferences) {
        const existingMetadata = user.metadata || {};
        const existingPreferences = user.preferences || {};
        const newCustomFields = updates.customFields || {};
        delete updates.customFields;

        updates.metadata = {
          ...existingMetadata,
          ...metadata,
          customFields: {
            ...existingMetadata.customFields,
            ...newCustomFields
          },
          lastModifiedBy: req.user.id,
          lastModifiedAt: new Date()
        };

        if (preferences) {
          updates.preferences = {
            ...existingPreferences,
            ...preferences
          };
        }
      }

      await user.update(updates);

      const updatedUser = await User.findByPk(id, {
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
        ]
      });

      logger.info(`User updated: ${user.email} by ${req.user.id}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  // Change user role
  async changeRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'moderator', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ 
        role,
        metadata: {
          ...user.metadata,
          roleChangedBy: req.user.id,
          roleChangedAt: new Date()
        }
      });

      logger.info(`User role changed: ${user.email} to ${role} by ${req.user.id}`);

      res.json({
        success: true,
        message: `User role changed to ${role}`,
        data: { id: user.id, email: user.email, role }
      });
    } catch (error) {
      logger.error('Error changing user role:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing user role',
        error: error.message
      });
    }
  }

  // Change user department
  async changeDepartment(req, res) {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (departmentId) {
        const department = await Department.findByPk(departmentId);
        if (!department) {
          return res.status(404).json({
            success: false,
            message: 'Department not found'
          });
        }
      }

      const oldDepartmentId = user.departmentId;
      await user.update({ 
        departmentId,
        metadata: {
          ...user.metadata,
          departmentHistory: [
            ...(user.metadata?.departmentHistory || []),
            {
              from: oldDepartmentId,
              to: departmentId,
              changedBy: req.user.id,
              changedAt: new Date()
            }
          ]
        }
      });

      const updatedUser = await User.findByPk(id, {
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
        ]
      });

      logger.info(`User department changed: ${user.email} from ${oldDepartmentId} to ${departmentId} by ${req.user.id}`);

      res.json({
        success: true,
        message: 'User department changed successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error changing user department:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing user department',
        error: error.message
      });
    }
  }

  // Activate/Deactivate user
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ 
        isActive,
        metadata: {
          ...user.metadata,
          statusChangedBy: req.user.id,
          statusChangedAt: new Date()
        }
      });

      logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.email} by ${req.user.id}`);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { id: user.id, email: user.email, isActive }
      });
    } catch (error) {
      logger.error('Error toggling user status:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling user status',
        error: error.message
      });
    }
  }

  // Delete user
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (force === 'true') {
        // Hard delete - remove all associations first
        await Attendance.destroy({ where: { userId: id } });
        await UserProject.destroy({ where: { userId: id } });
        await user.destroy();
        logger.info(`User hard deleted: ${user.email} by ${req.user.id}`);
      } else {
        // Soft delete
        await user.update({ 
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
          metadata: {
            ...user.metadata,
            deletedBy: req.user.id,
            deletedAt: new Date(),
            originalEmail: user.email
          }
        });
        logger.info(`User soft deleted: ${user.email} by ${req.user.id}`);
      }

      res.json({
        success: true,
        message: `User ${force === 'true' ? 'permanently deleted' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  // Bulk operations
  async bulkUpdate(req, res) {
    try {
      const { userIds, updates } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      // Prevent bulk password updates
      delete updates.password;
      delete updates.email;

      // Add metadata for bulk update
      updates.metadata = {
        lastBulkUpdate: {
          by: req.user.id,
          at: new Date(),
          fields: Object.keys(updates)
        }
      };

      const [updatedCount] = await User.update(updates, {
        where: { id: userIds }
      });

      logger.info(`Bulk update: ${updatedCount} users updated by ${req.user.id}`);

      res.json({
        success: true,
        message: `${updatedCount} users updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error in bulk update:', error);
      res.status(500).json({
        success: false,
        message: 'Error in bulk update',
        error: error.message
      });
    }
  }

  // Get user statistics
  async getStatistics(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const verifiedUsers = await User.count({ where: { isEmailVerified: true } });
      
      const usersByRole = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      const usersByDepartment = await User.findAll({
        attributes: [
          'departmentId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [{
          model: Department,
          as: 'department',
          attributes: ['name']
        }],
        group: ['departmentId', 'department.id', 'department.name']
      });

      const recentUsers = await User.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          overview: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            verified: verifiedUsers,
            unverified: totalUsers - verifiedUsers
          },
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          byDepartment: usersByDepartment.map(item => ({
            departmentId: item.departmentId,
            departmentName: item.department?.name || 'No Department',
            count: parseInt(item.dataValues.count)
          })),
          recentUsers
        }
      });
    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
        error: error.message
      });
    }
  }

  // Export users
  async exportUsers(req, res) {
    try {
      const { format = 'csv' } = req.query;
      
      // Apply same filters as getAll
      const users = await User.findAll({
        include: [
          { model: Department, as: 'department', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'csv') {
        const csv = [
          ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Department', 'Status', 'Verified', 'Created At'].join(','),
          ...users.map(user => [
            user.id,
            user.email,
            user.firstName,
            user.lastName,
            user.role,
            user.department?.name || 'N/A',
            user.isActive ? 'Active' : 'Inactive',
            user.isEmailVerified ? 'Yes' : 'No',
            user.createdAt.toISOString()
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString()}.csv`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: users
        });
      }
    } catch (error) {
      logger.error('Error exporting users:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting users',
        error: error.message
      });
    }
  }

  // Get user profile (for logged-in user)
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          { model: Department, as: 'department' },
          { 
            model: Project, 
            as: 'projects',
            through: { attributes: ['role'] }
          }
        ]
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }

  // Update profile (for logged-in user)
  async updateProfile(req, res) {
    try {
      const updates = req.body;
      
      // Prevent role and critical field updates
      delete updates.role;
      delete updates.email;
      delete updates.isActive;
      delete updates.isEmailVerified;

      await req.user.update(updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: req.user
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  }

  // Get dashboard stats for a specific user
  async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get user's sessions
      const allSessions = await Session.findAll({
        where: {
          [Op.or]: [
            { createdBy: userId },
            { '$attendances.userId$': userId }
          ]
        },
        include: [{
          model: Attendance,
          as: 'attendances',
          required: false
        }]
      });

      // Get attendance records
      const attendances = await Attendance.findAll({
        where: { userId },
        include: [{
          model: Session,
          as: 'session',
          attributes: ['title', 'startTime', 'endTime']
        }]
      });

      // Today's sessions
      const todaysSessions = await Session.count({
        where: {
          startTime: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });

      // Calculate stats
      const totalSessions = allSessions.length;
      const attendedSessions = attendances.filter(a => a.status === 'present').length;
      const attendanceRate = totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : 0;

      // Recent attendance
      const recentAttendance = attendances
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(a => ({
          sessionTitle: a.session.title,
          date: a.createdAt,
          status: a.status,
          duration: a.duration
        }));

      // Role-specific stats
      let roleSpecificStats = {};
      
      if (req.user.role === 'admin') {
        roleSpecificStats = {
          totalUsers: await User.count(),
          activeUsers: await User.count({ where: { isActive: true } }),
          totalDepartments: await Department.count(),
          totalProjects: await Project.count({ where: { status: 'active' } })
        };
      } else if (req.user.role === 'moderator') {
        roleSpecificStats = {
          managedSessions: await Session.count({ where: { createdBy: userId } }),
          totalAttendees: await Attendance.count({
            include: [{
              model: Session,
              as: 'session',
              where: { createdBy: userId }
            }]
          })
        };
      }

      res.json({
        success: true,
        data: {
          overview: {
            totalSessions,
            attendedSessions,
            missedSessions: totalSessions - attendedSessions,
            attendanceRate: parseFloat(attendanceRate),
            todaysSessions
          },
          recentAttendance,
          ...roleSpecificStats
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard stats',
        error: error.message
      });
    }
  }

  async getMe(req, res) {
    console.log('=== getMe called ===');
    console.log('req.user:', req.user);
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error in getMe:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  }


  async deleteMe(req, res) {
    try {
      // Soft delete - just deactivate the account
      await User.update(
        { 
          isActive: false,
          metadata: sequelize.fn('jsonb_set', 
            sequelize.col('metadata'), 
            '{deactivated}', 
            JSON.stringify({
              at: new Date(),
              by: 'self'
            })
          )
        },
        { where: { id: req.user.id } }
      );

      res.status(204).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      logger.error('Error in deleteMe:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating account',
        error: error.message
      });
    }
  }

}

module.exports = new UserController();
