import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@trackmanager-lib/elevation-cursor-sync': resolve(__dirname, 'packages/elevation-cursor-sync/src/index.ts'),
      '@trackmanager-lib/elevation-chart': resolve(__dirname, 'packages/elevation-chart/src/index.ts'),
      '@trackmanager-lib/track-map-utils': resolve(__dirname, 'packages/track-map-utils/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['packages/*/__tests__/**/*.spec.ts'],
  },
})
