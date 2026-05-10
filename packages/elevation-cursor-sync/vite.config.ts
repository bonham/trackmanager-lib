import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ElevationCursorSync',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      // Vue is a peer dependency — keep it external in the bundle
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
})
