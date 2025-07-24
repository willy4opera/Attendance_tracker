import React from 'react';
import theme from '../../../config/theme';

interface KanbanBoardContainerProps {
  children: React.ReactNode;
}

const KanbanBoardContainer: React.FC<KanbanBoardContainerProps> = ({ children }) => {
  return (
    <div className="h-full flex flex-col">
      {/* This container ensures proper scroll behavior */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ backgroundColor: theme.colors.background.default }}
      >
        {/* Horizontal scroll wrapper */}
        <div className="h-full overflow-x-auto overflow-y-auto">
          {/* Content wrapper with minimum width to prevent column collapse */}
          <div className="h-full inline-flex p-4 space-x-4 min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoardContainer;
