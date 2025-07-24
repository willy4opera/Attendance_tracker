import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import theme from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

interface CompletionModalProps {
  isOpen: boolean;
  taskTitle: string;
  taskStatus?: string;
  onClose: () => void;
  onConfirm: (status: string, comment?: string) => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  taskTitle,
  taskStatus,
  onClose,
  onConfirm
}) => {
  console.log("CompletionModal received props:", { taskTitle, taskStatus });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  
  // Include todo in available statuses for all users
  const availableStatuses = isAdmin 
    ? ['todo', 'in-progress', 'under-review', 'done', 'cancelled'] 
    : ['todo', 'in-progress', 'under-review'];
  
  // Initialize with current task status if it exists, otherwise use defaults
  const getDefaultStatus = () => {
    if (taskStatus && availableStatuses.includes(taskStatus)) {
      return taskStatus;
    }
    return isAdmin ? 'done' : 'under-review';
  };
  
  const [selectedStatus, setSelectedStatus] = useState(getDefaultStatus());

  // Update selectedStatus when taskStatus prop changes
  useEffect(() => {
    setSelectedStatus(getDefaultStatus());
  }, [taskStatus, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    await onConfirm(selectedStatus, comment.trim() || undefined);
    setIsSubmitting(false);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  const currentTime = new Date().toLocaleString();

  const modalTitle = isAdmin && selectedStatus === 'under-review' 
    ? 'Approve Task Completion' 
    : 'Update Task Status';
  
  const actionButtonText = isAdmin && taskStatus === 'under-review'
    ? 'Approve Task'
    : 'Update Status';
  
  const actionButtonTextSubmitting = isAdmin && selectedStatus === 'under-review'
    ? 'Approving...'
    : 'Updating...';

  const description = isAdmin && selectedStatus === 'under-review'
    ? `You are about to approve the completion of "${taskTitle}".`
    : `You are about to update the status of "${taskTitle}".`;

  // Function to display status labels with proper formatting
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'under-review':
        return 'Under Review';
      case 'done':
        return 'Done';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isAdmin && selectedStatus === 'under-review' ? 'bg-blue-100' : 'bg-green-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                  {selectedStatus === 'under-review' && !isAdmin ? (
                    <FaSpinner className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : (
                    <FaCheckCircle className={`h-6 w-6 ${isAdmin && selectedStatus === 'under-review' ? 'text-blue-600' : 'text-green-600'}`} />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {modalTitle}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {description}
                    </p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Current Status:</strong> {getStatusLabel(taskStatus || 'Unknown')}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Time:</strong> {currentTime}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Change Status To
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="shadow-sm block w-full sm:text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: theme.colors.border,
                        '--tw-ring-color': theme.colors.primary
                      } as React.CSSProperties}
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {availableStatuses.map(status => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                      ))}
                    </select>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                      Add a comment (optional)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      className="shadow-sm block w-full sm:text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: theme.colors.border,
                        '--tw-ring-color': theme.colors.primary
                      } as React.CSSProperties}
                      placeholder={isAdmin ? "E.g., All requirements have been verified..." : "E.g., Working on this task..."}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This will be added to the task comments along with the status update timestamp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {isSubmitting ? 'Updating...' : actionButtonText}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                style={{ borderColor: theme.colors.border }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
