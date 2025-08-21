import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true, // Enable network access
    open: true, // Automatically open browser
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
