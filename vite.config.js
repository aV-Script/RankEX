import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import tailwindcss      from '@tailwindcss/vite'

// rollup-plugin-visualizer: installare con `npm i -D rollup-plugin-visualizer`
// Viene attivato solo con ANALYZE=true (es. `ANALYZE=true npm run build`)
let visualizerPlugin = []
if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer')
  visualizerPlugin = [visualizer({ open: true, gzipSize: true, brotliSize: true })]
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ...visualizerPlugin],

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
