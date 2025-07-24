const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/components/tasks/CreateTaskModal/CreateTaskModalModular.tsx', 'utf8');

// Add the dependency service import after taskService import
content = content.replace(
  "import { taskService, type CreateTaskData } from '../../../services/taskService'",
  "import { taskService, type CreateTaskData } from '../../../services/taskService'\nimport { dependencyService } from '../../../services/dependencyService'"
);

// Replace the task creation logic
const oldTaskCreation = `    try {
      const taskData: ExtendedCreateTaskData = {
        ...formData,
        assignedTo: selectedUsers.map(u => u.id),
        assignedDepartments: selectedDepartments.map(d => d.id),
        dependencies: formData.dependencies || []
      }

      const result = await taskService.createTask(taskData)`;

const newTaskCreation = `    try {
      // Step 1: Create the task without dependencies
      const taskData: CreateTaskData = {
        title: formData.title,
        description: formData.description,
        taskListId: formData.taskListId,
        priority: formData.priority,
        labels: formData.labels,
        dueDate: formData.dueDate,
        startDate: formData.startDate,
        assignedTo: selectedUsers.map(u => u.id),
        assignedDepartments: selectedDepartments.map(d => d.id),
        estimatedHours: formData.estimatedHours,
        status: formData.isComplete ? 'done' : formData.status
      }

      const createdTask = await taskService.createTask(taskData)

      // Step 2: Create dependencies if any
      if (formData.dependencies && formData.dependencies.length > 0) {
        const dependencyPromises = formData.dependencies.map(predecessorId => 
          dependencyService.createDependency({
            predecessorTaskId: predecessorId,
            successorTaskId: createdTask.id,
            dependencyType: 'FS', // Default to Finish-to-Start
            lagTime: 0,
            notifyUsers: true
          })
        )

        try {
          await Promise.all(dependencyPromises)
        } catch (depError) {
          console.error('Error creating dependencies:', depError)
          // Don't show error - dependencies might already exist or other non-critical errors
        }
      }

      const result = createdTask`;

content = content.replace(oldTaskCreation, newTaskCreation);

// Write the updated content
fs.writeFileSync('src/components/tasks/CreateTaskModal/CreateTaskModalModular.tsx', content);
console.log('File updated successfully!');
