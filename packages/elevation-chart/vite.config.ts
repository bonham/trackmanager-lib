import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({ rollupTypes: true }),
  ],
  resolve: {
    alias: {
      '@bonham/elevation-cursor-sync': resolve(__dirname, '../elevation-cursor-sync/src/index.ts'),
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
      external: ['vue', 'chart.js', 'chart.js/auto', '@bonham/elevation-cursor-sync'],
      output: {
        globals: {
          vue: 'Vue',
          'chart.js': 'Chart',
        },
      },
    },
  },
})
