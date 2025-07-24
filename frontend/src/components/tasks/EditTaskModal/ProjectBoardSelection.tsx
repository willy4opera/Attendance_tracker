import React from 'react'
import { FolderIcon, ViewColumnsIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { Project, Board } from '../../../types'
import type { UpdateTaskData } from '../../../services/taskService'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface ProjectBoardSelectionProps {
  formData: UpdateTaskData
  selectedProject: string
  selectedBoard: string
  projects: Project[]
  boards: Board[]
  availableLists: TaskList[]
  errors: Record<string, string>
  handleProjectChange: (projectId: string) => void
  handleBoardChange: (boardId: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

const ProjectBoardSelection: React.FC<ProjectBoardSelectionProps> = ({
  formData,
  selectedProject,
  selectedBoard,
  projects,
  boards,
  availableLists,
  errors,
  handleProjectChange,
  handleBoardChange,
  handleInputChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <FolderIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Project & Board
      </h4>
      
      <div className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <FolderIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.project ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project && <p className="text-red-500 text-sm mt-1">{errors.project}</p>}
        </div>

        {/* Board Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ViewColumnsIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Board
          </label>
          <select
            value={selectedBoard}
            onChange={(e) => handleBoardChange(e.target.value)}
            disabled={!selectedProject}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.board ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
          >
            <option value="">Select a board</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          {errors.board && <p className="text-red-500 text-sm mt-1">{errors.board}</p>}
        </div>

        {/* List Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ListBulletIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            List
          </label>
          <select
            name="taskListId"
            value={formData.taskListId}
            onChange={handleInputChange}
            disabled={!selectedBoard}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.taskListId ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
          >
            <option value={0}>Select a list</option>
            {availableLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          {errors.taskListId && <p className="text-red-500 text-sm mt-1">{errors.taskListId}</p>}
        </div>
      </div>
    </div>
  )
}

export default ProjectBoardSelection
