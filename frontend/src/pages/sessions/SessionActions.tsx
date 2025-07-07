import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Users } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      {canGenerateQR && (
        <button
          onClick={handleQRClick}
          className="p-2 rounded-md transition-colors hover:bg-gray-100"
          title="Generate QR Code"
          style={{ color: theme.colors.primary }}
        >
          <QrCode className="w-5 h-5" />
        </button>
      )}
      {isAdminOrModerator && (
        <button
          onClick={handleAttendanceClick}
          className="p-2 rounded-md transition-colors hover:bg-gray-100"
          title="View Attendance"
        >
          <Users className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default SessionActions;
