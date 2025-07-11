import React from 'react';
import { AiOutlineClose, AiOutlineEdit, AiOutlineCalendar } from 'react-icons/ai';
import type { Department } from '../../services/departmentService';

interface DepartmentDetailsModalProps {
  department: Department;
  onClose: () => void;
  onEdit?: () => void;
}

const DepartmentDetailsModal = ({ department, onClose, onEdit }: DepartmentDetailsModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Department Details</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <AiOutlineEdit className="text-lg" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <AiOutlineClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <p className="text-gray-900 font-medium">{department.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code
                </label>
                <p className="text-gray-900 font-medium">{department.code}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-gray-900">
                  {department.description || 'No description provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    department.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Head of Department */}
          {department.headOfDepartment && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Head of Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">
                    {department.headOfDepartment.firstName} {department.headOfDepartment.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{department.headOfDepartment.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Parent Department */}
          {department.parentDepartment && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Parent Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">{department.parentDepartment.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <p className="text-gray-900">{department.parentDepartment.code}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <AiOutlineCalendar className="text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(department.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AiOutlineCalendar className="text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Updated
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(department.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {department.metadata && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                {department.metadata.createdBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created By
                    </label>
                    <p className="text-gray-900 text-sm">{department.metadata.createdBy}</p>
                  </div>
                )}
                {department.metadata.lastModifiedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Modified By
                    </label>
                    <p className="text-gray-900 text-sm">{department.metadata.lastModifiedBy}</p>
                  </div>
                )}
                {department.metadata.customFields && Object.keys(department.metadata.customFields).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Fields
                    </label>
                    <div className="space-y-1">
                      {Object.entries(department.metadata.customFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600">{key}:</span>
                          <span className="text-sm text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsModal;
