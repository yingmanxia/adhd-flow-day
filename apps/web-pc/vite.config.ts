import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const packagesDir = fileURLToPath(new URL('../../packages', import.meta.url))
const packageNames = ['core', 'types', 'ui', 'analytics', 'api-client', 'pc-embed']

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: Object.fromEntries(
      packageNames.map((name) => [`@flowday/${name}`, `${packagesDir}/${name}/src`]),
    ),
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
