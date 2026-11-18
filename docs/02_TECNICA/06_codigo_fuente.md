# 06 — Documentación del código fuente

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Estructura de carpetas (monorepo npm workspaces)

```
arcadenoe/
├── apps/
│   └── web/                    SPA de React + Vite (@inventario/web)
│       ├── index.html
│       ├── vite.config.js
│       ├── vitest.config.js
│       ├── Dockerfile
│       └── src/
│           ├── App.jsx         Rutas de la aplicación
│           ├── main.jsx        Punto de entrada (único console.log de arranque)
│           ├── theme.js        Breakpoints y lectura de tokens desde JS
│           ├── components/     Componentes de dominio + ui/ (base) + conos/ reportes/ ...
│           ├── contextos/      ContextoAuth (sesión global)
│           ├── hooks/          useAuth, useConsulta, useCuellos, useConos, useUsuarios...
│           ├── pages/          Una página por ruta (PaginaConos, PaginaVentas, ...)
│           ├── estilos/        variables.css, global.css, inventario.css, conos.css...
│           ├── utils/          descargar, rutas, sesionLocal, soloEnteros
│           └── pruebas/        setup.js (configuración de Vitest)
├── packages/
│   └── shared/                 Lógica sin React DOM (@inventario/shared)
│       ├── index.js
│       ├── api/                cliente.js (supabase-js), errores.js
│       ├── auth/               sesion.js
│       ├── usuarios/           api, permisos, validaciones
│       ├── cuellos/            api, validaciones, campos, columnas, filtros, diseno, herencia...
│       ├── colores/            api, validaciones
│       ├── conos/              api, constantes, familias, formato, inventario, validaciones
│       ├── ventas/             api, constantes, validaciones
│       ├── estimador/          api, calculos
│       ├── reportes/           api, exportar, periodos
│       ├── formato/            index.js (tipos, medidas, fechas, URLs de imagen)
│       └── tipos/              @typedef de cada tabla
├── supabase/
│   ├── migrations/             00001–00015 (SQL numerado)
│   ├── seed*.sql               Semillas (usuario admin, cuellos, conos, diseños de ejemplo)
│   ├── config.toml             Stack local de la CLI
│   └── docker/                 nginx.conf, roles.sql
├── scripts/                    verificar.sh, generar_seed_disenos.mjs
├── docker-compose.yml          Stack local completo (web + api + db)
├── package.json                Workspaces y scripts raíz
└── docs/                       Esta documentación
```

> La estructura **no** sigue el patrón `controllers/models/routes` clásico porque no hay
> servidor propio: la “capa de negocio” son las funciones SQL de `supabase/migrations/`.

## 2. Descripción de archivos principales

| Archivo                                                                                    | Responsabilidad                                                                    |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [`apps/web/src/App.jsx`](../../apps/web/src/App.jsx)                                       | Define todas las rutas y qué página se monta según permiso.                        |
| [`apps/web/src/main.jsx`](../../apps/web/src/main.jsx)                                     | Monta React, el router y el `ContextoAuth`; único `console.log` de arranque.       |
| [`apps/web/src/contextos/ContextoAuth.jsx`](../../apps/web/src/contextos/ContextoAuth.jsx) | Estado global de sesión; escucha `onAuthStateChange`; expone rol y `puede()`.      |
| [`packages/shared/api/cliente.js`](../../packages/shared/api/cliente.js)                   | Instancia única de supabase-js (URL + anon key, persistencia de sesión).           |
| [`packages/shared/api/errores.js`](../../packages/shared/api/errores.js)                   | `ErrorNormalizado` y `normalizarError` (mensajes genéricos, sin filtrar internos). |
| [`packages/shared/auth/sesion.js`](../../packages/shared/auth/sesion.js)                   | `iniciarSesion`, `cerrarSesion`, `obtenerSesion`, `validarInicioSesion`.           |
| [`packages/shared/usuarios/permisos.js`](../../packages/shared/usuarios/permisos.js)       | Tabla permiso→roles; debe coincidir con las políticas RLS.                         |

## 3. Funciones principales

- **`puede(rol, permiso)`** — decide qué muestra la UI; la autorización real está en la base.
- **`normalizarError(error)`** — convierte errores de supabase/PostgREST en mensajes de usuario.
- **Validaciones de `packages/shared/*/validaciones.js`** — reglas de dominio reutilizadas por el formulario y las pruebas (no viven en los componentes).
- **`exportar` de `reportes/exportar.js`** — genera CSV neutralizando inyección de fórmulas.

