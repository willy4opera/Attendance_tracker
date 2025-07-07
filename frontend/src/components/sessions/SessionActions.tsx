import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Users, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import theme from '../../config/theme';

interface SessionActionsProps {
  session: any;
  onEdit?: (session: any) => void;
  onDelete?: (session: any) => void;
  className?: string;
}

const SessionActions: React.FC<SessionActionsProps> = ({ 
  session, 
  onEdit, 
  onDelete,
  className = ""
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrModerator = user?.role === 'admin' || user?.role === 'moderator';
  const isFacilitator = session.facilitatorId === user?.id;
  const canGenerateQR = isAdminOrModerator || isFacilitator;

  const handleQRGenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/qr-generator/${session._id || session.id}`);
  };

  const handleViewAttendance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/attendance/session/${session._id || session.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(session);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(session);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {canGenerateQR && (
        <button
          onClick={handleQRGenerate}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title="Generate QR Code"
        >
          <QrCode className="w-4 h-4" style={{ color: theme.colors.primary }} />
        </button>
      )}
      
      {isAdminOrModerator && (
        <>
          <button
            onClick={handleViewAttendance}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="View Attendance"
          >
            <Users className="w-4 h-4 text-gray-600" />
          </button>
          
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Session"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Delete Session"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SessionActions;
