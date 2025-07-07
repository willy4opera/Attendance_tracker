# Frontend Configuration Guide

## Environment Variables

The frontend uses environment variables for configuration. No URLs are hardcoded.

### Development Setup

1. Copy `.env.example` to `.env`
2. The default configuration uses Vite's proxy feature, so you don't need to specify the backend URL

### Configuration Options

#### Using Vite Proxy (Recommended for Development)
```env
VITE_USE_PROXY=true
VITE_API_BASE_URL=/api/v1
```

This will proxy all `/api` requests to the backend server configured in `vite.config.ts`.

#### Using Full URLs
```env
VITE_USE_PROXY=false
VITE_API_BASE_URL=http://your-backend:8080/api/v1
VITE_SOCKET_URL=http://your-backend:8080
```

#### Using URL Parts
```env
VITE_USE_PROXY=false
VITE_API_PROTOCOL=https
VITE_API_HOST=api.example.com
VITE_API_PORT=8080
VITE_API_BASE_URL=/api/v1
```

### Production Deployment

For production, you have several options:

1. **Same Origin**: If frontend and backend are served from the same domain, use relative URLs:
   ```env
   VITE_API_BASE_URL=/api/v1
   ```

2. **Different Origins**: Specify the full backend URL:
   ```env
   VITE_API_BASE_URL=https://api.example.com/api/v1
   ```

3. **Dynamic Configuration**: Leave URLs empty to use the current window location:
   ```env
   # Will use window.location.hostname and protocol
   VITE_API_HOST=
   VITE_API_PORT=
   ```

### Changing Backend Port

If port 5000 is already in use, update the backend port in:

1. Backend `.env`: `PORT=8080`
2. Frontend `vite.config.ts`: Update the proxy target
   ```ts
   target: process.env.BACKEND_URL || 'http://localhost:8080'
   ```

Or set the `BACKEND_URL` environment variable when running Vite:
```bash
BACKEND_URL=http://localhost:8080 npm run dev
```
