const express = require('express');
const groupController = require('../controllers/groupController');
const userGroupsController = require('../controllers/groups/userGroups');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User-specific group routes
router.get('/my-groups', userGroupsController.getUserGroups);
router.get('/available', userGroupsController.getAvailableGroups);
router.get('/users/:userId', userGroupsController.getUserGroupsById);
router.get('/:groupId/membership/check', userGroupsController.checkGroupMembership);
router.post('/:groupId/join', userGroupsController.joinGroup); // Join group route
router.post('/:groupId/leave', userGroupsController.leaveGroup); // Leave group route
router.delete('/:groupId/membership', userGroupsController.leaveGroup);

// Public routes (for authenticated users)
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroup);
router.get('/:id/members', groupController.getGroupMembers);

// Protected routes (admin, moderator, or group admin only)
router.post('/', restrictTo('admin', 'moderator'), groupController.createGroup);
router.patch('/:id', groupController.updateGroup); // Permission check inside controller
router.delete('/:id', groupController.deleteGroup); // Permission check inside controller

// Member management routes
router.post('/:id/members', groupController.addMember); // Permission check inside controller
router.delete('/:id/members/:userId', groupController.removeMember); // Permission check inside controller
router.patch('/:id/members/:userId/role', groupController.updateMemberRole); // Permission check inside controller

module.exports = router;