## 4. Componentes del frontend

- **Base (`components/ui/`):** `Boton`, `CampoTexto`, `CampoSugerencias`, `Tarjeta`, `Modal`, `Spinner`, `MensajeError`.
- **Dominio:** `DisenadorCuello`, `EditorColores`, `SelectorTallas`, `SelectorMedidas`, `TarjetaCuello`, `FiltrosCuellos`, `BuscadorPieza`.
- **Conos (`components/conos/`):** `TarjetaCono`, `MuestraCono`, `ModalMovimiento`, `ModalProveedor`, `ListaMovimientos`, `NavegacionFamilias`, `TarjetaKpi`.
- **Reportes/gráficos:** `components/reportes/*`, `components/graficos/*`.
- **Estructura:** `LayoutPrincipal` (navegación + outlet) y `RutaProtegida` (gate por sesión/permiso).

## 5. Lógica de negocio (en lugar de controladores)

No hay controladores de backend. El equivalente son:

- **Funciones RPC SQL** (`fn_registrar_venta`, `fn_guardar_cono`, `fn_guardar_cuello`, `fn_registrar_produccion`, `fn_guardar_estimacion`, `fn_*_usuario`…): validan, calculan totales y escriben.
- **Triggers** (`fn_aplicar_movimiento_cono`, `fn_proteger_stock_cono`, `fn_actualizar_updated_at`, `fn_proteger_ultimo_admin`…): protegen invariantes.
- **Políticas RLS**: autorizan cada operación por rol.

## 6. Servicios (capa `packages/shared/*/api.js`)

Cada módulo expone un `api.js` que envuelve las llamadas a supabase-js (SELECT o RPC) y
devuelve datos ya tipados: `cuellos/api.js`, `conos/api.js`, `ventas/api.js`,
`estimador/api.js`, `reportes/api.js`, `usuarios/api.js`, `colores/api.js`. Esta es la
frontera entre React y la plataforma; los componentes **no** llaman a supabase-js
directamente.

## 7. Modelos (tipos de datos)

Los modelos son `@typedef` JSDoc en [`packages/shared/tipos/index.js`](../../packages/shared/tipos/index.js),
uno por tabla. No hay ORM: las tablas y vistas de PostgreSQL son el modelo físico (ver
[diccionario de datos](05_diccionario_datos.md)).

## 8. Middleware / guards

- **`RutaProtegida`** ([`apps/web/src/components/RutaProtegida.jsx`](../../apps/web/src/components/RutaProtegida.jsx)): exige sesión y, opcionalmente, un permiso; redirige a `/login` o a cambio de contraseña.
- **RLS + funciones `SECURITY DEFINER`**: el “middleware” de autorización real, en la base.

## 9. Rutas y endpoints

- **Rutas de la SPA:** ver [`App.jsx`](../../apps/web/src/App.jsx) y el resumen en [arquitectura](04_arquitectura.md).
- **Endpoints de datos:** ver [07 — Documentación de API](07_api.md).

## 10. Dependencias utilizadas

| Paquete                         | Uso                               |
| ------------------------------- | --------------------------------- |
| `react`, `react-dom` (18.3)     | UI.                               |
| `react-router-dom` (6.28)       | Enrutado SPA.                     |
| `@supabase/supabase-js` (2.45+) | Cliente de datos y autenticación. |
| `vite` (6)                      | Dev server y build.               |
| `vitest` (4) + Testing Library  | Pruebas.                          |
| `eslint` (9), `prettier` (3)    | Calidad y formato.                |
| `supabase` (CLI, 2)             | Stack local y migraciones.        |

## 11. Reglas del código (convenciones)

- JavaScript con JSDoc, **sin TypeScript**. Nombres en **español**.
- Un único `console.log` (arranque en `main.jsx`); los errores se normalizan.
- `packages/shared` **no** importa React DOM.
- Las **validaciones** viven en `packages/shared`, no en los componentes.
- **CSS puro**, _mobile-first_ (`min-width` 640/1024 px), con tokens de `estilos/variables.css`; toques ≥ 44px y entradas de 16px en móvil.
- Calidad verificable con `npm run ci` (lint + formato + build + pruebas).
