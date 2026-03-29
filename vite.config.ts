import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [react()],
    build: {
      // Enable source maps only in non-production for debugging
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Code splitting: separate vendor chunks
          manualChunks: {
            vendor: ['react', 'react-dom'],
            store: ['zustand'],
          },
        },
      },
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Chunk size warning threshold (500 kB)
      chunkSizeWarningLimit: 500,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      coverage: {
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['src/test/**'],
      },
    },
  }
})
