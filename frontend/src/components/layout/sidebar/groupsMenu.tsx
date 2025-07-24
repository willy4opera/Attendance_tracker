import React from 'react';
import { AiOutlineTeam } from 'react-icons/ai';
import type { MenuItem } from './types';

export const groupsMenu: MenuItem = {
  name: 'Groups',
  path: '/groups',
  icon: <AiOutlineTeam className="w-5 h-5" />,
  children: [
    {
      name: 'My Groups',
      path: '/groups/my-groups',
      icon: <AiOutlineTeam className="w-4 h-4" />
    }
  ]
};
