import React, { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import DepartmentService from '../../services/departmentService';
import type { CreateDepartmentDto } from '../../services/departmentService';
import { toastError } from '../../utils/toastHelpers';
import { AxiosError } from 'axios';
import theme from '../../config/theme';

interface CreateDepartmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateDepartmentModal = ({ onClose, onSuccess }: CreateDepartmentModalProps) => {
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    name: '',
    code: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toastError('Name and code are required');
      return;
    }

    setLoading(true);
    try {
      await DepartmentService.createDepartment(formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create department:', error);
      
      const axiosError = error as AxiosError<{ message: string; status?: string }>;
      
      if (axiosError.response?.status === 403) {
        toastError('You do not have permission to create departments. Admin access required.');
      } else if (axiosError.response?.status === 409) {
        toastError('A department with this code already exists.');
      } else if (axiosError.response?.data?.message) {
        toastError(axiosError.response.data.message);
      } else {
        toastError('Failed to create department. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        style={{ backgroundColor: theme.colors.background.paper }}
        className="rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.colors.text.primary }}>
            Create New Department
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <AiOutlineClose className="w-5 h-5" style={{ color: theme.colors.text.secondary }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Department Name *
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                className="w-full px-3 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base"
                style={{
                  borderColor: theme.colors.primary,
                  focusRingColor: theme.colors.primary
                }}
                required 
                disabled={loading}
                placeholder="Enter department name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Department Code *
              </label>
              <input 
                type="text" 
                name="code"
                value={formData.code} 
                onChange={handleChange}
                className="w-full px-3 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base uppercase"
                style={{
                  borderColor: theme.colors.primary,
                  focusRingColor: theme.colors.primary
                }}
                required 
                disabled={loading}
                placeholder="e.g., ENG, HR, FIN"
                maxLength={10}
              />
              <p className="text-xs mt-1" style={{ color: theme.colors.text.secondary }}>
                Maximum 10 characters, will be converted to uppercase
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Description
              </label>
              <textarea 
                name="description"
                value={formData.description} 
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base resize-none"
                style={{
                  borderColor: theme.colors.primary,
                  focusRingColor: theme.colors.primary
                }}
                disabled={loading}
                placeholder="Enter department description (optional)"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              style={{
                borderColor: theme.colors.text.secondary,
                color: theme.colors.text.secondary
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.name || !formData.code}
              className="w-full sm:w-auto px-4 py-2 sm:py-3 text-sm sm:text-base rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;
