import React from 'react';
import { AiOutlineUser } from 'react-icons/ai';
import type { MenuItem } from './types';

export const profileMenu: MenuItem = {
  name: 'Profile',
  path: '/profile',
  icon: <AiOutlineUser className="w-5 h-5" />
};
