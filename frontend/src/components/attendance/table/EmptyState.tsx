import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { EmptyStateProps } from './types';

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Attendance records will appear here once marked.',
}) => {
  return (
    <div className="text-center py-12">
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style={{ backgroundColor: `${theme.colors.text.secondary}10` }}
      >
        <ClockIcon
          className="w-8 h-8"
          style={{ color: theme.colors.text.secondary }}
        />
      </div>
      <h3
        className="text-sm font-medium mb-1"
        style={{ color: theme.colors.text.primary }}
      >
        No Recent Attendance
      </h3>
      <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
