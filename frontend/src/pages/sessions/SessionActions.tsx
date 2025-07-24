import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/useAuth';
import theme from '../../config/theme';

interface SessionActionsProps {
  session: any;
  onPreventNavigation?: (e: React.MouseEvent) => void;
}

export const SessionActions: React.FC<SessionActionsProps> = ({ session, onPreventNavigation }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrModerator = user?.role === 'admin' || user?.role === 'moderator';
  const isFacilitator = session.facilitatorId === user?.id || session.facilitator?.id === user?.id;
  const canGenerateQR = isAdminOrModerator || isFacilitator;

  const handleQRClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPreventNavigation) onPreventNavigation(e);
    navigate(`/qr-generator/${session._id || session.id}`);
  };

  const handleAttendanceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPreventNavigation) onPreventNavigation(e);
    navigate(`/attendance/session/${session._id || session.id}`);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {canGenerateQR && (
        <button
          onClick={handleQRClick}
          className="p-1.5 sm:p-2 rounded-md transition-all duration-200 hover:scale-110"
          title="Generate QR Code"
          style={{ 
            color: theme.colors.primary,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = theme.colors.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.primary;
          }}
        >
          <QrCodeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
      {isAdminOrModerator && (
        <button
          onClick={handleAttendanceClick}
          className="p-1.5 sm:p-2 rounded-md transition-all duration-200 hover:scale-110"
          title="View Attendance"
          style={{ 
            color: theme.colors.text.secondary,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = theme.colors.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.text.secondary;
          }}
        >
          <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};

export default SessionActions;
