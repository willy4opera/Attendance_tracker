import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AiOutlineArrowLeft,
  AiOutlinePlus,
  AiOutlineProject,
  AiOutlineDelete,
  AiOutlineSave,
  AiOutlineCheckCircle
} from 'react-icons/ai';
import { MdViewKanban } from 'react-icons/md';
import { FaTasks } from 'react-icons/fa';

interface TaskListItem {
  id: string;
  name: string;
  tasks: string[];
}

interface BoardItem {
  id: string;
  name: string;
  lists: TaskListItem[];
}

const CreateTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [templateType, setTemplateType] = useState<'project' | 'board' | 'task'>('project');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addBoard = () => {
    const newBoard: BoardItem = {
      id: Date.now().toString(),
      name: `Board ${boards.length + 1}`,
      lists: []
    };
    setBoards([...boards, newBoard]);
  };

  const updateBoard = (boardId: string, name: string) => {
    setBoards(boards.map(board => 
      board.id === boardId ? { ...board, name } : board
    ));
  };

  const deleteBoard = (boardId: string) => {
    setBoards(boards.filter(board => board.id !== boardId));
  };

  const addList = (boardId: string) => {
    const newList: TaskListItem = {
      id: Date.now().toString(),
      name: `List ${boards.find(b => b.id === boardId)?.lists.length + 1 || 1}`,
      tasks: []
    };
    
    setBoards(boards.map(board => 
      board.id === boardId 
        ? { ...board, lists: [...board.lists, newList] }
        : board
    ));
  };

  const updateList = (boardId: string, listId: string, name: string) => {
    setBoards(boards.map(board => 
      board.id === boardId 
        ? {
            ...board,
            lists: board.lists.map(list => 
              list.id === listId ? { ...list, name } : list
            )
          }
        : board
    ));
  };

  const deleteList = (boardId: string, listId: string) => {
    setBoards(boards.map(board => 
      board.id === boardId 
        ? {
            ...board,
            lists: board.lists.filter(list => list.id !== listId)
          }
        : board
    ));
  };

  const addTask = (boardId: string, listId: string) => {
    const taskName = `Task ${boards.find(b => b.id === boardId)?.lists.find(l => l.id === listId)?.tasks.length + 1 || 1}`;
    
    setBoards(boards.map(board => 
      board.id === boardId 
        ? {
            ...board,
            lists: board.lists.map(list => 
              list.id === listId 
                ? { ...list, tasks: [...list.tasks, taskName] }
                : list
            )
          }
        : board
    ));
  };

  const updateTask = (boardId: string, listId: string, taskIndex: number, taskName: string) => {
    setBoards(boards.map(board => 
      board.id === boardId 
        ? {
            ...board,
            lists: board.lists.map(list => 
              list.id === listId 
                ? { 
                    ...list, 
                    tasks: list.tasks.map((task, index) => 
                      index === taskIndex ? taskName : task
                    )
                  }
                : list
            )
          }
        : board
    ));
  };

  const deleteTask = (boardId: string, listId: string, taskIndex: number) => {
    setBoards(boards.map(board => 
      board.id === boardId 
        ? {
            ...board,
            lists: board.lists.map(list => 
              list.id === listId 
                ? { 
                    ...list, 
                    tasks: list.tasks.filter((_, index) => index !== taskIndex)
                  }
                : list
            )
          }
        : board
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSaving(false);
    navigate('/templates');
  };

  const isFormValid = templateName.trim() && templateDescription.trim() && templateCategory.trim();

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
        <button
          onClick={handleSave}
          disabled={!isFormValid || isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <AiOutlineSave className="w-5 h-5" />
              <span>Save Template</span>
            </>
          )}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type *
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="project">Project Template</option>
              <option value="board">Board Template</option>
              <option value="task">Task Template</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Development, Marketing, HR"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mr-2"
                />
                Private
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mr-2"
                />
                Public
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe what this template is for and how it should be used"
          />
        </div>
      </div>

      {/* Template Structure */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Template Structure</h2>
          <button
            onClick={addBoard}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <AiOutlinePlus className="w-5 h-5" />
            <span>Add Board</span>
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <MdViewKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-4">Add your first board to start building your template</p>
            <button
              onClick={addBoard}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <AiOutlinePlus className="w-5 h-5" />
              <span>Add Board</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {boards.map((board) => (
              <div key={board.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MdViewKanban className="w-5 h-5 text-blue-600" />
                    <input
                      type="text"
                      value={board.name}
                      onChange={(e) => updateBoard(board.id, e.target.value)}
                      className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addList(board.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <AiOutlinePlus className="w-4 h-4" />
                      <span>Add List</span>
                    </button>
                    <button
                      onClick={() => deleteBoard(board.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <AiOutlineDelete className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {board.lists.map((list) => (
                    <div key={list.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={list.name}
                          onChange={(e) => updateList(board.id, list.id, e.target.value)}
                          className="font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 flex-1"
                        />
                        <button
                          onClick={() => deleteList(board.id, list.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <AiOutlineDelete className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 mb-3">
                        {list.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center space-x-2">
                            <AiOutlineCheckCircle className="w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={task}
                              onChange={(e) => updateTask(board.id, list.id, taskIndex, e.target.value)}
                              className="text-sm bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 flex-1"
                            />
                            <button
                              onClick={() => deleteTask(board.id, list.id, taskIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <AiOutlineDelete className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => addTask(board.id, list.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors"
                      >
                        <AiOutlinePlus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTemplate;
