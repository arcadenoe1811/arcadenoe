# Inventario de cuellos

Sistema personal para registrar, buscar y consultar los cuellos de una tejedora industrial.

- **Frontend:** React + Vite (SPA), JavaScript con JSDoc
- **Base de datos:** Supabase (PostgreSQL + PostgREST + Auth)
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

`supabase start` aplica las migraciones de `supabase/migrations/` y carga las semillas: `seed_usuario.sql` (el usuario del sistema) y `seed.sql` (tres cuellos de ejemplo: `maza4`, `maz4t5`, `cous`).

## Inicio de sesión

Es un sistema de **un solo usuario**: no hay registro ni recuperación de contraseña. Todas las pantallas exigen sesión; sin ella se redirige a `/login`. La sesión se guarda en el navegador y sobrevive a recargas.

| Usuario de desarrollo | |
| --- | --- |
| Correo | `admin@inventario.local` |
| Contraseña | `admin1234` |

> ⚠️ **Esta contraseña es solo para desarrollo local. Cámbiala** en cualquier entorno que no sea tu máquina.

En desarrollo, el formulario se pre-llena con `VITE_DEFAULT_EMAIL` y `VITE_DEFAULT_PASSWORD` del `.env`. Solo se usan con `npm run dev`; en un build de producción se ignoran, y aun así **no deben definirse** en producción (Vite incrusta en el bundle toda variable `VITE_*` que se lea).

### Cambiar la contraseña

Desde Supabase Studio (http://localhost:54323 → *Authentication* → *Users* → el usuario → *Reset password*), o por SQL:

```sql
update auth.users
set encrypted_password = extensions.crypt('nueva-contraseña-segura', extensions.gen_salt('bf'))
where email = 'admin@inventario.local';
```

Para cambiar también el correo, edita `supabase/seed_usuario.sql` antes del primer `supabase start` (o haz `npm run db:reiniciar`).

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

Si no quieres usar la CLI, `docker compose up -d` (o `npm run db:compose`) levanta PostgreSQL de Supabase, PostgREST, GoTrue (Auth) y un proxy en `:54321` que imita las rutas `/rest/v1` y `/auth/v1`. El servicio `semilla-usuario` espera a que GoTrue cree sus tablas y luego inserta el usuario. No incluye Studio. Usa `POSTGRES_PASSWORD` y `JWT_SECRET` del `.env`; la llave anónima debe ser un JWT con `role: anon` firmado con ese `JWT_SECRET` (los valores por defecto del `.env` ya son compatibles entre sí). Las migraciones se aplican solo con el volumen vacío: `docker compose down -v` para empezar de cero.

## Estructura

```
apps/web/                 SPA de React + Vite
  src/components/         Componentes (LayoutPrincipal, RutaProtegida...), cada uno con su .css
  src/components/ui/      Base: Boton, CampoTexto, Tarjeta, Spinner, MensajeError
  src/contextos/          ContextoAuth (sesión global, escucha onAuthStateChange)
  src/pages/              InicioSesion, búsqueda, ficha, formulario, catálogo de colores
  src/hooks/              usarAuth, usarConsulta, usarRetraso, usarCatalogoColores
  src/estilos/            variables.css (tokens), global.css (reset/base), inventario.css
  src/theme.js            Breakpoints y lectura de tokens desde JS
packages/shared/          Lógica sin React DOM
  api/cliente.js          Instancia única de supabase-js
  api/errores.js          ErrorNormalizado + normalizarError
  auth/sesion.js          iniciarSesion, cerrarSesion, obtenerSesion, validarInicioSesion
  cuellos/                api, validaciones, campos (formulario), columnas, filtros
  colores/                api y validaciones del catálogo
  formato/                Formato de tipos, medidas, fechas, URLs de imagen
  tipos/                  @typedef de cada tabla
supabase/
  migrations/             Migraciones SQL numeradas
  seed_usuario.sql        Usuario único (solo desarrollo)
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

- Desde la migración `00002_acceso_autenticado.sql`, solo el rol `authenticated` puede leer o escribir datos; la llave anónima por sí sola no da acceso.
- El registro de usuarios está desactivado (`enable_signup = false`), así que nadie puede crearse una cuenta con la llave pública.
- Cualquier usuario autenticado tiene acceso total. Si algún día se añaden más usuarios, habrá que afinar las políticas RLS.
- Antes de desplegar: cambia la contraseña del usuario y no definas `VITE_DEFAULT_EMAIL` / `VITE_DEFAULT_PASSWORD`.

Nunca subas `.env` al repositorio; solo `.env.example` se versiona.

## Reglas del código

- JavaScript con JSDoc, sin TypeScript. Nombres en español.
- Un único `console.log`: el del arranque en `apps/web/src/main.jsx`. Los errores se normalizan con `normalizarError`.
- `packages/shared` no importa React DOM.
- Las validaciones viven en `packages/shared`, no en los componentes.
- CSS puro, mobile-first (`min-width` en las media queries: 640 / 1024 px), con variables de `estilos/variables.css`. Toques de 44px mínimo y entradas de 16px en móvil.
