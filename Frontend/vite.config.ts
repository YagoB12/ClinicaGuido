import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7084', // Cambia si tu backend usa otro puerto
        changeOrigin: true,
        secure: false, // Ignora certificado HTTPS local
      },
    },
  },
})
