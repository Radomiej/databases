import {buildClientVersion} from './server/clientVersion.js';
import {telemetryPlugin} from './server/telemetryPlugin.js';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
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
    port: 5186,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5187',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
});
