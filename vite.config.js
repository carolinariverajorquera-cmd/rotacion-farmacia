import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas para publicar tanto en Vercel como en una subcarpeta de XAMPP.
  base: './',
  plugins: [react()],
})
