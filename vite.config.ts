import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/jiffy-interactions/' : './',
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: false,
    open: '/#/search-to-pdp/card-expand',
  },
  preview: {
    port: 5176,
    strictPort: false,
    open: '/#/search-to-pdp/card-expand',
  },
});
