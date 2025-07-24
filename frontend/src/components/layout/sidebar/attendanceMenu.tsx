import React from 'react';
import { 
  AiOutlineCheckCircle, 
  AiOutlineCalendar, 
  AiOutlineCheckSquare,
  AiOutlineQrcode 
} from 'react-icons/ai';
import type { MenuItem } from './types';

export const attendanceMenu: MenuItem = {
  name: 'Attendance',
  path: '/attendance-management',
  icon: <AiOutlineCheckCircle className="w-5 h-5" />,
  children: [
    {
      name: 'Sessions',
      path: '/sessions',
      icon: <AiOutlineCalendar className="w-4 h-4" />
    },
    {
      name: 'My Attendance',
      path: '/attendance',
      icon: <AiOutlineCheckSquare className="w-4 h-4" />
    },
    {
      name: 'QR Scanner',
      path: '/qr-scanner',
      icon: <AiOutlineQrcode className="w-4 h-4" />
    }
  ]
};
