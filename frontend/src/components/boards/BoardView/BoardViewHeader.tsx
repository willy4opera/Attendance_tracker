import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaImage, FaSave, FaTimes } from 'react-icons/fa';
import type { Board } from '../../../types';
import theme from '../../../config/theme';

interface BoardViewHeaderProps {
  board: Board;
  onEditHeader: () => void;
  onEdit: () => void;
  isEditingHeader: boolean;
  headerTitle: string;
  headerImage: string | null;
  setHeaderTitle: (title: string) => void;
  handleSaveHeader: () => void;
  handleCancelHeader: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BoardViewHeader: React.FC<BoardViewHeaderProps> = ({
  board,
  onEditHeader,
  onEdit,
  isEditingHeader,
  headerTitle,
  headerImage,
  setHeaderTitle,
  handleSaveHeader,
  handleCancelHeader,
  handleImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative border-b border-gray-200 px-6 py-4"
      style={{
        backgroundColor: headerImage ? 'transparent' : theme.colors.background.paper,
        backgroundImage: headerImage ? `url(${headerImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '120px'
      }}
    >
      {headerImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      )}
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/boards"
            className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          
          {isEditingHeader ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="text-xl font-semibold px-3 py-1 rounded"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: theme.colors.text.primary
                }}
                autoFocus
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                  e.currentTarget.style.color = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                  e.currentTarget.style.color = theme.colors.primary;
                }}
              >
                <FaImage className="h-4 w-4" />
              </button>
              <button
                onClick={handleSaveHeader}
                className="p-2 rounded transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                  e.currentTarget.style.color = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                  e.currentTarget.style.color = theme.colors.primary;
                }}
              >
                <FaSave className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelHeader}
                className="p-2 rounded transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.error,
                  color: 'white'
                }}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold" style={{ color: headerImage ? 'white' : theme.colors.text.primary }}>
                {board.name}
              </h3>
              {board.project && (
                <span className="text-sm" style={{ color: headerImage ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary }}>
                  (Project: {board.project.name})
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isEditingHeader && (
            <button 
              onClick={onEditHeader}
              className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
                e.currentTarget.style.color = theme.colors.primary;
              }}
              title="Edit Board Header"
            >
              <FaEdit className="h-4 w-4" />
              <span className="text-sm">Edit Header</span>
            </button>
          )}
          
          <button 
            onClick={onEdit}
            className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
            title="Edit Board"
          >
            <FaEdit className="h-4 w-4" />
            <span className="text-sm">Edit Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardViewHeader;
