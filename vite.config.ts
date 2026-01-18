import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/auth': {
        target: 'https://backend-8ao1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://backend-8ao1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
