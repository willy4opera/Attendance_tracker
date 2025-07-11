import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import { useBoards } from '../../hooks/useBoards';
import { useProjects } from '../../hooks/useProjects';
import type { CreateBoardData } from '../../services/boardService';

const CreateBoard: React.FC = () => {
  const navigate = useNavigate();
  const { createBoard, isCreating } = useBoards();
  const { projects } = useProjects({ limit: 100 });

  const [formData, setFormData] = useState<CreateBoardData>({
    name: '',
    description: '',
    visibility: 'department',
    backgroundColor: '#0079BF',
    projectId: undefined,
    settings: {
      cardCoverImages: true,
      voting: false,
      comments: true,
      invitations: 'members',
      selfJoin: false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Board name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await createBoard(formData);
      if (result.success) {
        navigate(`/boards/${result.data.id}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const colorOptions = [
    { value: '#0079BF', label: 'Blue', className: 'bg-blue-500' },
    { value: '#D29034', label: 'Orange', className: 'bg-orange-500' },
    { value: '#519839', label: 'Green', className: 'bg-green-500' },
    { value: '#B04632', label: 'Red', className: 'bg-red-500' },
    { value: '#89609E', label: 'Purple', className: 'bg-purple-500' },
    { value: '#CD5A91', label: 'Pink', className: 'bg-pink-500' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            to="/boards"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Board</h1>
            <p className="text-gray-600">Set up a new board for your team</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Board Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter board name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this board is for..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="department">Department</option>
                  <option value="organization">Organization</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Background Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'backgroundColor', value: color.value } } as any)}
                  className={`w-12 h-12 rounded-lg ${color.className} hover:opacity-80 transition-opacity ${
                    formData.backgroundColor === color.value ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Board Settings */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Board Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700">Card Cover Images</label>
                  <p className="text-xs text-gray-500">Show images on cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('cardCoverImages', !formData.settings.cardCoverImages)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.cardCoverImages ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.cardCoverImages ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700">Comments</label>
                  <p className="text-xs text-gray-500">Allow comments on cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('comments', !formData.settings.comments)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.comments ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.comments ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700">Voting</label>
                  <p className="text-xs text-gray-500">Allow voting on cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('voting', !formData.settings.voting)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.voting ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.voting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/boards"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
          >
            <FaTimes className="h-4 w-4" />
            <span>Cancel</span>
          </Link>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FaSave className="h-4 w-4" />
            )}
            <span>{isCreating ? 'Creating...' : 'Create Board'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBoard;
