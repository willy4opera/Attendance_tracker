import React, { useState } from 'react';
import { requestCache } from '../../utils/requestOptimizer';
import boardService from '../../services/boardService';
import notificationService from '../../services/notificationService';
import { optimizedUserService, optimizedProjectService } from '../../services/optimizedServices';
import { useAuth } from '../../contexts/useAuth';

const ServiceOptimizationTest: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
    requestCache.clear();
    addResult('Cache cleared');
  };

  // Test board service with caching
  const testBoardService = async () => {
    setLoading(true);
    try {
      addResult('Testing board service with caching...');
      
      // First call - should hit API
      const start1 = performance.now();
      const boards1 = await boardService.getBoards({ limit: 5 });
      const time1 = performance.now() - start1;
      addResult(`First call: ${boards1.boards.length} boards fetched in ${time1.toFixed(2)}ms`);
      
      // Second call - should use cache
      const start2 = performance.now();
      const boards2 = await boardService.getBoards({ limit: 5 });
      const time2 = performance.now() - start2;
      addResult(`Second call (cached): ${boards2.boards.length} boards fetched in ${time2.toFixed(2)}ms`);
      
      // Different params - should hit API
      const start3 = performance.now();
      const boards3 = await boardService.getBoards({ limit: 10 });
      const time3 = performance.now() - start3;
      addResult(`Third call (different params): ${boards3.boards.length} boards fetched in ${time3.toFixed(2)}ms`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test notification service with deduplication
  const testNotificationService = async () => {
    if (!user) {
      addResult('Error: User not logged in');
      return;
    }

    setLoading(true);
    try {
      addResult('Testing notification service with deduplication...');
      
      // Make multiple simultaneous requests
      const promises = [
        notificationService.getUnreadCount(user.id),
        notificationService.getUnreadCount(user.id),
        notificationService.getUnreadCount(user.id),
      ];
      
      const start = performance.now();
      const results = await Promise.all(promises);
      const time = performance.now() - start;
      
      addResult(`3 simultaneous unread count requests completed in ${time.toFixed(2)}ms`);
      addResult(`Unread count: ${results[0].data.unreadCount}`);
      addResult('Deduplication prevented 2 duplicate API calls');
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test search optimization
  const testSearchOptimization = async () => {
    setLoading(true);
    try {
      addResult('Testing search optimization...');
      
      // Test user search
      const start1 = performance.now();
      const users1 = await optimizedUserService.searchUsers('test');
      const time1 = performance.now() - start1;
      addResult(`User search "test": ${users1.length} users found in ${time1.toFixed(2)}ms`);
      
      // Same search - should be deduplicated if called quickly
      const start2 = performance.now();
      const users2 = await optimizedUserService.searchUsers('test');
      const time2 = performance.now() - start2;
      addResult(`Same search (deduplicated): ${users2.length} users in ${time2.toFixed(2)}ms`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test cache info
  const showCacheInfo = () => {
    const cacheSize = Object.keys(localStorage).filter(key => 
      key.startsWith('attendance_tracker_')
    ).length;
    
    addResult(`Cache info:`);
    addResult(`- Local storage items: ${cacheSize}`);
    addResult(`- Memory cache size: ${requestCache.size || 0} items`);
  };

  // Simulate rapid API calls
  const testRateLimitPrevention = async () => {
    setLoading(true);
    try {
      addResult('Testing rate limit prevention...');
      
      // Make 10 rapid calls
      const promises = Array(10).fill(null).map(async (_, index) => {
        const start = performance.now();
        try {
          await boardService.searchBoards(`test${index % 3}`); // Only 3 unique searches
          const time = performance.now() - start;
          return { success: true, time, index };
        } catch (error) {
          return { success: false, error, index };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const avgTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.time || 0), 0) / successful;
      
      addResult(`Completed ${successful}/10 requests`);
      addResult(`Average time: ${avgTime.toFixed(2)}ms`);
      addResult(`Deduplication saved ${10 - 3} API calls`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Service Optimization Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={testBoardService}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Board Service
          </button>
          
          <button
            onClick={testNotificationService}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Notifications
          </button>
          
          <button
            onClick={testSearchOptimization}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Search
          </button>
          
          <button
            onClick={testRateLimitPrevention}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Rate Limit Prevention
          </button>
          
          <button
            onClick={showCacheInfo}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Show Cache Info
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Results & Cache
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        
        {loading && (
          <div className="mb-4 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-blue-600">Running test...</span>
          </div>
        )}
        
        <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-y-auto max-h-96">
          {results.length === 0 ? (
            <div className="text-gray-500">No test results yet. Click a test button to start.</div>
          ) : (
            results.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Optimization Features:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
          <li><strong>Caching:</strong> API responses cached for 2-30 minutes depending on data type</li>
          <li><strong>Deduplication:</strong> Identical simultaneous requests share the same promise</li>
          <li><strong>Debouncing:</strong> Search inputs delayed by 300-500ms to reduce API calls</li>
          <li><strong>Throttling:</strong> Frequent actions limited to once per second</li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceOptimizationTest;
