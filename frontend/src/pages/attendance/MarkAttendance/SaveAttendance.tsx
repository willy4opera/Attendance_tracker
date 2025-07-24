import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import attendanceService from '../../../services/attendanceService';
import type { AttendanceEntry } from './types';
import type { Attendance } from '../../../types/attendance';
import type { MarkAttendanceData } from '../../../types/attendance';

interface SaveAttendanceProps {
  selectedSession: string;
  attendanceData: Map<string, AttendanceEntry>;
  existingAttendance: Attendance[];
  onSaveComplete: () => void;
  debugMode?: boolean;
}

interface DebugLog {
  timestamp: string;
  action: string;
  data: any;
  status: 'info' | 'success' | 'error' | 'warning';
}

interface DebugSaveData {
  endpoint: string;
  method: string;
  payload: any;
  beforeStatus?: string;
  afterStatus?: string;
  response?: any;
}

export const SaveAttendance: React.FC<SaveAttendanceProps> = ({
  selectedSession,
  attendanceData,
  existingAttendance,
  onSaveComplete,
  debugMode = false
}) => {
  const [saving, setSaving] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (action: string, data: any, status: DebugLog['status'] = 'info') => {
    if (debugMode) {
      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        action,
        data,
        status
      }]);
      // Also log to console for immediate visibility
      console.log(`[${status.toUpperCase()}] ${action}:`, data);
    }
  };

  const saveAttendance = async (silent = false) => {
    addDebugLog('Starting save process', { 
      selectedSession, 
      silent,
      totalAttendanceEntries: attendanceData.size,
      existingAttendanceCount: existingAttendance.length 
    });

    if (!selectedSession) {
      const error = 'No session selected';
      addDebugLog('Save validation failed', { error }, 'error');
      if (!silent) toast.error('Please select a session');
      return;
    }

    const modifiedEntries = Array.from(attendanceData.values()).filter(entry => entry.isModified);
    
    // Log before status for all modified entries
    const beforeStatuses = modifiedEntries.map(entry => {
      const existing = existingAttendance.find(r => r.userId === entry.userId);
      return {
        userId: entry.userId,
        beforeStatus: existing?.status || 'not_marked',
        newStatus: entry.status,
        hadExistingRecord: !!existing
      };
    });

    addDebugLog('Before save status', { 
      modifiedCount: modifiedEntries.length,
      beforeStatuses,
      entries: modifiedEntries 
    });
    
    if (modifiedEntries.length === 0) {
      const warning = 'No changes to save';
      addDebugLog('Save aborted', { warning }, 'warning');
      if (!silent) toast.error('No changes to save');
      return;
    }

    try {
      setSaving(true);
      const promises: Promise<any>[] = [];
      const operations: { type: 'create' | 'update', debugData: DebugSaveData, promise: Promise<any> }[] = [];

      // Process each modified attendance entry
      for (const entry of modifiedEntries) {
        const existingRecord = existingAttendance.find(r => r.userId === entry.userId);
        
        if (existingRecord) {
          // Update existing attendance
          const updateData = {
            id: existingRecord.id,
            status: entry.status,
            notes: entry.notes
          };
          
          const debugData: DebugSaveData = {
            endpoint: `/api/attendance/${existingRecord.id}`,
            method: 'PUT',
            payload: updateData,
            beforeStatus: existingRecord.status
          };
          
          addDebugLog('Preparing UPDATE request', { 
            userId: entry.userId,
            existingId: existingRecord.id,
            beforeStatus: existingRecord.status,
            afterStatus: entry.status,
            debugData 
          });
          
          const promise = attendanceService.updateAttendance(updateData)
            .then(result => {
              debugData.afterStatus = entry.status;
              debugData.response = result;
              addDebugLog('UPDATE successful', { 
                userId: entry.userId, 
                beforeStatus: existingRecord.status,
                afterStatus: entry.status,
                endpoint: debugData.endpoint,
                response: result 
              }, 'success');
              return result;
            })
            .catch(error => {
              addDebugLog('UPDATE failed', { 
                userId: entry.userId, 
                endpoint: debugData.endpoint,
                error: error.response?.data || error.message 
              }, 'error');
              throw error;
            });
          
          operations.push({ type: 'update', debugData, promise });
          promises.push(promise);
        } else {
          // Create new attendance record
          const markData: MarkAttendanceData = {
            userId: entry.userId,
            sessionId: selectedSession,
            status: entry.status,
            notes: entry.notes
          };
          
          const debugData: DebugSaveData = {
            endpoint: '/api/attendance/mark',
            method: 'POST',
            payload: markData,
            beforeStatus: 'not_marked'
          };
          
          addDebugLog('Preparing CREATE request', { 
            userId: entry.userId,
            beforeStatus: 'not_marked',
            afterStatus: entry.status,
            debugData 
          });
          
          const promise = attendanceService.markAttendanceManually(markData)
            .then(result => {
              debugData.afterStatus = entry.status;
              debugData.response = result;
              addDebugLog('CREATE successful', { 
                userId: entry.userId,
                beforeStatus: 'not_marked',
                afterStatus: entry.status,
                endpoint: debugData.endpoint,
                response: result 
              }, 'success');
              return result;
            })
            .catch(error => {
              addDebugLog('CREATE failed', { 
                userId: entry.userId,
                endpoint: debugData.endpoint,
                error: error.response?.data || error.message 
              }, 'error');
              throw error;
            });
          
          operations.push({ type: 'create', debugData, promise });
          promises.push(promise);
        }
      }

      addDebugLog('Executing API calls', { 
        operationCount: promises.length,
        operations: operations.map(op => ({
          type: op.type,
          endpoint: op.debugData.endpoint,
          method: op.debugData.method,
          payload: op.debugData.payload
        }))
      });

      const results = await Promise.all(promises);
      
      // Log after save status
      const afterStatuses = operations.map((op, index) => ({
        type: op.type,
        endpoint: op.debugData.endpoint,
        beforeStatus: op.debugData.beforeStatus,
        afterStatus: op.debugData.afterStatus,
        success: !!results[index],
        response: results[index]
      }));

      addDebugLog('All operations completed', { 
        successCount: results.length,
        afterStatuses,
        results 
      }, 'success');
      
      if (!silent) {
        toast.success(`Attendance saved successfully! (${modifiedEntries.length} changes)`);
      }
      
      // Refresh existing attendance
      addDebugLog('Calling onSaveComplete to refresh data', {});
      onSaveComplete();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        message: errorMessage,
        response: (error as any)?.response?.data,
        stack: (error as Error)?.stack
      };
      addDebugLog('Save process failed', errorDetails, 'error');
      console.error('Failed to save attendance:', error);
      if (!silent) toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
      addDebugLog('Save process completed', { saving: false });
    }
  };

  return {
    saveAttendance,
    saving,
    debugLogs,
    clearDebugLogs: () => setDebugLogs([])
  };
};

// Enhanced Debug Panel Component
export const DebugPanel: React.FC<{ logs: DebugLog[] }> = ({ logs }) => {
  const getStatusColor = (status: DebugLog['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: DebugLog['status']) => {
    switch (status) {
      case 'success': return 'bg-green-900/20';
      case 'error': return 'bg-red-900/20';
      case 'warning': return 'bg-yellow-900/20';
      default: return 'bg-gray-900/20';
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">Debug Logs ({logs.length})</h4>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(logs, null, 2))}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          Copy Logs
        </button>
      </div>
      <div className="space-y-2 text-xs font-mono">
        {logs.map((log, index) => (
          <div key={index} className={`border-b border-gray-700 pb-2 p-2 rounded ${getStatusBg(log.status)}`}>
            <div className="flex items-start gap-2">
              <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={getStatusColor(log.status)}>[{log.status.toUpperCase()}]</span>
              <span className="text-blue-400 font-semibold">{log.action}</span>
            </div>
            {log.data && (
              <pre className="mt-1 text-gray-300 overflow-x-auto bg-black/20 p-2 rounded">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
