import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const projectId = searchParams.get('projectId');
  const boardId = searchParams.get('boardId');
  const listId = searchParams.get('listId');

  const handleTaskCreated = (task: any) => {
    // Navigate to the task details or back to the board
    if (boardId) {
      navigate(`/boards/${boardId}`);
    } else {
      navigate('/tasks');
    }
  };

  const handleClose = () => {
    // Navigate back to where they came from
    if (boardId) {
      navigate(`/boards/${boardId}`);
    } else if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={handleClose}
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <FaArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
            <p className="mt-3 text-lg text-gray-600">
              Add a new task to your project workflow
            </p>
          </div>
        </div>

        {/* Task Creation Modal (rendered as page content) */}
        <div className="max-w-4xl mx-auto">
          <CreateTaskModal
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleTaskCreated}
            initialProjectId={projectId || undefined}
            initialBoardId={boardId || undefined}
            initialListId={listId || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTask;
