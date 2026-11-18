# 05 — Diccionario de datos y Diagrama Entidad-Relación

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Base de datos:** PostgreSQL 15 (Supabase) — esquema `public`
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> Fuente: migraciones `supabase/migrations/00001`–`00015`. Los tipos y longitudes son los
> definidos en el DDL real. Convenciones: **PK** clave primaria, **FK** clave foránea,
> _generated_ columna calculada por la base.

---

## Tipos enumerados

| Enum                   | Valores                               |
| ---------------------- | ------------------------------------- |
| `tipo_cuello`          | `liso`, `tubular`, `gaspeado`, `otro` |
| `zona_color`           | `tubular`, `cuerpo`, `borde`, `otro`  |
| `tipo_movimiento_cono` | `entrada`, `salida`, `ajuste`         |

---

## Tabla `cuellos`

Cuellos (y puños) tejidos en la máquina. Código único en minúsculas.

| Campo              | Tipo        | PK/FK | Restricciones               | Descripción                                          |
| ------------------ | ----------- | ----- | --------------------------- | ---------------------------------------------------- |
| `id`               | uuid        | PK    | default `gen_random_uuid()` | Identificador.                                       |
| `codigo`           | text        |       | único, minúsculas, 1–40     | Código interno (ej. `maza4`).                        |
| `nombre`           | text        |       | opcional                    | Nombre descriptivo.                                  |
| `tipo`             | tipo_cuello |       | not null                    | Tipo de tejido.                                      |
| `cantidad_hilos`   | smallint    |       | 1–99                        | Cantidad de hilos.                                   |
| `posicion_cuerpo`  | smallint    |       | 0–999                       | Posición del cuerpo.                                 |
| `posicion_tubular` | smallint    |       | 0–999                       | Posición del tubular.                                |
| `pasadas_tubular`  | smallint    |       | 0–999                       | Pasadas del tubular.                                 |
| `medidas`          | smallint[]  |       | sin nulos                   | Medidas/tallas compatibles (ej. `{18,17,16,15,14}`). |
| `notas`            | text        |       | opcional                    | Notas.                                               |
| `imagen_url`       | text        |       | `^https?://`                | URL externa de imagen.                               |
| `activo`           | boolean     |       | default `true`              | Baja lógica.                                         |
| `created_at`       | timestamptz |       | default `now()`             | Alta.                                                |
| `updated_at`       | timestamptz |       | trigger                     | Última modificación.                                 |

## Tabla `colores_cuello`

Colores por zona de cada cuello. Se borran en cascada con el cuello.

| Campo            | Tipo       | PK/FK             | Restricciones     | Descripción              |
| ---------------- | ---------- | ----------------- | ----------------- | ------------------------ |
| `id`             | uuid       | PK                |                   | Identificador.           |
| `cuello_id`      | uuid       | FK → `cuellos.id` | on delete cascade | Cuello al que pertenece. |
| `zona`           | zona_color |                   | not null          | Zona del color.          |
| `color`          | text       |                   | no vacío          | Nombre del color.        |
| `cantidad_hilos` | smallint   |                   | 1–99              | Hilos de ese color.      |
| `orden`          | smallint   |                   | 0–999             | Orden de presentación.   |

## Tabla `catalogo_colores`

Nombres de colores normalizados para autocompletar el diseñador.

| Campo    | Tipo | PK/FK | Restricciones               | Descripción                   |
| -------- | ---- | ----- | --------------------------- | ----------------------------- |
| `id`     | uuid | PK    |                             | Identificador.                |
| `nombre` | text |       | único, minúsculas, no vacío | Nombre del color.             |
| `hex`    | text |       | `^#[0-9a-fA-F]{6}$`         | Color hexadecimal (opcional). |

## Tabla `tipos_cuello`

Catálogo de tipos de cuello extensible (migración `00003`).

| Campo | Tipo | PK/FK | Descripción                                        |
| ----- | ---- | ----- | -------------------------------------------------- |
| `id`  | uuid | PK    | Identificador.                                     |
| ...   |      |       | Nombre/clave del tipo y metadatos de presentación. |

## Tabla `conos`

Tipos de cono de hilo en inventario. Código único en mayúsculas.

