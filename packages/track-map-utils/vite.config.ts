import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrackMapUtils',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      // All map and spatial libs are peer dependencies — keep them external
      external: ['ol', 'kdbush', 'geokdbush', 'geojson'],
      output: {
        globals: { ol: 'ol' },
      },
    },
  },
})
