/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // RoomManager in @hd/game-kit uses node:crypto (server-only).
    // Kingdom Builder only uses WsTransport and type exports, never RoomManager.
    // Stub node:crypto so the unused import does not break the browser bundle.
    alias: {
      'node:crypto': '/src/multiplayer/nodeCryptoStub.ts',
    },
  },
  optimizeDeps: {
    // @hd/game-kit contains node:crypto imports (RoomManager, server-only).
    // Excluding from esbuild pre-bundling lets vite's own alias resolution
    // handle the node:crypto stub instead of esbuild failing at its scan step.
    exclude: ['@hd/game-kit'],
  },
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
  },
})
