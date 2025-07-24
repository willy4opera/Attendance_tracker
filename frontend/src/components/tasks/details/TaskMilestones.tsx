import React from 'react';
import { FaFlag, FaSpinner, FaCheckCircle } from 'react-icons/fa';

interface TaskMilestonesProps {
  taskStatus: string;
}

interface Milestone {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  iconColor: string;
  badgeClass: string;
  statusLabel: string;
}

const TaskMilestones: React.FC<TaskMilestonesProps> = ({ taskStatus }) => {
  const getMilestones = (status: string): Milestone[] => {
    const milestones: Milestone[] = [
      {
        name: 'Initial Setup Complete',
        status: 'pending',
        iconColor: 'text-gray-400',
        badgeClass: 'bg-gray-100 text-gray-600',
        statusLabel: 'Pending'
      },
      {
        name: 'Development Phase',
        status: 'pending',
        iconColor: 'text-gray-400',
        badgeClass: 'bg-gray-100 text-gray-600',
        statusLabel: 'Pending'
      },
      {
        name: 'Testing & Review',
        status: 'pending',
        iconColor: 'text-gray-400',
        badgeClass: 'bg-gray-100 text-gray-600',
        statusLabel: 'Pending'
      }
    ];

    // Update milestone statuses based on task status
    switch (status) {
      case 'todo':
        // All milestones pending
        break;
      
      case 'in-progress':
        // Initial setup completed, development in progress
        milestones[0] = {
          ...milestones[0],
          status: 'completed',
          iconColor: 'text-green-500',
          badgeClass: 'bg-green-100 text-green-600',
          statusLabel: 'Completed'
        };
        milestones[1] = {
          ...milestones[1],
          status: 'in-progress',
          iconColor: 'text-blue-500',
          badgeClass: 'bg-blue-100 text-blue-600',
          statusLabel: 'In Progress'
        };
        break;
      
      case 'under-review':
        // Initial setup and development completed, testing in progress
        milestones[0] = {
          ...milestones[0],
          status: 'completed',
          iconColor: 'text-green-500',
          badgeClass: 'bg-green-100 text-green-600',
          statusLabel: 'Completed'
        };
        milestones[1] = {
          ...milestones[1],
          status: 'completed',
          iconColor: 'text-green-500',
          badgeClass: 'bg-green-100 text-green-600',
          statusLabel: 'Completed'
        };
        milestones[2] = {
          ...milestones[2],
          status: 'in-progress',
          iconColor: 'text-blue-500',
          badgeClass: 'bg-blue-100 text-blue-600',
          statusLabel: 'In Review'
        };
        break;
      
      case 'done':
        // All milestones completed
        milestones.forEach((milestone, index) => {
          milestones[index] = {
            ...milestone,
            status: 'completed',
            iconColor: 'text-green-500',
            badgeClass: 'bg-green-100 text-green-600',
            statusLabel: 'Completed'
          };
        });
        break;
    }

    return milestones;
  };

  const milestones = getMilestones(taskStatus);

  return (
    <div>
      <h3 className="text-base sm:text-md font-medium text-gray-900 mb-3 flex items-center"><FaFlag className="mr-2" /> Milestones</h3>
      <div className="relative">
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200">
                  {milestone.status === 'completed' && milestones[index + 1].status !== 'pending' && (
                    <div className="absolute inset-0 bg-green-400"></div>
                  )}
                  {milestone.status === 'in-progress' && (
                    <div className="absolute top-0 h-1/2 bg-blue-400 animate-pulse"></div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg relative z-10">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {milestone.status === 'completed' ? (
                    <FaCheckCircle className={`h-4 w-4 flex-shrink-0 ${milestone.iconColor}`} />
                  ) : milestone.status === 'in-progress' ? (
                    <div className="relative">
                      <FaFlag className={`h-4 w-4 flex-shrink-0 ${milestone.iconColor}`} />
                      <div className="absolute -top-1 -right-1">
                        <FaSpinner className="h-2 w-2 text-blue-600 animate-spin" />
                      </div>
                    </div>
                  ) : (
                    <FaFlag className={`h-4 w-4 flex-shrink-0 ${milestone.iconColor}`} />
                  )}
                  <span className="text-sm text-gray-700 truncate">{milestone.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {milestone.status === 'in-progress' && (
                    <FaSpinner className="h-3 w-3 text-blue-600 animate-spin" />
                  )}
                  <span className={`ml-2 text-xs px-2 py-1 rounded flex-shrink-0 ${milestone.badgeClass}`}>
                    {milestone.statusLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskMilestones;
