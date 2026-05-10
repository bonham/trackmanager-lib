import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Resolve sibling package from source during build
      '@la-rampa/elevation-cursor-sync': resolve(__dirname, '../elevation-cursor-sync/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ElevationChart',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      // Peer dependencies — not bundled
      external: ['vue', 'chart.js', 'chart.js/auto', '@la-rampa/elevation-cursor-sync'],
      output: {
        globals: {
          vue: 'Vue',
          'chart.js': 'Chart',
        },
      },
    },
  },
})
