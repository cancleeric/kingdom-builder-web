/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // vendor-pixi: WebGL 渲染引擎（大體積，獨立 chunk，棋盤畫面才載入）
          if (
            id.includes('node_modules/pixi.js/') ||
            id.includes('node_modules/pixi-viewport/')
          ) {
            return 'vendor-pixi'
          }
          // vendor-react: react core 三件套（緊耦合，務必同組避免拆散導致 undefined export 白屏）
          if (
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react'
          }
          // vendor-i18n: 國際化 + 狀態管理
          if (
            id.includes('node_modules/i18next/') ||
            id.includes('node_modules/react-i18next/') ||
            id.includes('node_modules/zustand/')
          ) {
            return 'vendor-i18n'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/test/**', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'src/main.tsx'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
})
