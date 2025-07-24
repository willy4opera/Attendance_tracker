import React from 'react';
import theme from '../../../config/theme';
import { formatDateTime } from '../../../utils/dateHelpers';
import type { TableListViewProps } from './types';

const TableListView: React.FC<TableListViewProps> = ({
  records,
  getStatusIcon,
  getStatusColor,
  formatStatus,
}) => {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y"
          style={{ borderColor: `${theme.colors.text.secondary}20` }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: theme.colors.text.secondary }}
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: theme.colors.text.secondary }}
              >
                Session
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell"
                style={{ color: theme.colors.text.secondary }}
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                style={{ color: theme.colors.text.secondary }}
              >
                Time
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                style={{ color: theme.colors.text.secondary }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: `${theme.colors.text.secondary}10` }}
          >
            {records.map((record) => {
              const { date, time, relative } = formatDateTime(record.markedAt);
              return (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    {getStatusIcon(record.status)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <div
                        className="text-sm font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {record.sessionTitle}
                      </div>
                      <div
                        className="text-xs sm:hidden"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {relative}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {date}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {time}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {formatStatus(record.status).text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableListView;
