import React, { useState, useEffect } from 'react';
import { AiOutlineClose, AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
import DepartmentService from '../../services/departmentService';
import type { Department, UpdateDepartmentDto } from '../../services/departmentService';
import { toastError } from '../../utils/toastHelpers';
import { AxiosError } from 'axios';
import api from '../../services/api';
import theme from '../../config/theme';

interface EditDepartmentModalProps {
  department: Department;
  onClose: () => void;
  onSuccess?: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'user' | 'select';
  value: string;
  options?: string[];
}

const EditDepartmentModal = ({ department, onClose, onSuccess }: EditDepartmentModalProps) => {
  const [formData, setFormData] = useState<UpdateDepartmentDto>({
    name: department.name,
    code: department.code,
    description: department.description || '',
    isActive: department.isActive,
    headOfDepartmentId: department.headOfDepartmentId
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    fetchUsers();
    initializeCustomFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const initializeCustomFields = () => {
    const existingCustomFields = department.metadata?.customFields || {};
    const fields: CustomField[] = [];

    Object.entries(existingCustomFields).forEach(([key, value], index) => {
      let fieldType: 'text' | 'user' | 'select' = 'text';
      if (key.toLowerCase().includes('head') || key.toLowerCase().includes('manager') || key.toLowerCase().includes('lead')) {
        fieldType = 'user';
      }

      fields.push({
        id: `field_${index}`,
        label: key,
        type: fieldType,
        value: String(value || ''),
      });
    });

    setCustomFields(fields);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCustomFieldChange = (fieldId: string, field: keyof CustomField, value: string) => {
    setCustomFields(prev => prev.map(f => 
      f.id === fieldId ? { ...f, [field]: value } : f
    ));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      value: '',
    };
    setCustomFields(prev => [...prev, newField]);
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toastError('Name and code are required');
      return;
    }

    const invalidFields = customFields.filter(f => f.label.trim() === '');
    if (invalidFields.length > 0) {
      toastError('All custom field labels must be filled');
      return;
    }

    setLoading(true);
    try {
      const customFieldsData: Record<string, unknown> = {};
      customFields.forEach(field => {
        if (field.label.trim()) {
          customFieldsData[field.label] = field.value;
        }
      });

      const updateData = {
        ...formData,
        metadata: {
          ...department.metadata,
          customFields: customFieldsData
        }
      };

      await DepartmentService.updateDepartment(department.id, updateData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update department:', error);
      
      const axiosError = error as AxiosError<{ message: string; status?: string }>;
      
      if (axiosError.response?.status === 403) {
        toastError('You do not have permission to update departments. Admin access required.');
      } else if (axiosError.response?.status === 409) {
        toastError('A department with this code already exists.');
      } else if (axiosError.response?.status === 404) {
        toastError('Department not found.');
      } else if (axiosError.response?.data?.message) {
        toastError(axiosError.response.data.message);
      } else {
        toastError('Failed to update department. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm";
    const style = {
      borderColor: theme.colors.primary,
      focusRingColor: theme.colors.primary
    };

    switch (field.type) {
      case 'user':
        return (
          <select
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
            className={baseClasses}
            style={style}
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        );
      case 'select':
        return (
          <select
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
            className={baseClasses}
            style={style}
          >
            <option value="">Select Option</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
            className={baseClasses}
            style={style}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        style={{ backgroundColor: theme.colors.background.paper }}
        className="rounded-lg w-full max-w-4xl mx-auto max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10"
             style={{ backgroundColor: theme.colors.background.paper }}>
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.colors.text.primary }}>
            Edit Department
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <AiOutlineClose className="w-5 h-5" style={{ color: theme.colors.text.secondary }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Basic Information */}
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: theme.colors.background.default }}>
            <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Name *
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm"
                  style={{
                    borderColor: theme.colors.primary,
                    focusRingColor: theme.colors.primary
                  }}
                  required 
                  disabled={loading}
                  placeholder="Enter department name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Code *
                </label>
                <input 
                  type="text" 
                  name="code"
                  value={formData.code} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm uppercase"
                  style={{
                    borderColor: theme.colors.primary,
                    focusRingColor: theme.colors.primary
                  }}
                  required 
                  disabled={loading}
                  placeholder="e.g., ENG, HR"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Description
              </label>
              <textarea 
                name="description"
                value={formData.description} 
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm resize-none"
                style={{
                  borderColor: theme.colors.primary,
                  focusRingColor: theme.colors.primary
                }}
                disabled={loading}
                placeholder="Enter department description"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Head of Department
              </label>
              <select
                name="headOfDepartmentId"
                value={formData.headOfDepartmentId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm"
                style={{
                  borderColor: theme.colors.primary,
                  focusRingColor: theme.colors.primary
                }}
                disabled={loading}
              >
                <option value="">Select Head of Department</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="isActive"
                  checked={formData.isActive} 
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 rounded"
                  style={{ 
                    color: theme.colors.primary,
                    focusRingColor: theme.colors.primary
                  }}
                  disabled={loading}
                />
                <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                  Active Department
                </span>
              </label>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: theme.colors.info + '10' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                Custom Fields
              </h3>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors text-sm hover:opacity-90"
                style={{
                  backgroundColor: theme.colors.info,
                  color: 'white'
                }}
                disabled={loading}
              >
                <AiOutlinePlus className="text-sm" />
                Add Field
              </button>
            </div>

            <div className="space-y-4">
              {customFields.map((field) => (
                <div key={field.id} style={{ backgroundColor: theme.colors.background.paper }} 
                     className="p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: theme.colors.primary,
                          focusRingColor: theme.colors.primary
                        }}
                        placeholder="e.g., Assistant Manager"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleCustomFieldChange(field.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: theme.colors.primary,
                          focusRingColor: theme.colors.primary
                        }}
                        disabled={loading}
                      >
                        <option value="text">Text</option>
                        <option value="user">User Assignment</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                        Value
                      </label>
                      {renderCustomFieldInput(field)}
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                        disabled={loading}
                      >
                        <AiOutlineDelete className="inline text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {customFields.length === 0 && (
                <div className="text-center py-8" style={{ color: theme.colors.text.secondary }}>
                  <p className="text-sm sm:text-base">No custom fields added yet.</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Click "Add Field" to create custom department roles and assignments.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 sm:py-3 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
              className="w-full sm:w-auto px-4 py-2 sm:py-3 text-sm rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              {loading ? 'Updating...' : 'Update Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
