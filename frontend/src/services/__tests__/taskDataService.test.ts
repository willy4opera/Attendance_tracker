import taskDataService from '../taskDataService'
import taskService from '../taskService'
import api from '../api'

// This is a test script that can be run in the browser console
// or converted to proper Jest tests

const runTaskServiceTests = async () => {
  console.log('🧪 Starting Task Data Service Tests...\n')
  
  // Test configuration
  const testTaskId = '16' // Replace with a valid task ID
  const testBoardId = 1 // Replace with a valid board ID
  const testListId = 1 // Replace with a valid list ID
  
  try {
    // ============ TEST 1: Fetch Task Data ============
    console.log('📋 TEST 1: Fetching task data...')
    const taskData = await taskDataService.fetchTaskData(testTaskId)
    
    console.log('✅ Task data fetched successfully:')
    console.log('- Task:', taskData.task?.title)
    console.log('- Project:', taskData.project?.name)
    console.log('- Board:', taskData.board?.name)
    console.log('- Assigned Users:', taskData.assignedUsers.length)
    console.log('- Available Lists:', taskData.availableLists.length)
    console.log('- All Users:', taskData.allUsers.length)
    console.log('- All Departments:', taskData.allDepartments.length)
    console.log('\n')
    
    // ============ TEST 2: Prepare Form Data ============
    console.log('📝 TEST 2: Preparing form data...')
    const formData = taskDataService.prepareFormData(taskData)
    
    console.log('✅ Form data prepared:')
    console.log('- Title:', formData.title)
    console.log('- Priority:', formData.priority)
    console.log('- Status:', formData.status)
    console.log('- Assigned To:', formData.assignedTo)
    console.log('- Labels:', formData.labels)
    console.log('- Task List ID:', formData.taskListId)
    console.log('\n')
    
    // ============ TEST 3: Validate Form Data ============
    console.log('✔️ TEST 3: Validating form data...')
    const validation = taskDataService.validateFormData(formData)
    
    console.log('✅ Validation result:')
    console.log('- Is Valid:', validation.isValid)
    console.log('- Errors:', validation.errors)
    console.log('\n')
    
    // ============ TEST 4: Prepare Update Data ============
    console.log('🔄 TEST 4: Preparing update data...')
    
    // Modify some fields
    const modifiedFormData = {
      ...formData,
      title: formData.title + ' (Updated)',
      description: 'Updated description at ' + new Date().toISOString(),
      priority: 'high' as const,
      assignedTo: [...formData.assignedTo, 4], // Add user ID 4
      labels: [...formData.labels, 'updated']
    }
    
    const updateData = taskDataService.prepareUpdateData(modifiedFormData)
    
    console.log('✅ Update data prepared:')
    console.log(JSON.stringify(updateData, null, 2))
    console.log('\n')
    
    // ============ TEST 5: Test Validation Errors ============
    console.log('❌ TEST 5: Testing validation errors...')
    
    const invalidFormData = {
      title: '', // Empty title should fail
      taskListId: 0, // Invalid list ID
      estimatedHours: -5, // Negative hours
      startDate: '2024-12-31',
      dueDate: '2024-01-01' // Due date before start date
    }
    
    const invalidValidation = taskDataService.validateFormData(invalidFormData)
    
    console.log('✅ Invalid data validation:')
    console.log('- Is Valid:', invalidValidation.isValid)
    console.log('- Errors:', invalidValidation.errors)
    console.log('\n')
    
    // ============ TEST 6: CREATE Operation ============
    console.log('➕ TEST 6: Testing CREATE operation...')
    
    const newTaskData = {
      title: 'Test Task Created at ' + new Date().toISOString(),
      description: 'This is a test task created by the test script',
      taskListId: testListId,
      priority: 'medium' as const,
      status: 'todo' as const,
      assignedTo: [1], // Assign to user ID 1
      labels: ['test', 'automated'],
      estimatedHours: 5
    }
    
    try {
      const createdTask = await taskService.createTask(newTaskData)
      console.log('✅ Task created successfully:')
      console.log('- ID:', createdTask.id)
      console.log('- Title:', createdTask.title)
      console.log('\n')
      
      // ============ TEST 7: READ Operation ============
      console.log('👁️ TEST 7: Testing READ operation...')
      const readTask = await taskService.getTask(createdTask.id)
      console.log('✅ Task read successfully:')
      console.log('- Title:', readTask.title)
      console.log('- Status:', readTask.status)
      console.log('\n')
      
      // ============ TEST 8: UPDATE Operation ============
      console.log('✏️ TEST 8: Testing UPDATE operation...')
      const updateTaskData = {
        title: readTask.title + ' (Updated)',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assignedTo: [1, 2] // Add another user
      }
      
      const updatedTask = await taskService.updateTask(createdTask.id.toString(), updateTaskData)
      console.log('✅ Task updated successfully:')
      console.log('- New Title:', updatedTask.title)
      console.log('- New Status:', updatedTask.status)
      console.log('- New Priority:', updatedTask.priority)
      console.log('\n')
      
      // ============ TEST 9: DELETE Operation ============
      console.log('🗑️ TEST 9: Testing DELETE operation...')
      await taskService.deleteTask(createdTask.id)
      console.log('✅ Task deleted successfully')
      
      // Verify deletion
      try {
        await taskService.getTask(createdTask.id)
        console.log('❌ Task still exists after deletion!')
      } catch (error) {
        console.log('✅ Confirmed: Task no longer exists')
      }
      
    } catch (createError) {
      console.error('❌ Error in CRUD operations:', createError)
    }
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runTaskServiceTests = runTaskServiceTests
}

// Also create a simple test runner
export const testTaskDataService = async () => {
  console.log('Running Task Data Service Tests...')
  console.log('================================\n')
  
  await runTaskServiceTests()
}

// Instructions for running in browser console:
console.log(`
To run the task service tests, execute one of these commands in the browser console:

1. Simple test run:
   await window.runTaskServiceTests()

2. Test with custom task ID:
   const testTaskId = '16'; // Your task ID
   await window.runTaskServiceTests()

Make sure you're logged in and have valid task IDs to test with.
`)

export default testTaskDataService
