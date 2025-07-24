import React from 'react';
import { FaChartBar } from 'react-icons/fa';
import { AiOutlineDashboard } from 'react-icons/ai';
import type { MenuItem } from './types';

export const analyticsMenu: MenuItem = {
  name: 'Analytics',
  path: '/analytics',
  icon: <FaChartBar className="w-5 h-5" />,
  children: [
    {
      name: 'Reports',
      path: '/reports',
      icon: <FaChartBar className="w-4 h-4" />
    },
    {
      name: 'Dashboard Analytics',
      path: '/analytics/dashboard',
      icon: <AiOutlineDashboard className="w-4 h-4" />
    }
  ]
};
