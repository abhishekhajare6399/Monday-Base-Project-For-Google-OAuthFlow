import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get environment variables with defaults
  const serverBaseUrl = env.VITE_SERVER_BASE_URL || 'http://localhost:4002';
  const clientPort = parseInt(env.VITE_CLIENT_PORT || '5173', 10);
  const clientBasePath = env.VITE_CLIENT_BASE_PATH || '/googledrive';
  
  // Extract server base path from server base URL or use default
  const serverBasePath = env.VITE_SERVER_BASE_PATH || '/googledrive';

  return {
    plugins: [react()],
    base: `${clientBasePath}`,
    server: {
      port: clientPort,
      host: true, // Allow external connections
      allowedHosts: [
        'localhost',
        '.ngrok-free.app', // Allow all ngrok-free.app subdomains
        '.ngrok.io', // Allow all ngrok.io subdomains (legacy)
      ],
      proxy: {
        '/api': {
          target: serverBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, serverBasePath), // Replace /api with server base path
        },
      },
    },
  };
})
