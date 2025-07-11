import React from 'react'
import { 
  ChatBubbleLeftIcon,
  DocumentIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ProjectTimelineProps {
  projectId: string
}

interface TimelineItem {
  id: string
  type: 'comment' | 'task_created' | 'task_completed' | 'member_added' | 'document_added'
  title: string
  description: string
  timestamp: string
  user: {
    name: string
    avatar?: string
  }
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ projectId }) => {
  // Mock timeline data - would be replaced with actual API call
  const timelineItems: TimelineItem[] = [
    {
      id: '1',
      type: 'task_completed',
      title: 'Task completed',
      description: 'Setup project repository and initial configuration',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: 'John Doe' }
    },
    {
      id: '2',
      type: 'member_added',
      title: 'Member added',
      description: 'Jane Smith was added to the project',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Admin' }
    },
    {
      id: '3',
      type: 'task_created',
      title: 'Task created',
      description: 'Design user interface mockups',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Jane Smith' }
    },
    {
      id: '4',
      type: 'comment',
      title: 'Comment added',
      description: 'Great progress on the initial setup!',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Mike Johnson' }
    }
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />
      case 'task_created':
        return <DocumentIcon className="h-5 w-5 text-green-600" />
      case 'task_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'member_added':
        return <UserPlusIcon className="h-5 w-5 text-purple-600" />
      case 'document_added':
        return <DocumentIcon className="h-5 w-5 text-orange-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineItems.map((item, index) => (
            <li key={item.id}>
              <div className="relative pb-8">
                {index !== timelineItems.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-xs font-medium text-gray-700">
                            {getInitials(item.user.name)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{item.user.name}</span>
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {timelineItems.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Activity will appear here as team members work on the project.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProjectTimeline
