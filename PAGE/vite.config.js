import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// /grill/:token sirve grill.html en desarrollo (en producción lo hace nginx)
const grillRewrite = {
  name: 'grill-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url.startsWith('/grill/')) req.url = '/grill.html'
      next()
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), grillRewrite],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        grill: resolve(__dirname, 'grill.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api/grill': { target: process.env.API_URL || 'http://localhost:3000', changeOrigin: true },
    },
  },
})
