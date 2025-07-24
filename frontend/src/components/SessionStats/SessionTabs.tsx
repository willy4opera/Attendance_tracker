import React from 'react';
import {
  CalendarDaysIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { SessionTabsProps } from './types';

const SessionTabs: React.FC<SessionTabsProps> = ({ activeTab, onTabChange, stats }) => {
  const tabs = [
    {
      id: 'all',
      label: 'All Sessions',
      shortLabel: 'All',
      icon: CalendarDaysIcon,
      count: stats.total,
    },
    {
      id: 'active',
      label: 'Active',
      shortLabel: 'Active',
      icon: PlayIcon,
      count: stats.active,
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      shortLabel: 'Coming',
      icon: ClockIcon,
      count: stats.upcoming,
    },
    {
      id: 'completed',
      label: 'Completed',
      shortLabel: 'Done',
      icon: CheckCircleIcon,
      count: stats.completed,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-4 sm:mb-6">
      <nav className="flex space-x-0" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 group relative px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4
                font-medium text-xs sm:text-sm lg:text-base border-b-2 transition-colors
                ${isActive
                  ? 'border-[#fddc9a] text-[#fddc9a] bg-[#fddc9a] bg-opacity-5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-1">
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline lg:text-base">{tab.label}</span>
                  <span className="sm:hidden text-xs font-medium">{tab.shortLabel}</span>
                </div>
                <span className={`
                  inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-full 
                  text-xs font-medium min-w-[1.25rem] sm:min-w-[1.5rem]
                  ${isActive 
                    ? 'bg-[#fddc9a] text-black' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SessionTabs;
