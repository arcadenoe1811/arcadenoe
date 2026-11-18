# 04 — Arquitectura del sistema

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Descripción de la arquitectura

El sistema sigue una arquitectura **SPA + BaaS (Backend as a Service)**. No existe un
servidor de aplicaciones propio: el navegador ejecuta una SPA de React que se comunica
**directamente** con la plataforma Supabase (PostgREST para datos y GoTrue para
autenticación) usando la *anon key*. Toda la lógica de negocio sensible y **toda la
autorización** residen en la base de datos PostgreSQL (políticas RLS, funciones
`SECURITY DEFINER` y triggers).

Esto es una variante del modelo de 3 capas clásico:

| Capa clásica | En este proyecto |
| --- | --- |
| Presentación (Frontend) | SPA React + Vite (navegador). |
| Lógica de negocio (Backend) | **Funciones SQL + RLS + triggers** en PostgreSQL (no hay API server propia). |
| Datos | PostgreSQL (Supabase). |

El “backend” es, por lo tanto, la **base de datos misma**, expuesta de forma segura por
PostgREST. La seguridad no depende del frontend: lo que la interfaz oculta, la API lo
rechaza con **403**.

## 2. Arquitectura frontend

- **Framework:** React 18 (componentes funcionales + hooks).
- **Enrutado:** React Router DOM 6; las rutas se definen en [`apps/web/src/App.jsx`](../../apps/web/src/App.jsx).
- **Estado global:** `ContextoAuth` (sesión del usuario, rol y permisos) que escucha `onAuthStateChange` de supabase-js.
- **Hooks de datos:** `useConsulta`, `useCuellos`, `useConos`, `useUsuarios`, etc. encapsulan las llamadas a la API y el manejo de carga/error.
- **Protección de rutas:** `RutaProtegida` decide qué se muestra según sesión y permiso (la autorización real está en la base).
- **UI:** componentes base en `src/components/ui/` (Boton, CampoTexto, Tarjeta, Modal, Spinner, MensajeError) y CSS puro *mobile-first* con tokens en `src/estilos/variables.css`.
- **Build:** Vite genera `apps/web/dist` (estático) para producción.

## 3. Arquitectura backend

No hay servidor de aplicaciones. El rol de backend lo cumplen:

- **PostgREST:** expone las tablas y funciones de PostgreSQL como API REST. Las operaciones de escritura sensibles **no** se hacen por tablas directas sino por **funciones RPC** (`fn_registrar_venta`, `fn_guardar_cono`, etc.) que validan y calculan en la base.
- **GoTrue (Supabase Auth):** maneja el login, los JWT (1 h), los refresh tokens (rotados) y el hashing bcrypt de contraseñas. Un *hook* bloquea la cuenta tras 5 intentos fallidos.
- **PostgreSQL:** motor de datos y, a la vez, capa de lógica y autorización:
  - **RLS (Row Level Security)** activa en todas las tablas, según `perfiles.rol`.
  - **Funciones `SECURITY DEFINER`** para operaciones que requieren privilegios controlados.
  - **Triggers** que protegen invariantes (stock, `updated_at`, último admin, etc.).

## 4. Arquitectura de base de datos

- **Motor:** PostgreSQL 15 (imagen de Supabase).
- **Esquemas:** `public` (dominio), `auth` (GoTrue), `extensions` (`unaccent`, `pg_trgm`).
- **Migraciones versionadas:** `supabase/migrations/00001`–`00015` (idempotentes, se aplican en orden).
- **Búsqueda:** índices `pg_trgm` sobre texto sin acentos (`f_sin_acentos`) para búsquedas rápidas tolerantes a tildes y mayúsculas.
- **Integridad:** claves foráneas, restricciones `check` exhaustivas, columnas generadas (estado, valor de stock, subtotales) y vistas agregadas (`v_stock_cuellos`, `v_estado_ventas`).

Detalle completo en [05 — Diccionario de datos y DER](05_diccionario_datos.md).

## 5. Comunicación entre componentes

```
   Navegador (SPA React + Vite)
        │  supabase-js (anon key + JWT en Authorization)
        │  HTTPS (prod) / HTTP localhost (dev)
        ▼
   ┌──────────── Supabase ────────────┐
   │  GoTrue (/auth/v1)  ← login, tokens, bcrypt
   │  PostgREST (/rest/v1) ← SELECT y RPC a funciones
   │        │                         │
   │        ▼                         ▼
   │   PostgreSQL  ── RLS · funciones SECURITY DEFINER · triggers
   └───────────────────────────────────┘
```

- El navegador envía el JWT en la cabecera `Authorization: Bearer <token>`; **no** se usan cookies, por lo que el CSRF clásico no aplica.
- PostgREST aplica la RLS en nombre del rol `authenticated`; las funciones verifican el rol concreto.
- CORS: en local, el proxy nginx y PostgREST solo aceptan el origen de la app (`localhost:5173`).

## 6. Servicios externos e integraciones

| Servicio | Uso | Nota |
| --- | --- | --- |
| Supabase | Base de datos, API (PostgREST) y Auth (GoTrue). | Local (Docker/CLI) o Supabase Cloud. |
| Alojamiento de imágenes externo | `imagen_url` de cuellos y conos (ImgBB, Cloudinary, Google Drive). | No se usa Supabase Storage (deshabilitado). |

## 7. Tecnologías y herramientas utilizadas

- **Frontend:** React 18.3, React Router DOM 6.28, Vite 6, JavaScript (ESM) + JSDoc, `@supabase/supabase-js` 2.45+.
- **Base de datos:** PostgreSQL 15, PostgREST, GoTrue, extensiones `unaccent` y `pg_trgm`.
- **Monorepo:** npm workspaces — `apps/web` (SPA) y `packages/shared` (lógica sin React DOM).
- **Calidad:** ESLint 9, Prettier 3, Vitest 4 + Testing Library.
- **Infra:** Docker Compose (stack local completo) o Supabase CLI + `npm run dev`.

## 8. Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                           NAVEGADOR (cliente)                         │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  SPA React + Vite                                             │   │
│  │   App.jsx (rutas) · ContextoAuth · hooks · componentes · UI  │   │
│  └───────────────────────────┬───────────────────────────────────┘   │
│                              │ packages/shared (API, validaciones)    │
└──────────────────────────────┼────────────────────────────────────────┘
                               │ supabase-js (REST + Auth), JWT
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                               SUPABASE                                │
│   GoTrue (Auth)            PostgREST (REST/RPC)                        │
│        └──────────────┬──────────────┘                                │
│                       ▼                                                │
│                 PostgreSQL 15                                         │
│     Tablas · RLS por rol · Funciones fn_* · Triggers · Vistas         │
└─────────────────────────────────────────────────────────────────────┘
```

## 9. Descripción de los módulos del sistema

| Módulo | Frontend (páginas/componentes) | Lógica compartida | Backend (SQL) |
| --- | --- | --- | --- |
| Autenticación | `InicioSesion`, `PaginaCambiarContrasena`, `ContextoAuth`, `RutaProtegida` | `auth/sesion.js` | `fn_rol_actual`, `fn_crear_perfil`, hook de intentos, GoTrue |
| Usuarios | `PaginaUsuarios`, `ModalUsuario` | `usuarios/{api,permisos,validaciones}.js` | `fn_crear_usuario`, `fn_actualizar_usuario`, `fn_cambiar_estado_usuario`, `fn_resetear_contrasena` |
| Cuellos/puños | `PaginaInicio`, `PaginaFicha`, `PaginaFormulario`, `DisenadorCuello`, `EditorColores` | `cuellos/*` | `fn_buscar_cuellos`, `fn_guardar_cuello` |
| Colores | `PaginaColores`, `SelectorColor*` | `colores/*` | tabla `catalogo_colores` |
| Conos | `PaginaConos`, `PaginaFichaCono`, `PaginaFormularioCono`, `components/conos/*` | `conos/*` | `fn_guardar_cono`, `fn_aplicar_movimiento_cono`, triggers de stock |
| Diseños/precios | `PaginaDisenos` | `cuellos/*` | `cuellos.precio_base`, `v_stock_cuellos` |
| Ventas | `PaginaVentas`, `PaginaRegistrarVenta` | `ventas/*` | `fn_registrar_venta`, `fn_marcar_entrega`, vistas de estado |
| Producción | `PaginaProduccion` | — | `fn_registrar_produccion`, `fn_pendientes_produccion` |
| Estimador | `PaginaEstimador` | `estimador/*` | `fn_guardar_estimacion`, `v_costo_estimado_diseno` |
| Reportes | `PaginaDashboard`, `PaginaReportes`, `components/reportes/*` | `reportes/*` | `fn_dashboard`, `fn_reporte_*`, `fn_resumen_periodo`, `fn_actividad_reciente` |

Para la organización del código, ver [06 — Documentación del código fuente](06_codigo_fuente.md).