| Campo               | Tipo          | PK/FK                      | Restricciones           | Descripción                                             |
| ------------------- | ------------- | -------------------------- | ----------------------- | ------------------------------------------------------- |
| `id`                | uuid          | PK                         |                         | Identificador.                                          |
| `codigo`            | text          |                            | único, mayúsculas, 1–20 | Código del cono (ej. `CON-0001`).                       |
| `nombre_color`      | text          |                            | 1–60                    | Nombre del color.                                       |
| `hex`               | text          |                            | `^#[0-9a-f]{6}$`        | Color hexadecimal.                                      |
| `color_catalogo_id` | uuid          | FK → `catalogo_colores.id` | on delete set null      | Color del catálogo del diseñador.                       |
| `codigo_color`      | text          |                            | 1–20                    | Número de color (coincide con `colores_cuello.codigo`). |
| `familia_color`     | text          |                            | lista fija              | `rojos`, `naranjas`, … `neutros`, `metalicos`.          |
| `material`          | text          |                            | minúsculas, 1–40        | Material del hilo.                                      |
| `titulo_hilo`       | text          |                            | 1–20                    | Título (grosor) del hilo.                               |
| `proveedor`         | text          |                            | 1–80                    | Proveedor.                                              |
| `peso_por_cono_g`   | numeric(8,1)  |                            | 1–99999                 | Peso de hilo por cono (gramos).                         |
| `costo_por_cono`    | numeric(12,2) |                            | 0–9999999               | Costo por cono.                                         |
| `costo_por_kilo`    | numeric(12,2) |                            | _generated_             | Costo por kilo calculado.                               |
| `stock_actual`      | integer       |                            | ≥ 0, default 0          | Conos disponibles (solo lo cambian los movimientos).    |
| `stock_minimo`      | integer       |                            | 0–99999                 | Umbral de stock bajo.                                   |
| `estado`            | text          |                            | _generated_             | `disponible` / `bajo` / `agotado`.                      |
| `valor_stock`       | numeric(14,2) |                            | _generated_             | `stock_actual * costo_por_cono`.                        |
| `imagen_url`        | text          |                            | `^https?://`            | URL externa de imagen.                                  |
| `notas`             | text          |                            | ≤ 2000                  | Notas.                                                  |
| `activo`            | boolean       |                            | default `true`          | Baja lógica.                                            |
| `created_at`        | timestamptz   |                            | default `now()`         | Alta.                                                   |
| `updated_at`        | timestamptz   |                            | trigger                 | Última modificación.                                    |

## Tabla `movimientos_cono`

Historial de entradas, salidas y ajustes de conos.

| Campo              | Tipo                 | PK/FK                | Restricciones                   | Descripción                                        |
| ------------------ | -------------------- | -------------------- | ------------------------------- | -------------------------------------------------- |
| `id`               | uuid                 | PK                   |                                 | Identificador.                                     |
| `cono_id`          | uuid                 | FK → `conos.id`      | on delete restrict              | Cono afectado.                                     |
| `tipo`             | tipo_movimiento_cono |                      | not null                        | entrada / salida / ajuste.                         |
| `cantidad`         | integer              |                      | ≠ 0, −99999…99999               | Positiva para entrada/salida; con signo en ajuste. |
| `fecha`            | date                 |                      | default `current_date`          | Fecha del movimiento.                              |
| `referencia`       | text                 |                      | ≤ 120                           | Referencia libre.                                  |
| `pieza_id`         | uuid                 | FK → `cuellos.id`    | on delete set null; solo salida | Pieza asociada (si es salida).                     |
| `lote`             | text                 |                      | ≤ 60; solo entrada              | Lote (entradas).                                   |
| `proveedor`        | text                 |                      | ≤ 80; solo entrada              | Proveedor (entradas).                              |
| `costo_unitario`   | numeric(12,2)        |                      | 0–9999999; solo entrada         | Costo unitario (entradas).                         |
| `stock_resultante` | integer              |                      |                                 | Stock tras el movimiento.                          |
| `notas`            | text                 |                      |                                 | Notas.                                             |
| `usuario_id`       | uuid                 | FK → `auth.users.id` | default `auth.uid()`            | Autor (de la sesión).                              |
| `created_at`       | timestamptz          |                      | default `now()`                 | Registro.                                          |

## Tabla `perfiles`

Rol y estado de cada usuario de `auth.users`.

| Campo                     | Tipo        | PK/FK                    | Restricciones        | Descripción                           |
| ------------------------- | ----------- | ------------------------ | -------------------- | ------------------------------------- |
| `id`                      | uuid        | PK, FK → `auth.users.id` | on delete cascade    | Usuario.                              |
| `nombre`                  | text        |                          | 1–80                 | Nombre.                               |
| `rol`                     | text        |                          | `admin` / `operador` | Rol.                                  |
| `activo`                  | boolean     |                          | default `true`       | `false` = deshabilitado (sin acceso). |
| `debe_cambiar_contrasena` | boolean     |                          | default `false`      | `true` = contraseña temporal.         |
| `created_at`              | timestamptz |                          | default `now()`      | Alta.                                 |
| `updated_at`              | timestamptz |                          | trigger              | Última modificación.                  |

## Tabla `intentos_acceso`

Contador de contraseñas incorrectas por usuario (bloqueo temporal).

| Campo             | Tipo        | PK/FK                    | Descripción                  |
| ----------------- | ----------- | ------------------------ | ---------------------------- |
| `usuario_id`      | uuid        | PK, FK → `auth.users.id` | Usuario.                     |
| `fallidos`        | integer     |                          | Intentos fallidos.           |
| `ultimo_fallo`    | timestamptz |                          | Último fallo.                |
| `bloqueado_hasta` | timestamptz |                          | Fin del bloqueo (si lo hay). |

## Tabla `configuracion`

Ajustes del negocio (una sola fila).

