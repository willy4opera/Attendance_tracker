import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import { formatDateTime } from '../../../utils/dateHelpers';
import type { TableGridViewProps } from './types';

const TableGridView: React.FC<TableGridViewProps> = ({
  records,
  getStatusIcon,
  getStatusColor,
  formatStatus,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => {
        const { date, time, relative } = formatDateTime(record.markedAt);
        return (
          <div
            key={record.id}
            className="group relative rounded-lg border p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: theme.colors.background.paper,
              borderColor: `${theme.colors.text.secondary}20`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(record.status)}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    record.status
                  )}`}
                >
                  {formatStatus(record.status).text}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h4
                className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors"
                style={{ color: theme.colors.text.primary }}
              >
                {record.sessionTitle}
              </h4>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-2 border-t"
                style={{ borderColor: `${theme.colors.text.secondary}10` }}
              >
                <div
                  className="flex items-center space-x-1 text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{relative}</span>
                </div>
                <div
                  className="text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {time}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TableGridView;
