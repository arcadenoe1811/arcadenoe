# 07 — Documentación de API

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Modelo de API

El sistema **no tiene una API REST propia escrita a mano**. La API es la que expone
**PostgREST** sobre la base de datos PostgreSQL de Supabase, más **GoTrue** para
autenticación. El frontend la consume mediante `@supabase/supabase-js`, nunca con
`fetch` manual.

- **Base URL (local):** `http://localhost:54321`
  - `/rest/v1/...` → datos (PostgREST).
  - `/auth/v1/...` → autenticación (GoTrue).
- **Base URL (producción, Supabase Cloud):** `https://<ref>.supabase.co`.
- **Autenticación:** cabeceras `apikey: <anon key>` y `Authorization: Bearer <JWT>`.
- **Autorización:** RLS por rol; una operación sin permiso devuelve **403**.

Hay dos tipos de operación:

1. **Lectura directa de tablas/vistas** (`GET /rest/v1/<tabla>?...`): filtrada por RLS.
2. **RPC a funciones SQL** (`POST /rest/v1/rpc/<funcion>`): para toda escritura sensible
   (validan datos, calculan totales y asignan el autor). Las escrituras directas a
   `ventas`, `producciones`, `estimaciones`, etc. **están revocadas**.

Los códigos de respuesta comunes: **200** OK · **201** creado · **204** sin contenido ·
**400** datos inválidos · **401** no autenticado · **403** sin permiso (RLS) ·
**409** conflicto (ej. código duplicado) · **500** error interno.

---

## 2. Autenticación (GoTrue)

### Iniciar sesión

- **Método / URL:** `POST /auth/v1/token?grant_type=password`
- **Descripción:** autentica con correo y contraseña.
- **Autenticación:** no (es el login); requiere `apikey`.
- **Entrada:** `{ "email": "...", "password": "..." }`
- **Respuesta:** `{ "access_token", "refresh_token", "expires_in", "user" }`
- **Errores:** 400 credenciales inválidas; cuenta bloqueada tras 5 fallos (15 min).
- **En el código:** `iniciarSesion()` en `packages/shared/auth/sesion.js`.

### Refrescar token / cerrar sesión

- `POST /auth/v1/token?grant_type=refresh_token` — rota el refresh token.
- `POST /auth/v1/logout` — revoca los tokens (lo llama `cerrarSesion`).

---

## 3. Endpoints de lectura (PostgREST)

### Listar / filtrar cuellos

- **Método / URL:** `GET /rest/v1/cuellos?select=*&activo=eq.true`
- **Descripción:** lista cuellos activos; admite filtros de PostgREST (`tipo=eq.`, etc.).
- **Autenticación:** requerida. **Permiso:** `cuellos.ver` (admin y operador).
- **Respuesta (200):**
  ```json
  [{ "id": "…", "codigo": "maza4", "tipo": "tubular", "medidas": [18,17,16] }]
  ```

### Buscar cuellos (RPC)

- **Método / URL:** `POST /rest/v1/rpc/fn_buscar_cuellos`
- **Descripción:** búsqueda por código/nombre/notas/colores sin acentos ni mayúsculas.
- **Entrada:** `{ "termino": "maz" }`
- **Respuesta:** lista de cuellos ordenada por relevancia (exacto → prefijo → resto).

### Inventario de conos

- `GET /rest/v1/conos?select=*&activo=eq.true` — lista de conos con `estado` y `valor_stock`.
- `GET /rest/v1/movimientos_cono?cono_id=eq.<id>&order=created_at.desc` — historial de un cono.
- **Permiso:** `conos.ver`.

### Reportes y dashboard (RPC)

- `POST /rest/v1/rpc/fn_dashboard` — indicadores del dashboard.
- `POST /rest/v1/rpc/fn_reporte_inventario|produccion|ventas` — reportes por período.
- `POST /rest/v1/rpc/fn_resumen_periodo` — resumen agregado.
- **Permiso:** `reportes.ver` / `dashboard.ver` (solo admin). Las cifras vienen ya
  agregadas (la API entrega ≤ 1000 filas, por eso no se suma en el navegador).

---

