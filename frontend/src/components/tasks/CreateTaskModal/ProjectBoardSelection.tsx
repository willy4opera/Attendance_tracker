import React from 'react'
import { FolderIcon, ViewColumnsIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { Project, Board } from '../../../types'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface ProjectBoardSelectionProps {
  selectedProject: string
  selectedBoard: string
  taskListId: number
  projects: Project[]
  boards: Board[]
  availableLists: TaskList[]
  errors: Record<string, string>
  onProjectChange: (projectId: string) => void
  onBoardChange: (boardId: string) => void
  onListChange: (listId: number) => void
}

const ProjectBoardSelection: React.FC<ProjectBoardSelectionProps> = ({
  selectedProject,
  selectedBoard,
  taskListId,
  projects,
  boards,
  availableLists,
  errors,
  onProjectChange,
  onBoardChange,
  onListChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <FolderIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Board Selection
      </h4>

      <div className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className={`block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 cursor-pointer`}
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.project ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
          >
            <option value="">Select a project</option>
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project && (
            <p className="mt-1 text-sm text-red-500">{errors.project}</p>
          )}
        </div>

        {/* Board Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ViewColumnsIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Board
          </label>
          <select
            value={selectedBoard}
            onChange={(e) => onBoardChange(e.target.value)}
            className={`block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 cursor-pointer`}
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.board ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            disabled={!selectedProject}
          >
            <option value="">Select a board</option>
            {boards?.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          {errors.board && (
            <p className="mt-1 text-sm text-red-500">{errors.board}</p>
          )}
        </div>

        {/* Task List Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ListBulletIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Task List
          </label>
          <select
            value={taskListId}
            onChange={(e) => onListChange(parseInt(e.target.value))}
            className={`block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 cursor-pointer`}
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.list ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            disabled={!selectedBoard}
          >
            <option value="0">Select a list</option>
            {availableLists?.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          {errors.list && (
            <p className="mt-1 text-sm text-red-500">{errors.list}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectBoardSelection
