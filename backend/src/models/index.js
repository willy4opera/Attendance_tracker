const { sequelize, Sequelize } = require('../config/database');

// Import models
const User = require('./user.model');
const Session = require('./session.model');
const Attendance = require('./attendance.model');
const Attachment = require('./attachment.model');
const Notification = require('./notification.model');
const RecurringSession = require('./recurringSession.model');
const Department = require('./department.model');
const Project = require('./project.model');
const UserProject = require('./userProject.model');
const Board = require('./board.model');
const TaskList = require('./taskList.model');
const Task = require('./task.model');
const TaskComment = require('./taskComment.model');
const TaskActivity = require('./taskActivity.model');
const TaskAttachment = require('./taskAttachment.model');
const BoardMember = require('./boardMember.model');
const Label = require('./label.model');

// Import new social models
const CommentLike = require('./commentLike.model');
const UserFollowing = require('./userFollowing.model');
const TaskWatcher = require('./taskWatcher.model');

// User associations
User.hasMany(Session, { foreignKey: 'facilitatorId', as: 'createdSessions' });
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
User.belongsToMany(Project, { through: UserProject, foreignKey: 'userId', as: 'projects' });
User.hasMany(Board, { foreignKey: 'createdBy', as: 'createdBoards' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
User.hasMany(TaskComment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(TaskActivity, { foreignKey: 'userId', as: 'activities' });
User.belongsToMany(Board, { through: BoardMember, foreignKey: 'userId', as: 'boards' });

// User social associations
User.hasMany(CommentLike, { foreignKey: 'userId', as: 'commentLikes' });
User.hasMany(TaskWatcher, { foreignKey: 'userId', as: 'watchedTasks' });
User.belongsToMany(User, { 
  through: UserFollowing, 
  foreignKey: 'followerId', 
  otherKey: 'followedId', 
  as: 'following' 
});
User.belongsToMany(User, { 
  through: UserFollowing, 
  foreignKey: 'followedId', 
  otherKey: 'followerId', 
  as: 'followers' 
});

// Department associations
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });
Department.belongsTo(User, { foreignKey: 'headOfDepartmentId', as: 'headOfDepartment' });
Department.belongsTo(Department, { foreignKey: 'parentDepartmentId', as: 'parentDepartment' });
Department.hasMany(Department, { foreignKey: 'parentDepartmentId', as: 'subDepartments' });
Department.hasMany(Project, { foreignKey: 'departmentId', as: 'projects' });
Department.hasMany(Board, { foreignKey: 'departmentId', as: 'boards' });

// Project associations
Project.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Project.belongsTo(User, { foreignKey: 'projectManagerId', as: 'projectManager' });
Project.belongsToMany(User, { through: UserProject, foreignKey: 'projectId', as: 'members' });
Project.hasMany(Board, { foreignKey: 'projectId', as: 'boards' });

// Board associations
Board.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Board.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Board.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Board.hasMany(TaskList, { foreignKey: 'boardId', as: 'lists' });
Board.belongsToMany(User, { through: BoardMember, foreignKey: 'boardId', as: 'members' });
Board.hasMany(Label, { foreignKey: 'boardId', as: 'labels' });

// TaskList associations
TaskList.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
TaskList.hasMany(Task, { foreignKey: 'taskListId', as: 'tasks' });

// Task associations
Task.belongsTo(TaskList, { foreignKey: 'taskListId', as: 'list' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Task.hasMany(TaskComment, { foreignKey: 'taskId', as: 'comments' });
Task.hasMany(TaskActivity, { foreignKey: 'taskId', as: 'activities' });
Task.hasMany(TaskAttachment, { foreignKey: 'taskId', as: 'attachments' });
Task.belongsToMany(User, { through: TaskWatcher, foreignKey: 'taskId', as: 'watchers' });

// TaskComment associations
TaskComment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TaskComment.belongsTo(TaskComment, { foreignKey: 'parentId', as: 'parent' });
TaskComment.hasMany(TaskComment, { foreignKey: 'parentId', as: 'replies' });
TaskComment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });

// TaskActivity associations
TaskActivity.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TaskActivity.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// TaskAttachment associations
TaskAttachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// BoardMember associations
BoardMember.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
BoardMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Label associations
Label.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
Label.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// CommentLike associations
CommentLike.belongsTo(TaskComment, { foreignKey: 'commentId', as: 'comment' });
CommentLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserFollowing associations
UserFollowing.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
UserFollowing.belongsTo(User, { foreignKey: 'followedId', as: 'followed' });

// TaskWatcher associations
TaskWatcher.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskWatcher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Session associations (existing)
Session.hasMany(Attendance, { foreignKey: 'sessionId', as: 'attendances' });
Session.hasMany(Attachment, { foreignKey: 'sessionId', as: 'attachments' });
Session.belongsTo(RecurringSession, { foreignKey: 'recurringSessionId', as: 'recurringSession' });

// RecurringSession associations
RecurringSession.hasMany(Session, { foreignKey: 'recurringSessionId', as: 'sessions' });

// Attendance associations
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Attendance.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

// Attachment associations
Attachment.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Session,
  Attendance,
  Attachment,
  Notification,
  RecurringSession,
  Department,
  Project,
  UserProject,
  Board,
  TaskList,
  Task,
  TaskComment,
  TaskActivity,
  TaskAttachment,
  BoardMember,
  Label,
  CommentLike,
  UserFollowing,
  TaskWatcher
};
