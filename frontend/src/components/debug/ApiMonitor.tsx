import React, { useEffect, useState } from 'react';
import { hasOngoingRequest } from '../../services/api-interceptors';

interface ApiCallStats {
  endpoint: string;
  method: string;
  count: number;
  avgDuration: number;
  lastCall: Date;
  status: 'success' | 'error' | 'pending';
}

interface ApiMonitorProps {
  enabled?: boolean;
}

const ApiMonitor: React.FC<ApiMonitorProps> = ({ enabled = true }) => {
  const [apiStats, setApiStats] = useState<Map<string, ApiCallStats>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Intercept console.log to capture API calls
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      
      // Parse API request logs
      if (args[0] === 'Request:' && args[1] && args[2]) {
        const method = args[1];
        const url = args[2];
        const key = `${method}:${url}`;
        
        setApiStats(prev => {
          const newStats = new Map(prev);
          const existing = newStats.get(key) || {
            endpoint: url,
            method,
            count: 0,
            avgDuration: 0,
            lastCall: new Date(),
            status: 'pending'
          };
          
          newStats.set(key, {
            ...existing,
            count: existing.count + 1,
            lastCall: new Date(),
            status: 'pending'
          });
          
          return newStats;
        });
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      
      // Capture duplicate request warnings
      if (args[0]?.includes('Duplicate request detected:')) {
        // Extract and highlight duplicate requests
        const match = args[0].match(/Duplicate request detected: (.+)/);
        if (match) {
          console.error(`⚠️ DUPLICATE API CALL: ${match[1]}`);
        }
      }
      
      // Capture slow API warnings
      if (args[0]?.includes('Slow API call:')) {
        const match = args[0].match(/Slow API call: (.+) took (\d+)ms/);
        if (match) {
          console.error(`🐌 SLOW API CALL: ${match[1]} (${match[2]}ms)`);
        }
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, [enabled]);

  if (!enabled || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        API Monitor
      </button>
    );
  }

  const sortedStats = Array.from(apiStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10); // Top 10 most called endpoints

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <h3 className="font-semibold">API Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-300 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-80">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            Top API Calls (by frequency)
          </div>
          
          {sortedStats.map(([key, stats]) => (
            <div key={key} className="border-b pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-xs font-mono text-gray-700">
                    {stats.method} {stats.endpoint}
                  </div>
                  <div className="text-xs text-gray-500">
                    Count: {stats.count} | Last: {stats.lastCall.toLocaleTimeString()}
                  </div>
                </div>
                {stats.count > 5 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    High
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {sortedStats.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              No API calls detected yet
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => {
              setApiStats(new Map());
              console.log('API stats cleared');
            }}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            Clear Stats
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiMonitor;
