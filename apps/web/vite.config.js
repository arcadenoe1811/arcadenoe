import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El .env vive en la raiz del monorepo.
const raiz = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: raiz,
  server: {
    port: 5173,
  },
});
