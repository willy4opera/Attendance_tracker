import React from 'react';

export interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface SidebarUser {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified?: boolean;
  profilePicture?: string;
  department?: Department;
}
