/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analysis: generates stats.html when ANALYZE=true
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ open: false, filename: 'stats.html', gzipSize: true })]
      : []),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split vendor chunk from app code for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          store: ['zustand'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})

