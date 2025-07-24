import React from 'react';
import { MdDashboard } from 'react-icons/md';
import type { MenuItem } from './types';

export const dashboardMenu: MenuItem = {
  name: 'Dashboard',
  path: '/dashboard',
  icon: <MdDashboard className="w-5 h-5" />
};
