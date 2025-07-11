import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AiOutlinePlus, 
  AiOutlineProject, 
  AiOutlineAppstore, 
  AiOutlineCheckSquare,
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlineEye,
  AiOutlineCopy,
  AiOutlineEdit,
  AiOutlineDelete
} from 'react-icons/ai';
import { MdViewKanban } from 'react-icons/md';
import { FaTasks } from 'react-icons/fa';

interface Template {
  id: number;
  name: string;
  description: string;
  type: 'project' | 'board' | 'task';
  category: string;
  author: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: string;
  preview: {
    itemCount: number;
    structure: string[];
  };
}

const TemplateList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'board' | 'task'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data - in real app, this would come from API
  const templates: Template[] = [
    {
      id: 1,
      name: 'Software Development Project',
      description: 'Complete project setup for software development with planning, development, testing, and deployment phases.',
      type: 'project',
      category: 'Development',
      author: 'System',
      usageCount: 45,
      isPublic: true,
      createdAt: '2025-01-15',
      preview: {
        itemCount: 4,
        structure: ['Planning Board', 'Development Board', 'Testing Board', 'Deployment Board']
      }
    },
    {
      id: 2,
      name: 'Marketing Campaign',
      description: 'Template for marketing campaigns including research, planning, execution, and analysis.',
      type: 'project',
      category: 'Marketing',
      author: 'Marketing Team',
      usageCount: 32,
      isPublic: true,
      createdAt: '2025-02-01',
      preview: {
        itemCount: 3,
        structure: ['Research & Planning', 'Campaign Execution', 'Analysis & Reporting']
      }
    },
    {
      id: 3,
      name: 'Agile Scrum Board',
      description: 'Standard Scrum board with backlog, sprint planning, in progress, review, and done columns.',
      type: 'board',
      category: 'Development',
      author: 'Scrum Master',
      usageCount: 89,
      isPublic: true,
      createdAt: '2025-01-20',
      preview: {
        itemCount: 5,
        structure: ['Backlog', 'Sprint Planning', 'In Progress', 'Review', 'Done']
      }
    },
    {
      id: 4,
      name: 'Bug Tracking Board',
      description: 'Specialized board for tracking bugs with priority levels and resolution stages.',
      type: 'board',
      category: 'Development',
      author: 'QA Team',
      usageCount: 67,
      isPublic: true,
      createdAt: '2025-01-25',
      preview: {
        itemCount: 6,
        structure: ['New Bugs', 'Investigating', 'In Progress', 'Testing', 'Resolved', 'Closed']
      }
    },
    {
      id: 5,
      name: 'Feature Development Task',
      description: 'Standard task template for feature development with analysis, design, coding, and testing.',
      type: 'task',
      category: 'Development',
      author: 'Dev Team',
      usageCount: 156,
      isPublic: true,
      createdAt: '2025-02-10',
      preview: {
        itemCount: 8,
        structure: ['Requirements Analysis', 'Design', 'Implementation', 'Unit Testing', 'Integration', 'Code Review', 'Documentation', 'QA Testing']
      }
    },
    {
      id: 6,
      name: 'Code Review Task',
      description: 'Template for code review tasks with checklist for quality assurance.',
      type: 'task',
      category: 'Development',
      author: 'Senior Dev',
      usageCount: 203,
      isPublic: true,
      createdAt: '2025-02-15',
      preview: {
        itemCount: 6,
        structure: ['Code Quality Check', 'Performance Review', 'Security Check', 'Documentation Review', 'Testing Coverage', 'Approval']
      }
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesTab = activeTab === 'all' || template.type === activeTab;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'project': return <AiOutlineProject className="w-5 h-5" />;
      case 'board': return <MdViewKanban className="w-5 h-5" />;
      case 'task': return <FaTasks className="w-5 h-5" />;
      default: return <AiOutlineAppstore className="w-5 h-5" />;
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

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600">Reusable templates for projects, boards, and tasks</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/templates/create"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <AiOutlinePlus className="w-5 h-5" />
            <span>Create Template</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'all', label: 'All Templates', icon: <AiOutlineAppstore className="w-4 h-4" /> },
            { key: 'project', label: 'Project Templates', icon: <AiOutlineProject className="w-4 h-4" /> },
            { key: 'board', label: 'Board Templates', icon: <MdViewKanban className="w-4 h-4" /> },
            { key: 'task', label: 'Task Templates', icon: <FaTasks className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="min-w-40">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                    {getTemplateIcon(template.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.category}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                  {template.type}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Structure ({template.preview.itemCount} items)</span>
                </div>
                <div className="space-y-1">
                  {template.preview.structure.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {item}
                    </div>
                  ))}
                  {template.preview.structure.length > 3 && (
                    <div className="text-xs text-gray-500 px-2 py-1">
                      +{template.preview.structure.length - 3} more items
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>By {template.author}</span>
                <span>{template.usageCount} uses</span>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/templates/${template.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AiOutlineEye className="w-4 h-4" />
                  <span>Preview</span>
                </Link>
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <AiOutlineCopy className="w-4 h-4" />
                  <span>Use</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <AiOutlineAppstore className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || activeTab !== 'all'
              ? 'Try adjusting your filters or search term'
              : 'Get started by creating your first template'}
          </p>
          <Link
            to="/templates/create"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <AiOutlinePlus className="w-5 h-5" />
            <span>Create Template</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
