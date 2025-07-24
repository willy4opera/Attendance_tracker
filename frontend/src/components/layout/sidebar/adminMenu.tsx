import React from 'react';
import { AiOutlineSetting, AiOutlineTeam } from 'react-icons/ai';
import type { MenuItem } from './types';

export const adminMenu: MenuItem = {
  name: 'Administration',
  path: '/administration',
  icon: <AiOutlineSetting className="w-5 h-5" />,
  roles: ['admin', 'moderator'],
  children: [
    {
      name: 'Users',
      path: '/users',
      icon: <AiOutlineTeam className="w-4 h-4" />,
      roles: ['admin', 'moderator']
    },
    {
      name: 'Departments',
      path: '/departments',
      icon: <AiOutlineTeam className="w-4 h-4" />,
      roles: ['admin', 'moderator']
    },
    {
      name: 'Group Management',
      path: '/admin/groups',
      icon: <AiOutlineTeam className="w-4 h-4" />,
      roles: ['admin', 'moderator']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <AiOutlineSetting className="w-4 h-4" />,
      roles: ['admin']
    }
  ]
};
