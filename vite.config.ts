import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { InlineConfig } from 'vitest/node'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync } from 'node:fs'
import { landingPages } from './landing/pages.mjs'

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig
}

// The 3D dice tray (Customize > 3D Dice) needs the dice-box physics and
// textures as plain files. They are copied from the package into public/assets
// (git ignores them), so dev, build and tests all find them at /assets/.
const diceBoxAssets = () => ({
  name: 'dice-box-assets',
  buildStart() {
    const from = fileURLToPath(new URL('./node_modules/@3d-dice/dice-box/dist/assets', import.meta.url))
    if (existsSync(from)) cpSync(from, fileURLToPath(new URL('./public/assets', import.meta.url)), { recursive: true })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), diceBoxAssets()],
  // Each search landing page is its own HTML entry (see landing/pages.mjs)
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...Object.fromEntries(landingPages.map(p => [
          p.slug,
          fileURLToPath(new URL(`./${p.slug}/index.html`, import.meta.url)),
        ])),
      },
    },
  },
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
