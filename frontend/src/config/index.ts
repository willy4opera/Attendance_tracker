interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  socket: {
    url: string;
    enabled: boolean;
  };
  app: {
    name: string;
    version: string;
  };
  features: {
    notifications: boolean;
  };
  security: {
    sessionTimeout: number;
  };
}

// Helper function to build URL from environment variables or use relative paths
const buildApiUrl = (): string => {
  // If a full URL is provided, use it
  if (import.meta.env.VITE_API_BASE_URL?.startsWith('http')) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // If using proxy in development (Vite proxy), use relative path
  if (import.meta.env.VITE_USE_PROXY === 'true') {
    return import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  // Build URL from parts
  const protocol = import.meta.env.VITE_API_PROTOCOL || window.location.protocol;
  const host = import.meta.env.VITE_API_HOST || window.location.hostname;
  const port = import.meta.env.VITE_API_PORT || '';
  const path = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  return port ? `${protocol}//${host}:${port}${path}` : `${protocol}//${host}${path}`;
};

const buildSocketUrl = (): string => {
  // If a full URL is provided, use it
  if (import.meta.env.VITE_SOCKET_URL?.startsWith('http')) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // If using proxy in development, use relative path
  if (import.meta.env.VITE_USE_PROXY === 'true') {
    return '';  // Socket.io will use the current origin
  }

  // Build URL from parts
  const protocol = import.meta.env.VITE_SOCKET_PROTOCOL || window.location.protocol;
  const host = import.meta.env.VITE_SOCKET_HOST || window.location.hostname;
  const port = import.meta.env.VITE_SOCKET_PORT || '';

  return port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;
};

const config: Config = {
  api: {
    baseUrl: buildApiUrl(),
    timeout: 30000, // 30 seconds
  },
  socket: {
    url: buildSocketUrl(),
    enabled: import.meta.env.VITE_ENABLE_SOCKET_IO === 'true',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Attendance Tracker',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  features: {
    notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  },
  security: {
    sessionTimeout: Number(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000, // 1 hour
  },
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('App Configuration:', {
    apiUrl: config.api.baseUrl,
    socketUrl: config.socket.url,
    useProxy: import.meta.env.VITE_USE_PROXY === 'true',
  });
}

export default config;
