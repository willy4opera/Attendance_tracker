import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import theme from '../../config/theme';

interface QRCodeButtonProps {
  sessionId: string;
  className?: string;
  showLabel?: boolean;
}

const QRCodeButton: React.FC<QRCodeButtonProps> = ({ 
  sessionId, 
  className = "",
  showLabel = false 
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/qr-generator/${sessionId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-opacity-80 ${className}`}
      style={{ 
        backgroundColor: theme.colors.primary,
        color: theme.colors.secondary
      }}
      title="Generate QR Code"
    >
      <QrCode className="w-4 h-4" />
      {showLabel && <span className="text-sm font-medium">QR Code</span>}
    </button>
  );
};

export default QRCodeButton;
