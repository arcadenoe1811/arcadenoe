# Frontend en desarrollo: servidor de Vite con recarga en caliente.
# Se construye desde la raiz del monorepo (ver docker-compose.yml) porque
# la web depende del workspace @inventario/shared.
FROM node:22-alpine

WORKDIR /app

# Solo los manifiestos primero: la capa de dependencias se reutiliza
# mientras no cambien package.json / package-lock.json.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# --ignore-scripts: evita que la CLI de Supabase (devDependency de la raiz)
# descargue su binario; dentro del contenedor no se usa.
RUN npm ci --ignore-scripts

# El codigo se monta como volumen en docker-compose; esta copia solo sirve
# si se ejecuta la imagen sin volumen.
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "@inventario/web", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
