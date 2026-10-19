/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // three.js is large; keep it out of the app chunk so the page shell paints first.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/three\//.test(id)) return 'three'
          if (/node_modules\/(@react-three|postprocessing)\//.test(id)) return 'r3f'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
