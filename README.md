# Inventario de cuellos

Sistema personal para registrar, buscar y consultar los cuellos de una tejedora industrial.

- **Frontend:** React + Vite (SPA), JavaScript con JSDoc
- **Base de datos:** Supabase (PostgreSQL + PostgREST + Auth)
- **Local:** todo en Docker con `docker-compose.yml` (frontend + backend + BD), o Supabase CLI + `npm run dev`

## Requisitos

- Node.js 20 o superior
- Docker Desktop **en ejecución**

## Puesta en marcha

### Opción A — Todo en Docker (frontend, backend y BD)

```bash
cp .env.example .env        # en Windows: copy .env.example .env
npm run docker:iniciar      # = docker compose up -d --build
```

| Capa     | Servicio                   | URL / puerto           |
| -------- | -------------------------- | ---------------------- |
| Frontend | `web` (Vite + React)       | http://localhost:5173  |
| Backend  | `api` → `rest` + `auth`    | http://localhost:54321 |
| BD       | `db` (PostgreSQL Supabase) | `localhost:54322`      |

El código se monta como volumen: los cambios en `apps/web` y `packages/shared` se recargan solos. Si cambias dependencias (`package.json`), reconstruye con `npm run docker:iniciar`. Detalles en [Alternativa: `docker-compose.yml`](#alternativa-docker-composeyml).

> No uses la opción A y la B al mismo tiempo: comparten los puertos 54321, 54322 y 5173.

### Opción B — Supabase CLI + Vite en tu máquina

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

`supabase start` aplica las migraciones de `supabase/migrations/` y carga las semillas: `seed_usuario.sql` (el primer usuario, admin) y `seed.sql` (tres cuellos de ejemplo: `maza4`, `maz4t5`, `cous`) y `seed_disenos.sql` (50 cuellos `dsn-01` a `dsn-50` con diseño Jacquard y todos los datos técnicos).

## Inicio de sesión, usuarios y roles

Todas las pantallas exigen sesión; sin ella se redirige a `/login`. No hay registro público: los usuarios los crea un administrador desde la pantalla **Usuarios**.

| Usuario inicial (solo desarrollo) |                          |
| --------------------------------- | ------------------------ |
| Correo                            | `admin@inventario.local` |
| Contraseña                        | `admin1234`              |

> ⚠️ **Esta contraseña es solo para desarrollo local. Cámbiala** (clic en tu nombre → _Cambiar contraseña_) en cualquier entorno que no sea tu máquina. El formulario de login ya no se pre-llena con credenciales.

El primer usuario del sistema es **admin**. Hay dos roles:

| Módulo               | Administrador (`admin`)                         | Operador (`operador`)           |
| -------------------- | ----------------------------------------------- | ------------------------------- |
| Usuarios             | Crear, editar, habilitar/deshabilitar, resetear | Sin acceso                      |
| Conos                | Todo (incluye eliminar y desactivar)            | Crear, editar, entradas/salidas |
| Colores              | Todo (incluye eliminar)                         | Crear y editar                  |
| Cuellos / puños      | Todo                                            | Solo consulta                   |
| Precios y tarifa     | Cambiar precio base y tarifa por hora           | Solo consulta                   |
| Ventas               | Registrar y eliminar                            | Registrar                       |
| Estimador            | Guardar y eliminar estimaciones                 | Guardar estimaciones            |
| Producción           | Registrar y eliminar                            | Registrar                       |
| Dashboard y reportes | Ver                                             | Ver                             |

- Los usuarios **no se eliminan**: se deshabilitan (no pueden entrar y se cierran sus sesiones).
- Siempre queda al menos un admin activo y un admin no puede deshabilitarse a sí mismo.
- Un usuario nuevo (o con la contraseña reseteada) entra con una **contraseña temporal** y debe cambiarla antes de usar el sistema.
- Contraseñas: mínimo 8 caracteres, con al menos un número y una mayúscula.

### Sesión

- La sesión se cierra sola tras **8 horas de inactividad** (`VITE_SESION_INACTIVIDAD_MINUTOS`), también si la app estuvo cerrada. El servidor aplica el mismo límite (`GOTRUE_SESSIONS_INACTIVITY_TIMEOUT` / `[auth.sessions]`).
- _Cerrar sesión_ revoca los tokens en el servidor, borra lo guardado en el navegador y recarga la página.
- Tras **5 contraseñas incorrectas** la cuenta queda bloqueada **15 minutos**.

### Si olvidas la contraseña del único admin

Por SQL (Supabase Studio, o `docker compose exec db psql -U postgres`):

```sql
update auth.users
set encrypted_password = extensions.crypt('Nueva-Contraseña-1', extensions.gen_salt('bf'))
where email = 'admin@inventario.local';
delete from public.intentos_acceso;  -- levanta un bloqueo por intentos fallidos
```

### Aplicar una migración nueva a una base que ya tiene datos

- **Supabase CLI:** `npx supabase migration up`.
- **docker-compose:** las migraciones solo corren con el volumen vacío, así que se aplica a mano y se recrean los servicios:

  ```bash
  docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -h localhost -d postgres -v ON_ERROR_STOP=1' < supabase/migrations/00011_usuarios_roles_seguridad.sql
  docker compose up -d
  ```

| Servicio        | URL                                                       |
| --------------- | --------------------------------------------------------- |
| Web             | http://localhost:5173                                     |
| API (PostgREST) | http://localhost:54321                                    |
| Supabase Studio | http://localhost:54323                                    |
| PostgreSQL      | `postgresql://postgres:postgres@localhost:54322/postgres` |

### Comandos útiles

| Comando                  | Qué hace                                      |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | Servidor de desarrollo de la web              |
| `npm run build`          | Build de producción en `apps/web/dist`        |
| `npm run db:iniciar`     | Levanta Supabase local                        |
| `npm run db:detener`     | Detiene Supabase local                        |
| `npm run db:estado`      | URLs y llaves locales                         |
| `npm run db:reiniciar`   | Borra la base, reaplica migraciones y semilla |
| `npm run docker:iniciar` | Opción A: construye y levanta web + API + BD  |
| `npm run docker:detener` | Opción A: detiene el stack (conserva datos)   |
| `npm run docker:estado`  | Opción A: estado de los contenedores          |
| `npm run docker:logs`    | Opción A: logs en vivo                        |

### Alternativa: `docker-compose.yml`

`docker compose up -d --build` (o `npm run docker:iniciar`) levanta el frontend (`web`, servidor de Vite), PostgreSQL de Supabase, PostgREST, GoTrue (Auth) y un proxy en `:54321` que imita las rutas `/rest/v1` y `/auth/v1`. El proyecto se llama `inventario-cuellos` en Docker. El servicio `semilla-usuario` espera a que GoTrue cree sus tablas y luego inserta el primer usuario (admin). No incluye Studio. Usa `POSTGRES_PASSWORD` y `JWT_SECRET` del `.env`; la llave anónima debe ser un JWT con `role: anon` firmado con ese `JWT_SECRET` (los valores por defecto del `.env` ya son compatibles entre sí). Las migraciones se aplican solo con el volumen vacío: `docker compose down -v` para empezar de cero.

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
  usuarios/               permisos por rol, validaciones y API de gestión de usuarios
  cuellos/                api, validaciones, campos (formulario), columnas, filtros
  colores/                api y validaciones del catálogo
  formato/                Formato de tipos, medidas, fechas, URLs de imagen
  tipos/                  @typedef de cada tabla
supabase/
  migrations/             Migraciones SQL numeradas
  seed_usuario.sql        Primer usuario, admin (solo desarrollo)
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

Ventas, estimador y reportes (`00012_ventas_estimador_reportes.sql`):

- **`cuellos.precio_base`**: precio de venta del diseño (igual para todas las tallas). Cada línea de venta guarda su propio precio, así que cambiarlo no altera ventas pasadas.
- **`ventas` / `venta_lineas`**, **`estimaciones` / `estimacion_lineas`**, **`producciones`**: no aceptan escrituras directas por la API; se registran con `fn_registrar_venta`, `fn_guardar_estimacion` y `fn_registrar_produccion`, que validan cada dato y calculan los totales en la base.
- **`v_stock_cuellos`**: vendido y producido por diseño y medida. Se trabaja **bajo pedido**: no se lleva existencia de cuellos; lo vendido que aún no se produjo aparece como _pendiente de producir_ en la pantalla Producción.
- **`configuracion`**: fila única con la tarifa de mano de obra por hora del estimador.
- **`fn_dashboard`, `fn_reporte_inventario|produccion|ventas`, `fn_resumen_periodo`, `fn_actividad_reciente`**: devuelven las cifras ya agregadas para un rango de fechas (la API entrega como mucho 1000 filas, por eso no se suma en el navegador).

## Imágenes

No se usa Supabase Storage. El campo `imagen_url` guarda un enlace externo público (ImgBB, Cloudinary, Google Drive compartido...). Los enlaces de Google Drive del tipo `drive.google.com/file/d/<id>/view` se convierten solos en una miniatura directa.

Fase 2 posible: subir directamente a Cloudinary con su SDK.

## Seguridad

No hay servidor propio: el "backend" es PostgreSQL (RLS y funciones) + PostgREST + GoTrue. Por eso la autorización vive en la base (`supabase/migrations/00011_usuarios_roles_seguridad.sql`):

- **Autenticación:** la llave anónima por sí sola no da acceso a nada; el registro público está desactivado. Las contraseñas se guardan con bcrypt (Supabase Auth).
- **Autorización por rol:** políticas RLS en todas las tablas según `perfiles.rol`. Lo que la interfaz oculta al operador, la API también lo rechaza con **403**. La tabla de permisos de la interfaz (`packages/shared/usuarios/permisos.js`) debe coincidir con las políticas.
- **Gestión de usuarios:** funciones SQL `fn_*_usuario` que verifican que quien llama sea admin. El navegador nunca usa la llave `service_role`.
- **Usuarios deshabilitados:** pierden el acceso al instante, aunque su token siga vigente.
- **Inyección SQL:** todo el acceso es por PostgREST (consultas parametrizadas) y funciones sin SQL dinámico.
- **Totales y autoría:** los totales de ventas y estimaciones se calculan en la base y `usuario_id` sale de la sesión; el navegador no puede falsearlos.
- **CORS:** el proxy (`supabase/docker/nginx.conf`) y PostgREST solo aceptan el origen de la app (`localhost:5173`). Si sirves la app desde otra dirección, agrégala en ambos.
- **Exportación a Excel:** las celdas de texto que empiezan por `=`, `+`, `-` o `@` se neutralizan (inyección de fórmulas en CSV).
- **Cabeceras:** Vite envía `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: no-referrer`.
- **Validación:** en `packages/shared` (navegador) y otra vez en la base (`check` y funciones).
- **Token en el navegador:** supabase-js lo guarda en `localStorage`, no en cookies, así que los flags `HttpOnly`/`Secure`/`SameSite` no aplican. Mitigaciones: token de 1 hora, refresh tokens rotados, expiración por inactividad y nada de HTML sin escapar en la app.

Antes de desplegar fuera de tu máquina: sirve la app y la API por **HTTPS**, cambia `JWT_SECRET`, `POSTGRES_PASSWORD` y la llave anónima por valores propios, y cambia la contraseña del admin inicial.

Nunca subas `.env` al repositorio; solo `.env.example` se versiona. Toda variable `VITE_*` queda incrustada en el JavaScript del navegador: no pongas secretos ahí.

## Reglas del código

- JavaScript con JSDoc, sin TypeScript. Nombres en español.
- Un único `console.log`: el del arranque en `apps/web/src/main.jsx`. Los errores se normalizan con `normalizarError`.
- `packages/shared` no importa React DOM.
- Las validaciones viven en `packages/shared`, no en los componentes.
- CSS puro, mobile-first (`min-width` en las media queries: 640 / 1024 px), con variables de `estilos/variables.css`. Toques de 44px mínimo y entradas de 16px en móvil.
