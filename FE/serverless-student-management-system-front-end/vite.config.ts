import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import devtoolsJson from 'vite-plugin-devtools-json'

export default defineConfig({
  server: {
    // thêm phần server để chạy dev CSR
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    // thêm phần preview để chạy build CSR
    port: 3000
  },
  plugins: [devtoolsJson(), tailwindcss(), reactRouter(), tsconfigPaths()],
  css: {
    devSourcemap: true
  }
})
