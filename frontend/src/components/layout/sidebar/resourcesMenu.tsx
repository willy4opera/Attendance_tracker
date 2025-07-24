import React from 'react';
import { AiOutlineAppstore, AiOutlineFile } from 'react-icons/ai';
import { FaColumns } from 'react-icons/fa';
import type { MenuItem } from './types';

export const resourcesMenu: MenuItem = {
  name: 'Resources',
  path: '/resources',
  icon: <AiOutlineAppstore className="w-5 h-5" />,
  children: [
    {
      name: 'Files',
      path: '/files',
      icon: <AiOutlineFile className="w-4 h-4" />
    },
    {
      name: 'Templates',
      path: '/templates',
      icon: <FaColumns className="w-4 h-4" />
    }
  ]
};