## 4. Endpoints de escritura (RPC)

### Guardar cono

- **Método / URL:** `POST /rest/v1/rpc/fn_guardar_cono`
- **Descripción:** crea o actualiza un cono (el stock no se escribe aquí).
- **Permiso:** `conos.editar`.
- **Entrada:** `{ "p_cono": { "codigo": "CON-0001", "nombre_color": "Rojo", "hex": "#ff0000", "material": "algodon", "familia_color": "rojos" } }`

### Registrar movimiento de cono

- Se registra insertando en `movimientos_cono`; el trigger `fn_aplicar_movimiento_cono`
  actualiza `stock_actual` y calcula `stock_resultante`.
- **Entrada típica (entrada):** `{ "cono_id": "…", "tipo": "entrada", "cantidad": 10, "proveedor": "…", "costo_unitario": 1.50 }`
- **Validación:** salida/ajuste no pueden dejar stock negativo; cantidad 1–99999.

### Guardar cuello (con colores)

- **Método / URL:** `POST /rest/v1/rpc/fn_guardar_cuello`
- **Descripción:** crea/actualiza el cuello y reemplaza sus colores en una transacción.
- **Permiso:** `cuellos.editar` (solo admin).
- **Entrada:** `{ "p_cuello": { "codigo": "maza4", "tipo": "tubular", ... }, "p_colores": [ { "zona": "cuerpo", "color": "rojo", "orden": 1 } ] }`

### Registrar venta

- **Método / URL:** `POST /rest/v1/rpc/fn_registrar_venta`
- **Descripción:** registra la venta y sus líneas; **calcula los totales en la base** y asigna `usuario_id` de la sesión.
- **Permiso:** `ventas.registrar`.
- **Entrada:**
  ```json
  {
    "p_venta": { "cliente": "Ana", "metodo_pago": "efectivo" },
    "p_lineas": [ { "diseno_codigo": "maza4", "talla": "16", "cantidad": 3, "precio_unitario": 50.00 } ]
  }
  ```
- **Respuesta:** la venta creada con su `total` y `total_unidades`.

### Otras funciones de escritura

| Función RPC | Descripción | Permiso |
| --- | --- | --- |
| `fn_registrar_produccion` | Registra producción bajo pedido. | `produccion.registrar` |
| `fn_guardar_estimacion` | Guarda una estimación de costo. | `estimador.usar` |
| `fn_marcar_entrega` | Marca entrega de líneas de venta. | `ventas.*` |
| `fn_crear_usuario` | Crea usuario con contraseña temporal. | `usuarios.gestionar` (admin) |
| `fn_actualizar_usuario` | Edita nombre/rol de un usuario. | admin |
| `fn_cambiar_estado_usuario` | Habilita/deshabilita un usuario. | admin |
| `fn_resetear_contrasena` | Resetea la contraseña de un usuario. | admin |
| `fn_cambiar_mi_contrasena` | Cambia la contraseña propia. | usuario autenticado |

---

## 5. Ejemplo completo (formato del documento base)

**Endpoint:** Consultar usuarios
`POST /rest/v1/rpc/fn_listar_usuarios`

**Descripción:** Obtiene el listado de usuarios registrados con su rol y estado.

**Autenticación:** Requerida.
**Permiso:** Administrador (`usuarios.gestionar`).

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": [
    { "id": "0000…0001", "nombre": "Administrador", "rol": "admin", "activo": true }
  ]
}
```
> En la práctica PostgREST devuelve el array de filas directamente; el envoltorio
> `success/data` se arma en la capa `packages/shared/usuarios/api.js`.

**Códigos de respuesta:**
- **200** — Solicitud exitosa.
- **401** — No autenticado.
- **403** — Sin permisos (un operador recibe 403 por RLS).
- **500** — Error interno.

---

## 6. Manejo de errores

Todas las respuestas de error se procesan con `normalizarError`
([`packages/shared/api/errores.js`](../../packages/shared/api/errores.js)), que las
convierte en un `ErrorNormalizado` con mensaje de usuario y **sin** filtrar detalles
internos de la base. El campo crudo `detalle` existe pero no se renderiza en la UI.
