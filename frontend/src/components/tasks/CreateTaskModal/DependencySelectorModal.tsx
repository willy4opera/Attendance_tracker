import React from 'react'
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline'
import { DependencySelector } from '../../dependencies'
import theme from '../../../config/theme'
import Swal from 'sweetalert2'
import type { Task } from '../../../types'

interface DependencySelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onDependencySelected: (dependencyId: number) => void
  currentTaskId: number
  availableTasks: Task[]
  projectMembers?: any[]
  existingDependencies?: any[]
}

const DependencySelectorModal: React.FC<DependencySelectorModalProps> = ({
  isOpen,
  onClose,
  onDependencySelected,
  currentTaskId,
  availableTasks,
  projectMembers = [],
  existingDependencies = []
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
          
            />
        
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div 
            className="relative px-6 py-4" 
            style={{ 
              background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)` 
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <LinkIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
            </div>
            
            <div className="relative flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                {existingDependencies.length > 0 ? 'Edit Task Dependencies' : 'Add Task Dependency'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                style={{ 
                  backgroundColor: theme.colors.primary + '20', 
                  color: theme.colors.primary 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                  e.currentTarget.style.color = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                  e.currentTarget.style.color = theme.colors.primary;
                }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6" style={{ backgroundColor: theme.colors.background.paper }}>
            <DependencySelector
              onDependencySelected={(dependency) => {
                onDependencySelected(dependency.predecessorTaskId)
                onClose()
                
                // Show success message
                Swal.fire({
                  icon: 'success',
                  title: 'Dependency Added',
                  text: 'Task dependency has been added successfully!',
                  showConfirmButton: false,
                  timer: 2000,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary
                })
              }}
              currentTaskId={currentTaskId}
              availableTasks={availableTasks}
              projectMembers={projectMembers}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DependencySelectorModal
