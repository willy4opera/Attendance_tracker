const { Project, User, Department, Board, UserProject } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ProjectController {
  // Create project with dynamic fields
  async create(req, res) {
    try {
      const {
        name,
        code,
        description,
        projectManagerId,
        departmentId,
        startDate,
        endDate,
        budget,
        status = 'planning',
        metadata,
        teamMembers = [],
        ...dynamicFields
      } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      // Check for duplicate code
      const existingProject = await Project.findOne({ where: { code } });
      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: 'Project with this code already exists'
        });
      }

      // Create project with dynamic metadata
      const projectData = {
        name,
        code,
        description,
        projectManagerId,
        departmentId,
        startDate,
        endDate,
        budget,
        status,
        metadata: {
          ...metadata,
          customFields: dynamicFields,
          createdBy: req.user.id,
          createdAt: new Date()
        }
      };

      const project = await Project.create(projectData);

      // Add team members if provided
      if (teamMembers.length > 0) {
        const memberPromises = teamMembers.map(member => 
          UserProject.create({
            userId: member.userId,
            projectId: project.id,
            role: member.role || 'member'
          })
        );
        await Promise.all(memberPromises);
      }

      // Add creator as admin
      await UserProject.create({
        userId: req.user.id,
        projectId: project.id,
        role: 'lead'
      });

      // Fetch complete project
      const fullProject = await Project.findByPk(project.id, {
        include: [
          { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
          { 
            model: User, 
            as: 'members',
            through: { attributes: ['role', 'joinedAt'] },
            attributes: ['id', 'firstName', 'lastName', 'email', 'role']
          }
        ]
      });

      logger.info(`Project created: ${project.name} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: fullProject
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating project',
        error: error.message
      });
    }
  }

  // Get all projects with dynamic filtering
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        departmentId,
        projectManagerId,
        startDateFrom,
        startDateTo,
        budgetMin,
        budgetMax,
        includeMembers = false,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        ...customFilters
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Basic filters
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      if (departmentId) {
        where.departmentId = departmentId;
      }

      if (projectManagerId) {
        where.projectManagerId = projectManagerId;
      }

      // Date range filters
      if (startDateFrom || startDateTo) {
        where.startDate = {};
        if (startDateFrom) where.startDate[Op.gte] = startDateFrom;
        if (startDateTo) where.startDate[Op.lte] = startDateTo;
      }

      // Budget range filters
      if (budgetMin || budgetMax) {
        where.budget = {};
        if (budgetMin) where.budget[Op.gte] = budgetMin;
        if (budgetMax) where.budget[Op.lte] = budgetMax;
      }

      // Apply custom filters to metadata
      if (Object.keys(customFilters).length > 0) {
        where[Op.and] = Object.entries(customFilters).map(([key, value]) => ({
          [`metadata.customFields.${key}`]: value
        }));
      }

      // Check user permissions
      if (req.user.role === 'user') {
        // Users can only see projects they're members of
        const userProjects = await UserProject.findAll({
          where: { userId: req.user.id, isActive: true },
          attributes: ['projectId']
        });
        where.id = userProjects.map(up => up.projectId);
      }

      // Build include array
      const include = [
        { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ];

      if (includeMembers === 'true') {
        include.push({
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt', 'isActive'] },
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        });
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Add statistics to each project
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const boardCount = await Board.count({ where: { projectId: project.id } });
          const activeMemberCount = includeMembers === 'true' 
            ? project.members.filter(m => m.UserProject.isActive).length
            : await UserProject.count({ where: { projectId: project.id, isActive: true } });

          return {
            ...project.toJSON(),
            stats: {
              boardCount,
              activeMemberCount,
              progress: calculateProjectProgress(project)
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          projects: projectsWithStats,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching projects',
        error: error.message
      });
    }
  }

  // Get project by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id, {
        include: [
          { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role', 'joinedAt', 'leftAt', 'isActive'] },
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture']
          },
          {
            model: Board,
            as: 'boards',
            attributes: ['id', 'name', 'visibility', 'isArchived'],
            include: [
              { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check access permissions
      if (req.user.role === 'user') {
        const isMember = await UserProject.findOne({
          where: { 
            projectId: id, 
            userId: req.user.id,
            isActive: true
          }
        });

        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this project'
          });
        }
      }

      // Calculate project statistics
      const stats = {
        memberCount: project.members.length,
        activeMemberCount: project.members.filter(m => m.UserProject.isActive).length,
        boardCount: project.boards.length,
        activeBoardCount: project.boards.filter(b => !b.isArchived).length,
        progress: calculateProjectProgress(project),
        daysRemaining: calculateDaysRemaining(project.endDate),
        budgetUtilization: await calculateBudgetUtilization(project)
      };

      res.json({
        success: true,
        data: {
          ...project.toJSON(),
          stats
        }
      });
    } catch (error) {
      logger.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching project',
        error: error.message
      });
    }
  }

  // Update project with dynamic fields
  async update(req, res) {
    try {
      const { id } = req.params;
      const { metadata, teamMembers, ...updates } = req.body;

      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (req.user.role === 'user' && project.projectManagerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only project manager or admin can update project'
        });
      }

      // Handle dynamic fields
      if (metadata || updates.customFields) {
        const existingMetadata = project.metadata || {};
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
      }

      // Check for duplicate code if updating
      if (updates.code && updates.code !== project.code) {
        const duplicate = await Project.findOne({
          where: { code: updates.code }
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: 'Project with this code already exists'
          });
        }
      }

      await project.update(updates);

      // Update team members if provided
      if (teamMembers) {
        // Remove members not in the new list
        const newMemberIds = teamMembers.map(m => m.userId);
        await UserProject.update(
          { isActive: false, leftAt: new Date() },
          { where: { 
            projectId: id,
            userId: { [Op.notIn]: newMemberIds }
          }}
        );

        // Add or update members
        for (const member of teamMembers) {
          await UserProject.upsert({
            userId: member.userId,
            projectId: id,
            role: member.role || 'member',
            isActive: true,
            leftAt: null
          });
        }
      }

      const updatedProject = await Project.findByPk(id, {
        include: [
          { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role', 'joinedAt', 'isActive'] },
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      logger.info(`Project updated: ${project.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating project',
        error: error.message
      });
    }
  }

  // Delete project
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      const project = await Project.findByPk(id, {
        include: [
          { model: Board, as: 'boards' }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete projects'
        });
      }

      // Check for active boards
      if (!force && project.boards?.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete project with active boards',
          data: {
            boardCount: project.boards.length
          }
        });
      }

      if (force === 'true') {
        await project.destroy();
        logger.info(`Project hard deleted: ${project.name} by user ${req.user.id}`);
      } else {
        await project.update({ 
          isActive: false,
          status: 'cancelled' 
        });
        logger.info(`Project soft deleted: ${project.name} by user ${req.user.id}`);
      }

      res.json({
        success: true,
        message: `Project ${force === 'true' ? 'permanently deleted' : 'cancelled'} successfully`
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting project',
        error: error.message
      });
    }
  }

  // Add/Remove project members
  async manageMember(req, res) {
    try {
      const { id } = req.params;
      const { userId, role = 'member', action = 'add' } = req.body;

      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (action === 'add') {
        await UserProject.upsert({
          userId,
          projectId: id,
          role,
          isActive: true,
          joinedAt: new Date()
        });
        logger.info(`User ${userId} added to project ${id} by ${req.user.id}`);
      } else if (action === 'remove') {
        await UserProject.update(
          { isActive: false, leftAt: new Date() },
          { where: { userId, projectId: id } }
        );
        logger.info(`User ${userId} removed from project ${id} by ${req.user.id}`);
      } else if (action === 'update') {
        await UserProject.update(
          { role },
          { where: { userId, projectId: id } }
        );
        logger.info(`User ${userId} role updated in project ${id} by ${req.user.id}`);
      }

      res.json({
        success: true,
        message: `Member ${action}ed successfully`
      });
    } catch (error) {
      logger.error('Error managing project member:', error);
      res.status(500).json({
        success: false,
        message: 'Error managing project member',
        error: error.message
      });
    }
  }
}

// Helper functions
function calculateProjectProgress(project) {
  if (!project.startDate || !project.endDate) return 0;
  
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = new Date().getTime();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  return Math.round(((now - start) / (end - start)) * 100);
}

function calculateDaysRemaining(endDate) {
  if (!endDate) return null;
  
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  
  return days > 0 ? days : 0;
}

async function calculateBudgetUtilization(project) {
  // This would connect to actual expense tracking
  // For now, return mock data
  return {
    allocated: project.budget || 0,
    spent: 0,
    remaining: project.budget || 0,
    percentage: 0
  };
}

module.exports = new ProjectController();
