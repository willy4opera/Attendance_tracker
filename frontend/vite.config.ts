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
      // Improve WebSocket handling
      hmr: {
        overlay: true,
        clientPort: 5173,
      },
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
          // Improve WebSocket proxy handling
          timeout: 60000,
          proxyTimeout: 60000,
        },
        '/uploads': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            // Split vendor dependencies
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-utils': ['axios', 'lodash'],
            'vendor-icons': ['react-icons', 'lucide-react', '@heroicons/react'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'yup'],
            'vendor-ui': ['react-hot-toast', 'sweetalert2'],
            'vendor-charts': ['recharts'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            'vendor-qr': ['qrcode.react', 'jsqr'],
            'vendor-socket': ['socket.io-client'],
            'vendor-state': ['zustand'],
            'vendor-utils-misc': ['date-fns', 'clsx']
          }
        }
      },
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        '@tanstack/react-query',
        'react-hook-form',
        'react-icons',
        'lucide-react'
      ]
    }
  };
});
