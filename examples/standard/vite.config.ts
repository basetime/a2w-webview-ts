import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  appType: 'mpa',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        standby: resolve(__dirname, 'standby/index.html'),
        scan: resolve(__dirname, 'scan/index.html'),
        error: resolve(__dirname, 'error/index.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['localhost', 'geraldo-bemused-deetta.ngrok-free.dev'],
  },
  preview: {
    host: true,
    port: 5173,
  },
});
