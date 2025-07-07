import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, './localhost+2-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, './localhost+2.pem')),
      },
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url, '->', env.VITE_BACKEND_URL || 'http://localhost:5000');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Response:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/socket.io': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          ws: true,
          secure: false,
        }
      }
    }
  }
})
