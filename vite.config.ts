import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Folder is `Public` (capital P). Default `public` only works on case-insensitive
  // filesystems (e.g. macOS); on Linux (Vercel) fonts would be missing from the build.
  publicDir: 'Public',
  server: {
    allowedHosts: ['.loca.lt']
  }
})
