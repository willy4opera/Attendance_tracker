const { Department, User, Project, Board } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DepartmentController {
  // Create department with dynamic fields
  async create(req, res) {
    try {
      const { name, code, description, headOfDepartmentId, parentDepartmentId, metadata, ...dynamicFields } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      // Check if department with same code exists
      const existingDept = await Department.findOne({ where: { code: code.toUpperCase() } });
      if (existingDept) {
        return res.status(409).json({
          success: false,
          message: 'Department with this code already exists'
        });
      }

      // Create department with dynamic metadata
      const departmentData = {
        name,
        code: code.toUpperCase(),
        description,
        headOfDepartmentId,
        parentDepartmentId,
        metadata: {
          ...metadata,
          customFields: dynamicFields,
          createdBy: req.user.id,
          createdAt: new Date()
        }
      };

      const department = await Department.create(departmentData);

      // Fetch with associations
      const fullDepartment = await Department.findByPk(department.id, {
        include: [
          { model: User, as: 'headOfDepartment', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Department, as: 'parentDepartment', attributes: ['id', 'name', 'code'] }
        ]
      });

      logger.info(`Department created: ${department.name} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: fullDepartment
      });
    } catch (error) {
      logger.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating department',
        error: error.message
      });
    }
  }

  // Get all departments with dynamic filtering
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        parentDepartmentId,
        sortBy = 'name',
        sortOrder = 'ASC',
        includeStats = false,
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

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (parentDepartmentId) {
        where.parentDepartmentId = parentDepartmentId === 'null' ? null : parentDepartmentId;
      }

      // Apply custom filters to metadata
      if (Object.keys(customFilters).length > 0) {
        where[Op.and] = Object.entries(customFilters).map(([key, value]) => ({
          [`metadata.customFields.${key}`]: value
        }));
      }

      // Build include array
      const include = [
        { model: User, as: 'headOfDepartment', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'parentDepartment', attributes: ['id', 'name', 'code'] }
      ];

      if (includeStats === 'true') {
        include.push(
          { model: User, as: 'users', attributes: ['id'] },
          { model: Project, as: 'projects', attributes: ['id'] },
          { model: Board, as: 'boards', attributes: ['id'] }
        );
      }

      const { count, rows: departments } = await Department.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Calculate stats if requested
      const departmentsWithStats = includeStats === 'true' 
        ? departments.map(dept => ({
            ...dept.toJSON(),
            stats: {
              userCount: dept.users?.length || 0,
              projectCount: dept.projects?.length || 0,
              boardCount: dept.boards?.length || 0
            }
          }))
        : departments;

      res.json({
        success: true,
        data: {
          departments: departmentsWithStats,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching departments',
        error: error.message
      });
    }
  }

  // Get department by ID with full details
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { includeStats = true } = req.query;

      const include = [
        { model: User, as: 'headOfDepartment', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'parentDepartment', attributes: ['id', 'name', 'code'] },
        { model: Department, as: 'subDepartments', attributes: ['id', 'name', 'code', 'isActive'] }
      ];

      if (includeStats === 'true') {
        include.push(
          { 
            model: User, 
            as: 'users', 
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive']
          },
          { 
            model: Project, 
            as: 'projects',
            attributes: ['id', 'name', 'code', 'status', 'startDate', 'endDate']
          },
          {
            model: Board,
            as: 'boards',
            attributes: ['id', 'name', 'visibility', 'isArchived']
          }
        );
      }

      const department = await Department.findByPk(id, { include });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      const response = {
        ...department.toJSON(),
        stats: includeStats === 'true' ? {
          userCount: department.users?.length || 0,
          activeUsers: department.users?.filter(u => u.isActive).length || 0,
          projectCount: department.projects?.length || 0,
          activeProjects: department.projects?.filter(p => p.status === 'active').length || 0,
          boardCount: department.boards?.length || 0,
          subDepartmentCount: department.subDepartments?.length || 0
        } : undefined
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error fetching department:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department',
        error: error.message
      });
    }
  }

  // Update department with dynamic fields
  async update(req, res) {
    try {
      const { id } = req.params;
      const { metadata, ...updates } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Handle dynamic fields
      if (metadata || updates.customFields) {
        const existingMetadata = department.metadata || {};
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

      // Update code to uppercase if provided
      if (updates.code) {
        updates.code = updates.code.toUpperCase();
        
        // Check for duplicate code
        const duplicate = await Department.findOne({
          where: { 
            code: updates.code,
            id: { [Op.ne]: id }
          }
        });
        
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: 'Department with this code already exists'
          });
        }
      }

      await department.update(updates);

      const updatedDepartment = await Department.findByPk(id, {
        include: [
          { model: User, as: 'headOfDepartment', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Department, as: 'parentDepartment', attributes: ['id', 'name', 'code'] }
        ]
      });

      logger.info(`Department updated: ${department.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: updatedDepartment
      });
    } catch (error) {
      logger.error('Error updating department:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating department',
        error: error.message
      });
    }
  }

  // Delete department (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      const department = await Department.findByPk(id, {
        include: [
          { model: User, as: 'users' },
          { model: Project, as: 'projects' },
          { model: Department, as: 'subDepartments' }
        ]
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Check for dependencies
      if (!force && (department.users?.length > 0 || department.projects?.length > 0 || department.subDepartments?.length > 0)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with active users, projects, or sub-departments',
          data: {
            userCount: department.users?.length || 0,
            projectCount: department.projects?.length || 0,
            subDepartmentCount: department.subDepartments?.length || 0
          }
        });
      }

      if (force === 'true') {
        // Hard delete
        await department.destroy();
        logger.info(`Department hard deleted: ${department.name} by user ${req.user.id}`);
      } else {
        // Soft delete
        await department.update({ isActive: false });
        logger.info(`Department soft deleted: ${department.name} by user ${req.user.id}`);
      }

      res.json({
        success: true,
        message: `Department ${force === 'true' ? 'permanently deleted' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Error deleting department:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting department',
        error: error.message
      });
    }
  }

  // Get department hierarchy
  async getHierarchy(req, res) {
    try {
      const buildHierarchy = (departments, parentId = null) => {
        return departments
          .filter(dept => dept.parentDepartmentId === parentId)
          .map(dept => ({
            ...dept.toJSON(),
            children: buildHierarchy(departments, dept.id)
          }));
      };

      const departments = await Department.findAll({
        where: { isActive: true },
        include: [
          { model: User, as: 'headOfDepartment', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['name', 'ASC']]
      });

      const hierarchy = buildHierarchy(departments);

      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      logger.error('Error fetching department hierarchy:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department hierarchy',
        error: error.message
      });
    }
  }

  // Bulk operations
  async bulkUpdate(req, res) {
    try {
      const { departmentIds, updates } = req.body;

      if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Department IDs array is required'
        });
      }

      // Add metadata for bulk update
      if (updates) {
        updates.metadata = {
          ...updates.metadata,
          lastBulkUpdate: {
            by: req.user.id,
            at: new Date()
          }
        };
      }

      const [updatedCount] = await Department.update(updates, {
        where: { id: departmentIds }
      });

      logger.info(`Bulk update: ${updatedCount} departments updated by user ${req.user.id}`);

      res.json({
        success: true,
        message: `${updatedCount} departments updated successfully`,
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
}

module.exports = new DepartmentController();
