import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bigtechDesign25/', // GitHub repo name for GitHub Pages
})
