import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrackMapUtils',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['ol', 'kdbush', 'geokdbush', 'geojson'],
      output: {
        globals: { ol: 'ol' },
      },
    },
  },
})
