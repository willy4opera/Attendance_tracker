import React from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface TaskLocationInfoProps {
  selectedProject: string
  selectedBoard: string
  taskListId: number
  getSelectedProjectName: () => string
  getSelectedBoardName: () => string
  availableLists: TaskList[]
}

const TaskLocationInfo: React.FC<TaskLocationInfoProps> = ({
  selectedProject,
  selectedBoard,
  taskListId,
  getSelectedProjectName,
  getSelectedBoardName,
  availableLists
}) => {
  if (!selectedProject) return null

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: `${theme.colors.primary}10` }}>
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <MapPinIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Task Location
      </h4>
      <div className="space-y-2 text-sm" style={{ color: theme.colors.secondary }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📁</span>
          <span className="font-medium">{getSelectedProjectName()}</span>
        </div>
        {selectedBoard && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-lg">📋</span>
            <span className="font-medium">{getSelectedBoardName()}</span>
          </div>
        )}
        {taskListId > 0 && (
          <div className="flex items-center gap-2 ml-8">
            <span className="text-lg">📝</span>
            <span className="font-medium">
              {availableLists.find(l => l.id === taskListId)?.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskLocationInfo
