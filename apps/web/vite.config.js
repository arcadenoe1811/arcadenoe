import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El .env vive en la raiz del monorepo.
const raiz = fileURLToPath(new URL('../..', import.meta.url))

// Dentro de Docker (volumen montado desde Windows/macOS) los eventos del
// sistema de archivos no llegan; docker-compose activa el polling.
const usarPolling = process.env.USAR_POLLING === 'true'

export default defineConfig({
  plugins: [react()],
  envDir: raiz,
  server: {
    port: 5173,
    watch: usarPolling ? { usePolling: true, interval: 300 } : undefined,
  },
})
