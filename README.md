# Inventario de cuellos

Sistema personal para registrar, buscar y consultar los cuellos de una tejedora industrial.

- **Frontend:** React + Vite (SPA), JavaScript con JSDoc
- **Base de datos:** Supabase (PostgreSQL + PostgREST)
- **Local:** Supabase CLI sobre Docker (o un `docker-compose.yml` mínimo)

## Requisitos

- Node.js 20 o superior
- Docker Desktop **en ejecución** s

## Puesta en marcha

```bash
# 1. Dependencias (incluye la CLI de Supabase como dependencia de desarrollo)
npm install

# 2. Variables de entorno
cp .env.example .env        # en Windows: copy .env.example .env

# 3. Levantar Supabase local (la primera vez descarga las imágenes, tarda unos minutos)
npm run db:iniciar          # = npx supabase start

# 4. Copiar la llave anónima que imprime el comando anterior
npm run db:estado           # muestra API URL y "anon key"
#    -> pegarla en VITE_SUPABASE_ANON_KEY dentro de .env

# 5. Arrancar la web
npm run dev                 # http://localhost:5173
```

`supabase start` aplica las migraciones de `supabase/migrations/` y carga `supabase/seed.sql` (tres cuellos de ejemplo: `maza4`, `maz4t5`, `cous`).

| Servicio | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API (PostgREST) | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |
| PostgreSQL | `postgresql://postgres:postgres@localhost:54322/postgres` |

### Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de la web |
| `npm run build` | Build de producción en `apps/web/dist` |
| `npm run db:iniciar` | Levanta Supabase local |
| `npm run db:detener` | Detiene Supabase local |
| `npm run db:estado` | URLs y llaves locales |
| `npm run db:reiniciar` | Borra la base, reaplica migraciones y semilla |

### Alternativa: `docker-compose.yml`

Si no quieres usar la CLI, `docker compose up -d` (o `npm run db:compose`) levanta solo PostgreSQL de Supabase, PostgREST y un proxy en `:54321` que imita la ruta `/rest/v1`. No incluye Studio ni Auth. Usa `POSTGRES_PASSWORD` y `JWT_SECRET` del `.env`; la llave anónima debe ser un JWT con `role: anon` firmado con ese `JWT_SECRET` (los valores por defecto del `.env` ya son compatibles entre sí). Las migraciones se aplican solo con el volumen vacío: `docker compose down -v` para empezar de cero.

## Estructura

```
apps/web/                 SPA de React + Vite
  src/components/         Componentes reutilizables
  src/pages/              Búsqueda, ficha, formulario, catálogo de colores
  src/hooks/              usarConsulta, usarRetraso, usarCatalogoColores
  src/theme.js            Tokens de diseño -> CSS custom properties
packages/shared/          Lógica sin React DOM
  api/cliente.js          Instancia única de supabase-js
  api/errores.js          ErrorNormalizado + normalizarError
  cuellos/                api, validaciones, campos (formulario), columnas, filtros
  colores/                api y validaciones del catálogo
  formato/                Formato de tipos, medidas, fechas, URLs de imagen
  tipos/                  @typedef de cada tabla
supabase/
  migrations/             Migraciones SQL numeradas
  seed.sql                Datos de ejemplo
  config.toml             Stack local de la CLI
  docker/                 Archivos de apoyo del docker-compose
```

## Modelo de datos

- **`cuellos`**: código único (en minúsculas), tipo (`liso`, `tubular`, `gaspeado`, `otro`), hilos, posiciones, pasadas, `medidas smallint[]`, notas, `imagen_url`, `activo` (baja lógica), `created_at`, `updated_at` (trigger).
- **`colores_cuello`**: colores por zona (`tubular`, `cuerpo`, `borde`, `otro`) con hilos y orden. Se borran en cascada con el cuello.
- **`catalogo_colores`**: nombres normalizados de colores (y hex opcional) para autocompletar.

Funciones SQL:

- **`fn_buscar_cuellos(termino)`**: busca cuellos activos por código parcial, nombre, notas y colores, sin distinguir mayúsculas ni acentos (`unaccent` + `ILIKE`, con índices `pg_trgm`). Ordena primero coincidencia exacta de código, luego prefijo. Los filtros de tipo y medida se aplican encima desde PostgREST.
- **`fn_guardar_cuello(p_cuello, p_colores)`**: crea o actualiza un cuello y reemplaza sus colores en una sola transacción.

## Imágenes

No se usa Supabase Storage. El campo `imagen_url` guarda un enlace externo público (ImgBB, Cloudinary, Google Drive compartido...). Los enlaces de Google Drive del tipo `drive.google.com/file/d/<id>/view` se convierten solos en una miniatura directa.

Fase 2 posible: subir directamente a Cloudinary con su SDK.

## Seguridad

Es una app personal de un solo usuario pensada para correr en local: las políticas RLS dejan al rol `anon` leer y escribir todo. **Antes de desplegarla en un proyecto Supabase público**, cambia las políticas de la migración para exigir un usuario autenticado y activa el login.

Nunca subas `.env` al repositorio; solo `.env.example` se versiona.

## Reglas del código

- JavaScript con JSDoc, sin TypeScript. Nombres en español.
- Un único `console.log`: el del arranque en `apps/web/src/main.jsx`. Los errores se normalizan con `normalizarError`.
- `packages/shared` no importa React DOM.
- Las validaciones viven en `packages/shared`, no en los componentes.
