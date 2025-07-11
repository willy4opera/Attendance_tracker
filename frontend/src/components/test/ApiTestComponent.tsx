import React, { useState } from 'react';
import api from '../../services/api';

interface ApiResponse {
  status: string;
  message: string;
  timestamp: string;
  requestInfo?: any;
  echo?: string;
  receivedData?: any;
}

const ApiTestComponent: React.FC = () => {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('Hello from React!');

  const testHealthEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/health');
      setResponse(result.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testHelloEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/test/hello');
      setResponse(result.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testEchoEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(`/test/echo/${encodeURIComponent(testMessage)}`);
      setResponse(result.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testPostEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post('/test/data', {
        message: testMessage,
        user: 'react-user',
        timestamp: new Date().toISOString()
      });
      setResponse(result.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">API Proxy Test Component</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Message:
        </label>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter test message"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testHealthEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>
        
        <button
          onClick={testHelloEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Test Hello Endpoint
        </button>
        
        <button
          onClick={testEchoEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          Test Echo Endpoint
        </button>
        
        <button
          onClick={testPostEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          Test POST Endpoint
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-600">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Response:</h3>
          <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">API Proxy Configuration:</h3>
        <div className="text-sm text-gray-600">
          <p><strong>Frontend (Vite):</strong> https://localhost:5173</p>
          <p><strong>Backend API:</strong> http://localhost:5000</p>
          <p><strong>Proxy Path:</strong> /api/v1/* → http://localhost:5000/api/v1/*</p>
          <p><strong>Environment:</strong> Development with Vite proxy</p>
        </div>
      </div>
    </div>
  );
};

export default ApiTestComponent;
