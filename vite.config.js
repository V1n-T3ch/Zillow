import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cacheVersionPlugin } from './vite-plugins/cache-version-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cacheVersionPlugin()
  ],
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  // Add cache headers
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
})
