import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative base './' so assets resolve cleanly on both localhost and GitHub Pages (/pebble/)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
