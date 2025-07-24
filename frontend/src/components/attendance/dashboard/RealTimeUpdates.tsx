import React from 'react';
import theme from '../../../config/theme';

interface Update {
  type: string;
  message: string;
  time: string;
  data: any;
}

interface RealTimeUpdatesProps {
  updates: Update[];
  isConnected: boolean;
}

const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({ updates, isConnected }) => {
  return (
    <div 
      className="rounded-lg shadow-sm border"
      style={{ 
        backgroundColor: theme.colors.background.paper,
        borderColor: `${theme.colors.text.secondary}30`
      }}
    >
      <div 
        className="px-6 py-4 border-b flex justify-between items-center"
        style={{ borderBottomColor: `${theme.colors.text.secondary}30` }}
      >
        <h3 
          className="text-lg font-medium"
          style={{ color: theme.colors.text.primary }}
        >Live Updates</h3>
        <div className="flex items-center space-x-2 text-sm">
          <div 
            className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: isConnected ? theme.colors.success : theme.colors.text.secondary 
            }}
          ></div>
          <span style={{ color: theme.colors.text.secondary }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="p-6">
        {updates.length > 0 ? (
          <div className="space-y-3">
            {updates.map((update, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p style={{ color: theme.colors.text.primary }}>
                      {update.message}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.text.secondary }}
                    >{update.time}</p>
                  </div>
                  <span 
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: 
                        update.type === 'attendance' ? theme.colors.success :
                        update.type === 'session' ? theme.colors.info : theme.colors.primary
                    }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p 
            className="text-sm text-center"
            style={{ color: theme.colors.text.secondary }}
          >No recent updates</p>
        )}
      </div>
    </div>
  );
};

export default RealTimeUpdates;
