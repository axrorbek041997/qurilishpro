import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          xlsx: ['xlsx'],
          query: ['@tanstack/react-query', 'zustand'],
          ui: ['@headlessui/react'],
        },
      },
    },
  },
})
