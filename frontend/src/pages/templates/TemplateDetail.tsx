import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  AiOutlineArrowLeft,
  AiOutlineCopy,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineProject,
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineEye,
  AiOutlineCheckCircle
} from 'react-icons/ai';
import { MdViewKanban } from 'react-icons/md';
import { FaTasks } from 'react-icons/fa';

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isUsing, setIsUsing] = useState(false);

  // Mock data - in real app, this would come from API
  const template = {
    id: 1,
    name: 'Software Development Project',
    description: 'Complete project setup for software development with planning, development, testing, and deployment phases. This template includes all the necessary boards, task lists, and predefined tasks to get your development project started quickly.',
    type: 'project' as const,
    category: 'Development',
    author: {
      name: 'System Admin',
      avatar: '/api/placeholder/32/32'
    },
    usageCount: 45,
    isPublic: true,
    createdAt: '2025-01-15',
    updatedAt: '2025-02-01',
    structure: {
      boards: [
        {
          name: 'Planning Board',
          lists: [
            {
              name: 'Requirements',
              tasks: ['Gather requirements', 'Define scope', 'Create user stories']
            },
            {
              name: 'Design',
              tasks: ['System design', 'UI/UX mockups', 'Database schema']
            },
            {
              name: 'Approved',
              tasks: ['Ready for development']
            }
          ]
        },
        {
          name: 'Development Board',
          lists: [
            {
              name: 'Backlog',
              tasks: ['Feature A', 'Feature B', 'Bug fixes']
            },
            {
              name: 'In Progress',
              tasks: ['Current sprint items']
            },
            {
              name: 'Code Review',
              tasks: ['Pending reviews']
            },
            {
              name: 'Done',
              tasks: ['Completed features']
            }
          ]
        },
        {
          name: 'Testing Board',
          lists: [
            {
              name: 'Test Planning',
              tasks: ['Test case creation', 'Test data setup']
            },
            {
              name: 'Testing',
              tasks: ['Unit tests', 'Integration tests', 'E2E tests']
            },
            {
              name: 'Bug Reports',
              tasks: ['Found issues']
            },
            {
              name: 'Passed',
              tasks: ['Tested features']
            }
          ]
        },
        {
          name: 'Deployment Board',
          lists: [
            {
              name: 'Staging',
              tasks: ['Deploy to staging', 'Staging tests']
            },
            {
              name: 'Production',
              tasks: ['Production deployment', 'Monitoring']
            },
            {
              name: 'Released',
              tasks: ['Live features']
            }
          ]
        }
      ]
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'project': return <AiOutlineProject className="w-6 h-6" />;
      case 'board': return <MdViewKanban className="w-6 h-6" />;
      case 'task': return <FaTasks className="w-6 h-6" />;
      default: return <AiOutlineProject className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'board': return 'bg-green-100 text-green-800';
      case 'task': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUseTemplate = () => {
    setIsUsing(true);
    // Simulate API call
    setTimeout(() => {
      setIsUsing(false);
      // In real app, redirect to new project/board/task created from template
      alert('Template used successfully! Redirecting to new project...');
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/templates"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <AiOutlineArrowLeft className="w-5 h-5" />
            <span>Back to Templates</span>
          </Link>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <AiOutlineEdit className="w-5 h-5" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleUseTemplate}
            disabled={isUsing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUsing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <AiOutlineCopy className="w-5 h-5" />
                <span>Use Template</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-6">
          <div className={`p-4 rounded-xl ${getTypeColor(template.type)}`}>
            {getTemplateIcon(template.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(template.type)}`}>
                {template.type}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{template.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <AiOutlineUser className="w-4 h-4" />
                <span>By {template.author.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AiOutlineCalendar className="w-4 h-4" />
                <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AiOutlineEye className="w-4 h-4" />
                <span>{template.usageCount} uses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Structure */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Template Structure</h2>
        
        <div className="space-y-6">
          {template.structure.boards.map((board, boardIndex) => (
            <div key={boardIndex} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <MdViewKanban className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{board.name}</h3>
                <span className="text-sm text-gray-500">({board.lists.length} lists)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {board.lists.map((list, listIndex) => (
                  <div key={listIndex} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{list.name}</h4>
                      <span className="text-xs text-gray-500">{list.tasks.length} tasks</span>
                    </div>
                    
                    <div className="space-y-2">
                      {list.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center space-x-2 text-sm">
                          <AiOutlineCheckCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdViewKanban className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Boards</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{template.structure.boards.length}</p>
          <p className="text-sm text-gray-500">Organized workflows</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaTasks className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Task Lists</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {template.structure.boards.reduce((total, board) => total + board.lists.length, 0)}
          </p>
          <p className="text-sm text-gray-500">Organized columns</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AiOutlineCheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Tasks</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {template.structure.boards.reduce((total, board) => 
              total + board.lists.reduce((listTotal, list) => listTotal + list.tasks.length, 0), 0
            )}
          </p>
          <p className="text-sm text-gray-500">Predefined tasks</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;
