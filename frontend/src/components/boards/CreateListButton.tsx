import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

interface CreateListButtonProps {
  onCreateList: (name: string) => Promise<void>;
}

const CreateListButton: React.FC<CreateListButtonProps> = ({ onCreateList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [listName, setListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateList(listName.trim());
      setListName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setListName('');
    setIsCreating(false);
  };

  if (!isCreating) {
    return (
      <div className="flex-shrink-0 w-80">
        <button
          onClick={() => setIsCreating(true)}
          className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="font-medium">Add another list</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-80">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4">
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="Enter list title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
          disabled={isSubmitting}
        />
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            disabled={!listName.trim() || isSubmitting}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Add list</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListButton;
