import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { InlineConfig } from 'vitest/node'

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  // Port block 4500 per aiprojects/PORTS.md — strictPort exits instead of hopping
  server: {
    port: 4500,
    strictPort: true,
  },
  preview: {
    port: 4501,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
} as VitestConfigExport)
