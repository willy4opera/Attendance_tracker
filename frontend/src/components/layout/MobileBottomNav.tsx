import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AiOutlineHome,
  AiOutlineCalendar,
  AiOutlineProject,
  AiOutlineTeam,
  AiOutlineUser,
  AiOutlineDashboard,
  AiOutlineBarChart
} from 'react-icons/ai';
import theme from '../../config/theme';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  activeColor?: string;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    icon: AiOutlineDashboard,
    label: 'Dashboard',
    activeColor: theme.colors.primary
  },
  {
    path: '/attendance',
    icon: AiOutlineCalendar,
    label: 'Attendance',
    activeColor: '#10B981'
  },
  {
    path: '/projects',
    icon: AiOutlineProject,
    label: 'Projects',
    activeColor: '#8B5CF6'
  },
  {
    path: '/analytics',
    icon: AiOutlineBarChart,
    label: 'Analytics',
    activeColor: '#F59E0B'
  },
  {
    path: '/profile',
    icon: AiOutlineUser,
    label: 'Profile',
    activeColor: '#EF4444'
  }
];

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 min-w-0 flex-1"
              style={{
                color: active ? (item.activeColor || theme.colors.primary) : theme.colors.text.secondary
              }}
            >
              <Icon 
                className={`w-4 h-4 transition-all duration-200 ${active ? 'scale-110' : ''}`}
              />
              <span 
                className={`text-xs font-medium truncate transition-all duration-200 leading-tight ${
                  active ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div 
                  className="absolute bottom-0 w-6 h-0.5 rounded-t-full transition-all duration-200"
                  style={{ backgroundColor: item.activeColor || theme.colors.primary }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
