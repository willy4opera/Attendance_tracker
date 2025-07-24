import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import theme from '../../config/theme';

interface UncompletionModalProps {
  isOpen: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const UncompletionModal: React.FC<UncompletionModalProps> = ({
  isOpen,
  taskTitle,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                  <FaExclamationTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Mark Task as Uncompleted
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You are about to mark "<strong>{taskTitle}</strong>" as uncompleted. 
                      This will remove the completion timestamp and set the status back to in-progress.
                    </p>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Please provide a reason for this action: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={4}
                      className="shadow-sm block w-full sm:text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: theme.colors.border,
                        '--tw-ring-color': theme.colors.primary
                      } as React.CSSProperties}
                      placeholder="E.g., Additional requirements needed, quality issues found, etc."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    {!reason.trim() && (
                      <p className="mt-1 text-sm text-red-600">Reason is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!reason.trim() || isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {isSubmitting ? 'Processing...' : 'Confirm'}
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

export default UncompletionModal;
