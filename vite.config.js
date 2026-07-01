import { defineConfig }  from 'vite'
import react             from '@vitejs/plugin-react'
import tailwindcss       from '@tailwindcss/vite'
import { writeFileSync } from 'fs'

// rollup-plugin-visualizer: installare con `npm i -D rollup-plugin-visualizer`
// Viene attivato solo con ANALYZE=true (es. `ANALYZE=true npm run build`)
let visualizerPlugin = []
if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer')
  visualizerPlugin = [visualizer({ open: true, gzipSize: true, brotliSize: true })]
}

// Genera dist/version.json al momento del build per il version-check client-side
const versionPlugin = {
  name: 'version-json',
  writeBundle() {
    writeFileSync('dist/version.json', JSON.stringify({ v: Date.now() }))
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin, ...visualizerPlugin],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          recharts: ['recharts'],
          vendor:   ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
