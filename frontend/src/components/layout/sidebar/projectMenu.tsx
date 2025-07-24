import React from 'react';
import { FaProjectDiagram, FaTasks } from 'react-icons/fa';
import { 
  AiOutlineProject
} from 'react-icons/ai';
import { MdViewKanban } from 'react-icons/md';
import type { MenuItem } from './types';

export const projectMenu: MenuItem = {
  name: 'Project Management',
  path: '/project-management',
  icon: <FaProjectDiagram className="w-5 h-5" />,
  children: [
    {
      name: 'Projects',
      path: '/projects',
      icon: <AiOutlineProject className="w-4 h-4" />
    },
    {
      name: 'Boards',
      path: '/boards',
      icon: <MdViewKanban className="w-4 h-4" />
    },
    {
      name: 'All Tasks',
      path: '/tasks',
      icon: <FaTasks className="w-4 h-4" />
    }
  ]
};
