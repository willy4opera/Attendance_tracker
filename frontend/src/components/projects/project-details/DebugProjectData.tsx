import React, { useEffect, useState } from 'react'
import { projectService } from '../../../services/projectService'
import { boardService } from '../../../services/boardService'
import taskService from '../../../services/taskService'
import userService from '../../../services/userService'

interface DebugProjectDataProps {
  projectId: number
}

export function DebugProjectData({ projectId }: DebugProjectDataProps) {
  const [debugData, setDebugData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        console.log('=== DEBUG: Starting data fetch ===')
        console.log('Project ID:', projectId, 'Type:', typeof projectId)
        
        // 1. Fetch project
        const project = await projectService.getProject(projectId.toString())
        console.log('1. Project data:', project)
        
        // 2. Fetch boards - convert projectId to string
        const boardsResponse = await boardService.getBoards({ 
          projectId: projectId.toString() 
        })
        const boards = boardsResponse.boards || []
        console.log('2. Boards data:', boards)
        
        // 3. Fetch tasks for each board
        const tasksByBoard: any = {}
        const allUsers = new Map()
        
        for (const board of boards) {
          try {
            const tasksResponse = await taskService.getTasks({ 
              boardId: board.id.toString() 
            })
            const tasks = tasksResponse.tasks || []
            tasksByBoard[board.id] = tasks
            
            console.log(`3. Board ${board.id} tasks:`, tasks)
            
            // Extract users from tasks
            tasks.forEach((task: any) => {
              console.log(`   Task ${task.id}:`, {
                assignee: task.assignee,
                assigneeId: task.assigneeId,
                createdBy: task.createdBy,
                hasAssignee: !!task.assignee
              })
              
              if (task.assignee) {
                const userId = task.assignee.id || task.assigneeId
                allUsers.set(userId, task.assignee)
              } else if (task.assigneeId) {
                // If only assigneeId exists without assignee object
                allUsers.set(task.assigneeId, { id: task.assigneeId, noUserData: true })
              }
            })
            
            // Also check board owner
            if (board.owner) {
              console.log(`   Board ${board.id} owner:`, board.owner)
              allUsers.set(board.owner.id || board.ownerId, board.owner)
            } else if (board.ownerId) {
              allUsers.set(board.ownerId, { id: board.ownerId, noUserData: true })
            }
          } catch (error) {
            console.error(`Error fetching tasks for board ${board.id}:`, error)
          }
        }
        
        // 4. Try to fetch user list
        let systemUsers: any[] = []
        try {
          const usersResponse = await userService.getAllUsers({ limit: 50 })
          systemUsers = usersResponse.users || []
          console.log('4. System users:', systemUsers)
          console.log('   Sample user structure:', systemUsers[0])
        } catch (error) {
          console.error('Error fetching users:', error)
        }
        
        // 5. Check task structure in detail
        const sampleTaskWithAssignee = Object.values(tasksByBoard)
          .flat()
          .find((task: any) => task.assignee || task.assigneeId)
        
        const debugSummary = {
          project: {
            id: project.id,
            name: project.name,
            membersCount: project.members?.length || 0,
            membersStructure: project.members?.[0] || 'No members',
            rawMembers: project.members
          },
          boards: {
            count: boards.length,
            sampleBoard: boards[0]
          },
          tasks: {
            totalCount: Object.values(tasksByBoard).flat().length,
            boardBreakdown: Object.entries(tasksByBoard).map(([boardId, tasks]: [string, any[]]) => ({
              boardId,
              taskCount: tasks.length,
              tasksWithAssignees: tasks.filter((t: any) => t.assignee || t.assigneeId).length
            }))
          },
          uniqueUsers: {
            count: allUsers.size,
            users: Array.from(allUsers.entries()).map(([id, user]) => ({
              id,
              hasFullData: !user.noUserData,
              userData: user
            }))
          },
          systemUsers: {
            count: systemUsers.length,
            sampleUser: systemUsers[0]
          },
          sampleTaskWithAssignee
        }
        
        console.log('5. Debug Summary:', debugSummary)
        setDebugData(debugSummary)
      } catch (error) {
        console.error('Debug fetch error:', error)
        setDebugData({ error: error.message, stack: error.stack })
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [projectId])

  if (loading) return <div>Loading debug data...</div>

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-96">
      <h4 className="font-bold text-sm mb-2">Debug: Project Data Structure</h4>
      
      {debugData.error ? (
        <div className="text-red-600">
          <strong>Error:</strong> {debugData.error}
          <pre className="mt-2">{debugData.stack}</pre>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <strong>Project Summary:</strong>
            <pre>{JSON.stringify(debugData.project, null, 2)}</pre>
          </div>
          
          <div className="mb-4">
            <strong>Unique Users from Tasks/Boards:</strong>
            <pre>{JSON.stringify(debugData.uniqueUsers, null, 2)}</pre>
          </div>
          
          <div className="mb-4">
            <strong>Task Breakdown:</strong>
            <pre>{JSON.stringify(debugData.tasks, null, 2)}</pre>
          </div>
          
          <div className="mb-4">
            <strong>Sample Task with Assignee:</strong>
            <pre>{JSON.stringify(debugData.sampleTaskWithAssignee, null, 2)}</pre>
          </div>
          
          <div className="mb-4">
            <strong>System Users:</strong>
            <pre>{JSON.stringify(debugData.systemUsers, null, 2)}</pre>
          </div>
        </>
      )}
      
      <p className="mt-4 text-red-600">Check browser console for detailed logs</p>
    </div>
  )
}
