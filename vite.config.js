import {buildClientVersion} from './server/clientVersion.js';
import {telemetryPlugin} from './server/telemetryPlugin.js';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  define: {__LAB_CLIENT_VERSION__: JSON.stringify(buildClientVersion())},
  plugins: [react(), telemetryPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
