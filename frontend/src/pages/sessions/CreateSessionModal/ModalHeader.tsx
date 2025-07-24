import React from 'react';
import { CalendarIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { ModalHeaderProps } from './types';

const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
  return (
    <div 
      className="relative p-6 pb-4 flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <CalendarIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            <PlusIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              Create New Session
            </h2>
            <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
              Schedule a new session for your team
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;
