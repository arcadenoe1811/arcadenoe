import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El .env vive en la raiz del monorepo.
const raiz = fileURLToPath(new URL('../..', import.meta.url))

// Dentro de Docker (volumen montado desde Windows/macOS) los eventos del
// sistema de archivos no llegan; docker-compose activa el polling.
const usarPolling = process.env.USAR_POLLING === 'true'

// Cabeceras de seguridad de las paginas que sirve Vite (dev y preview):
// sin sniffing de tipos, sin incrustar la app en otro sitio (clickjacking)
// y sin filtrar la URL a terceros.
const cabecerasSeguridad = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export default defineConfig({
  plugins: [react()],
  envDir: raiz,
  server: {
    port: 5173,
    headers: cabecerasSeguridad,
    watch: usarPolling ? { usePolling: true, interval: 300 } : undefined,
  },
  preview: { headers: cabecerasSeguridad },
})
