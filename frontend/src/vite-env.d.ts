/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_SOCKET_IO: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_USE_PROXY: string
  readonly VITE_API_HOST: string
  readonly VITE_API_PORT: string
  readonly VITE_API_PROTOCOL: string
  readonly VITE_SOCKET_HOST: string
  readonly VITE_SOCKET_PORT: string
  readonly VITE_SOCKET_PROTOCOL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