| Campo         | Tipo          | PK/FK | Restricciones               | Descripción                        |
| ------------- | ------------- | ----- | --------------------------- | ---------------------------------- |
| `id`          | boolean       | PK    | siempre `true` (fila única) | Garantiza fila única.              |
| `tarifa_hora` | numeric(12,2) |       | 0–99999                     | Mano de obra por hora (estimador). |
| `updated_at`  | timestamptz   |       | trigger                     | Última modificación.               |

## Tabla `estimaciones` y `estimacion_lineas`

Cálculos guardados del estimador (solo estimados).

**`estimaciones`**: `id` (PK), `fecha`, `nombre`, `notas`, `tarifa_hora`, `costo_cono`,
`total_unidades`, `total_conos`, `total_minutos`, `costo_material`, `costo_mano_obra`,
`costo_total`, `usuario_id` (FK → `auth.users`), `created_at`.

**`estimacion_lineas`**: `id` (PK), `estimacion_id` (FK → `estimaciones`, cascade),
`cuello_id` (FK → `cuellos`, set null), `diseno_codigo`, `pieza`, `talla`, `cantidad`,
`conos_por_unidad`, `minutos_por_unidad`, `orden`.

## Tabla `producciones`

Cuellos y puños terminados (entran a la existencia).

| Campo           | Tipo        | PK/FK                | Restricciones          | Descripción                    |
| --------------- | ----------- | -------------------- | ---------------------- | ------------------------------ |
| `id`            | uuid        | PK                   |                        | Identificador.                 |
| `fecha`         | date        |                      | default `current_date` | Fecha de producción.           |
| `cuello_id`     | uuid        | FK → `cuellos.id`    | on delete set null     | Diseño producido.              |
| `diseno_codigo` | text        |                      | not null               | Código del diseño (histórico). |
| `pieza`         | text        |                      | default `cuello`       | `cuello` o `puno`.             |
| `talla`         | text        |                      | 1–12                   | Talla producida.               |
| `cantidad`      | integer     |                      | 1–99999                | Unidades producidas.           |
| `notas`         | text        |                      | ≤ 1000                 | Notas.                         |
| `usuario_id`    | uuid        | FK → `auth.users.id` | set null               | Autor.                         |
| `created_at`    | timestamptz |                      | default `now()`        | Registro.                      |

## Tabla `ventas` y `venta_lineas`

**`ventas`**: `id` (PK), `fecha`, `cliente` (1–120), `metodo_pago`
(`efectivo`/`transferencia`/`otro`), `notas` (≤1000), `total_unidades`, `total`,
`usuario_id` (FK → `auth.users`), `created_at`.

**`venta_lineas`**: `id` (PK), `venta_id` (FK → `ventas`, cascade), `cuello_id`
(FK → `cuellos`, set null), `diseno_codigo`, `pieza`, `talla` (1–12), `cantidad`
(1–99999), `precio_unitario` (0–9999999), `subtotal` (_generated_ = cantidad ×
precio_unitario), `orden`.

> `precio_unitario` guarda el precio cobrado **en esa venta**: cambiar el precio base del
> diseño no altera las ventas pasadas.

## Vistas principales

| Vista                     | Propósito                                                                    |
| ------------------------- | ---------------------------------------------------------------------------- |
| `v_stock_cuellos`         | Existencia por diseño y talla: producido, vendido y disponible.              |
| `v_costo_estimado_diseno` | Costo unitario estimado por diseño (promedio ponderado de las estimaciones). |
| `v_estado_ventas`         | Estado de cada venta/línea (asignada, entregada, pendiente).                 |
| `v_lineas_asignadas`      | Líneas de venta asignadas a producción.                                      |

---

## Diagrama Entidad-Relación (DER)

```
                 auth.users
                     │ 1
         ┌───────────┼───────────────┬───────────────┬───────────────┐
         │1:1        │               │               │               │
      perfiles   intentos_acceso  movimientos_cono  ventas       producciones
                                      │ N            │ 1              estimaciones
                                      │              │ N
   catalogo_colores                   │          venta_lineas       estimacion_lineas
         │ 1                          │              │                   │
         │ N (color_catalogo_id)      │              └──┐                │
       conos ◄───────────────────────┘ (cono_id)       │ (cuello_id)    │ (cuello_id)
         ▲                                              ▼                ▼
         │ (pieza_id, solo salida)                   cuellos ──1:N──► colores_cuello
         └──────────────────────────────────────────────┘

        configuracion (fila única)        tipos_cuello (catálogo)
```

**Relaciones clave:**

- `cuellos` 1—N `colores_cuello` (cascade).
- `conos` 1—N `movimientos_cono` (restrict: no se borra un cono con movimientos).
- `conos` N—1 `catalogo_colores` (set null).
- `ventas` 1—N `venta_lineas` · `estimaciones` 1—N `estimacion_lineas` (cascade).
- `venta_lineas`, `producciones`, `estimacion_lineas`, `movimientos_cono.pieza_id` → `cuellos` (set null).
- `perfiles`, `intentos_acceso` 1—1 `auth.users` (cascade).
- `usuario_id` de ventas/producciones/estimaciones/movimientos → `auth.users` (set null).
