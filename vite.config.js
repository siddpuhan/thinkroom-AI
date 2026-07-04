import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          socket: ["socket.io-client"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    host: 'localhost',
    hmr: {
      host: 'localhost',
    },
  },
})
