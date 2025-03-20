import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  optimizeDeps: {
    include: ['react-helmet', 'react-helmet-async', 'jspdf', 'jspdf-autotable'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  resolve: {
    alias: {
      // This helps with packages that might use Node.js built-ins
      stream: 'stream-browserify',
      path: 'path-browserify',
      util: 'util',
      'jspdf-autotable': path.resolve(__dirname, 'node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js')
    }
  }
}) 