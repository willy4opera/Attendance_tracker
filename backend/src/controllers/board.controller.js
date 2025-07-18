const { Board, TaskList, Task, User, Project, Department, BoardMember, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class BoardController {
  // Get all boards with filtering
  async getBoards(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        projectId,
        visibility,
        includeArchived = false,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Basic filters
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (projectId) {
        where.projectId = projectId;
      }

      if (visibility && visibility !== 'all') {
        where.visibility = visibility;
      }

      if (!includeArchived || includeArchived === 'false') {
        where.isArchived = false;
      }

      // Check user permissions
      if (req.user.role === 'user') {
        // Users can only see boards they're members of or public boards
        const userBoards = await BoardMember.findAll({
          where: { userId: req.user.id },
          attributes: ['boardId']
        });
        
        const userBoardIds = userBoards.map(bm => bm.boardId);
        
        where[Op.or] = [
          { id: { [Op.in]: userBoardIds } },
          { visibility: 'public' },
          { createdBy: req.user.id }
        ];
      }

      const { count, rows: boards } = await Board.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role'] },
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Add statistics to each board
      const boardsWithStats = await Promise.all(
        boards.map(async (board) => {
          const listCount = await TaskList.count({ 
            where: { boardId: board.id, isArchived: false } 
          });
          const taskCount = await Task.count({
            include: [{
              model: TaskList,
              as: "list",
              where: { boardId: board.id, isArchived: false }
            }]
          });

          return {
            ...board.toJSON(),
            stats: {
              listCount,
              taskCount,
              memberCount: board.members.length
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          boards: boardsWithStats,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching boards:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching boards',
        error: error.message
      });
    }
  }

  // Get board by ID
  async getBoardById(req, res) {
    try {
      const { id } = req.params;

      const board = await Board.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role'] },
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: TaskList,
            as: 'lists',
            where: { isArchived: false },
            required: false,
            order: [['position', 'ASC']],
            include: [
              {
                model: Task,
                as: 'tasks',
                where: { isArchived: false },
                required: false,
                order: [['position', 'ASC']],
                include: [
                  {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      // Check access permissions
      if (req.user.role === 'user') {
        const isMember = await BoardMember.findOne({
          where: { 
            boardId: id, 
            userId: req.user.id 
          }
        });

        if (!isMember && board.visibility !== 'public' && board.createdBy !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this board'
          });
        }
      }

      res.json({
        success: true,
        data: board
      });
    } catch (error) {
      logger.error('Error fetching board:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching board',
        error: error.message
      });
    }
  }

  // Create new board
  async createBoard(req, res) {
    try {
      const {
        name,
        description,
        projectId,
        departmentId,
        visibility = 'department',
        backgroundColor = '#0079BF',
        backgroundImage,
        settings = {
          cardCoverImages: true,
          voting: false,
          comments: true,
          invitations: 'members',
          selfJoin: false
        }
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Board name is required'
        });
      }

      // Verify project exists if projectId is provided
      if (projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        }
      }

      // Create board
      const board = await Board.create({
        name,
        description,
        projectId,
        departmentId: departmentId || req.user.departmentId,
        createdBy: req.user.id,
        visibility,
        backgroundColor,
        backgroundImage,
        settings
      });

      // Add creator as board owner
      await BoardMember.create({
        boardId: board.id,
        userId: req.user.id,
        role: 'owner'
      });

      // Create default lists
      const defaultLists = [
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 }
      ];

      await Promise.all(
        defaultLists.map(list => 
          TaskList.create({
            ...list,
            boardId: board.id
          })
        )
      );

      // Fetch complete board
      const fullBoard = await Board.findByPk(board.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role'] },
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      logger.info(`Board created: ${board.name} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Board created successfully',
        data: fullBoard
      });
    } catch (error) {
      logger.error('Error creating board:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating board',
        error: error.message
      });
    }
  }

  // Update board
  async updateBoard(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const board = await Board.findByPk(id);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      // Check permissions
      const member = await BoardMember.findOne({
        where: { 
          boardId: id, 
          userId: req.user.id 
        }
      });

      if (req.user.role === 'user' && (!member || (member.role !== 'owner' && member.role !== 'admin'))) {
        return res.status(403).json({
          success: false,
          message: 'Only board owners/admins can update board'
        });
      }

      await board.update(updates);

      const updatedBoard = await Board.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'members',
            through: { attributes: ['role'] },
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      logger.info(`Board updated: ${board.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Board updated successfully',
        data: updatedBoard
      });
    } catch (error) {
      logger.error('Error updating board:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating board',
        error: error.message
      });
    }
  }

  // Delete board
  async deleteBoard(req, res) {
    try {
      const { id } = req.params;

      const board = await Board.findByPk(id);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      // Check permissions
      const member = await BoardMember.findOne({
        where: { 
          boardId: id, 
          userId: req.user.id 
        }
      });

      if (req.user.role === 'user' && (!member || member.role !== 'owner')) {
        return res.status(403).json({
          success: false,
          message: 'Only board owners can delete board'
        });
      }

      await board.destroy();

      logger.info(`Board deleted: ${board.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Board deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting board:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting board',
        error: error.message
      });
    }
  }

  // Archive/Unarchive board
  async archiveBoard(req, res) {
    try {
      const { id } = req.params;

      const board = await Board.findByPk(id);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      await board.update({ isArchived: true });

      res.json({
        success: true,
        message: 'Board archived successfully',
        data: board
      });
    } catch (error) {
      logger.error('Error archiving board:', error);
      res.status(500).json({
        success: false,
        message: 'Error archiving board',
        error: error.message
      });
    }
  }

  async unarchiveBoard(req, res) {
    try {
      const { id } = req.params;

      const board = await Board.findByPk(id);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      await board.update({ isArchived: false });

      res.json({
        success: true,
        message: 'Board unarchived successfully',
        data: board
      });
    } catch (error) {
      logger.error('Error unarchiving board:', error);
      res.status(500).json({
        success: false,
        message: 'Error unarchiving board',
        error: error.message
      });
    }
  }

  // Get board lists
  async getBoardLists(req, res) {
    try {
      const { boardId } = req.params;

      const lists = await TaskList.findAll({
        where: { 
          boardId,
          isArchived: false 
        },
        include: [
          {
            model: Task,
            as: 'tasks',
            where: { isArchived: false },
            required: false,
            order: [['position', 'ASC']],
            include: [
              {
                model: User,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
              }
            ]
          }
        ],
        order: [['position', 'ASC']]
      });

      res.json({
        success: true,
        data: lists
      });
    } catch (error) {
      logger.error('Error fetching board lists:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching board lists',
        error: error.message
      });
    }
  }

  // Create board list
  async createBoardList(req, res) {
    try {
      const { boardId } = req.params;
      const { name, position } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'List name is required'
        });
      }

      const list = await TaskList.create({
        name,
        boardId,
        position: position || 0
      });

      res.status(201).json({
        success: true,
        message: 'List created successfully',
        data: list
      });
    } catch (error) {
      logger.error('Error creating board list:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating board list',
        error: error.message
      });
    }
  }

  // Update board list
  async updateBoardList(req, res) {
    try {
      const { boardId, listId } = req.params;
      const updates = req.body;

      const list = await TaskList.findOne({
        where: { id: listId, boardId }
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'List not found'
        });
      }

      await list.update(updates);

      res.json({
        success: true,
        message: 'List updated successfully',
        data: list
      });
    } catch (error) {
      logger.error('Error updating board list:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating board list',
        error: error.message
      });
    }
  }

  // Delete board list
  async deleteBoardList(req, res) {
    try {
      const { boardId, listId } = req.params;

      const list = await TaskList.findOne({
        where: { id: listId, boardId }
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'List not found'
        });
      }

      await list.destroy();

      res.json({
        success: true,
        message: 'List deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting board list:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting board list',
        error: error.message
      });
    }
  }

  // Get board members
  async getBoardMembers(req, res) {
    try {
      const { boardId } = req.params;

      const members = await BoardMember.findAll({
        where: { boardId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          }
        ]
      });

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      logger.error('Error fetching board members:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching board members',
        error: error.message
      });
    }
  }

  // Add board member
  async addBoardMember(req, res) {
    try {
      const { boardId } = req.params;
      const { userId, role = 'member' } = req.body;

      const member = await BoardMember.create({
        boardId,
        userId,
        role
      });

      const fullMember = await BoardMember.findByPk(member.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: fullMember
      });
    } catch (error) {
      logger.error('Error adding board member:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding board member',
        error: error.message
      });
    }
  }

  // Remove board member
  async removeBoardMember(req, res) {
    try {
      const { boardId, memberId } = req.params;

      const member = await BoardMember.findOne({
        where: { id: memberId, boardId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      await member.destroy();

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      logger.error('Error removing board member:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing board member',
        error: error.message
      });
    }
  }
}

module.exports = new BoardController();
