import { dashboardMenu } from './dashboardMenu';
import { projectMenu } from './projectMenu';
import { groupsMenu } from './groupsMenu';
import { attendanceMenu } from './attendanceMenu';
import { analyticsMenu } from './analyticsMenu';
import { resourcesMenu } from './resourcesMenu';
import { adminMenu } from './adminMenu';
import { profileMenu } from './profileMenu';
import type { MenuItem } from './types';

export const menuItems: MenuItem[] = [
  dashboardMenu,
  projectMenu,
  groupsMenu,
  attendanceMenu,
  analyticsMenu,
  resourcesMenu,
  adminMenu,
  profileMenu
];

export const filterMenuItems = (items: MenuItem[], userRole: string = 'user'): MenuItem[] => {
  return items.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  }).map(item => ({
    ...item,
    children: item.children?.filter(child => {
      if (!child.roles) return true;
      return child.roles.includes(userRole);
    })
  }));
};
