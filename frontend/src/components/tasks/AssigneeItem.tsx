import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import theme from '../../config/theme';

interface AssigneeItemProps {
  userId: number;
}

interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role?: string;
  departmentId?: number;
}

export const AssigneeItem: React.FC<AssigneeItemProps> = ({ userId }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Direct API call to ensure we get the correct response structure
        const response = await api.get(`/users/${userId}`);
        const userData = response.data.data; // Based on the API response structure
        setUser(userData);
      } catch (error) {
        console.error('AssigneeItem: Failed to fetch user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-sm text-gray-500">
        User not found (ID: {userId})
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '??';

  return (
    <Link 
      to={`/profile/${user.id}`} 
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="relative">
        {user.profilePicture ? (
          <>
            <img 
              src={user.profilePicture} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium hidden"
              style={{ 
                backgroundColor: theme.colors.primary
              }}
            >
              {initials}
            </div>
          </>
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ 
              backgroundColor: theme.colors.primary
            }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
          {user.firstName} {user.lastName}
        </p>
      </div>
    </Link>
  );
};

export default AssigneeItem;
