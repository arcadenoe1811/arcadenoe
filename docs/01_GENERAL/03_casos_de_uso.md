# 03 — Especificación de casos de uso

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## Actores

| Actor                       | Descripción                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** (`admin`) | Usuario con acceso total: gestiona usuarios, precios, ventas, reportes y todo el catálogo.                                         |
| **Operador** (`operador`)   | Usuario operativo: registra conos, movimientos, ventas y producción; consulta cuellos. No gestiona usuarios ni ve ventas/reportes. |
| **Sistema / Base de datos** | Actor secundario: valida datos, calcula totales, aplica RLS y devuelve 403 cuando no hay permiso.                                  |

> El detalle de permisos por rol está en [`packages/shared/usuarios/permisos.js`](../../packages/shared/usuarios/permisos.js)
> y en el [manual de administrador](../03_MANUALES/09_manual_administrador.md).

## Listado de casos de uso

| Código | Caso de uso                                             | Actor principal    |
| ------ | ------------------------------------------------------- | ------------------ |
| CU-01  | Inicio de sesión                                        | Usuario registrado |
| CU-02  | Cambiar contraseña (primer ingreso / reseteo)           | Usuario registrado |
| CU-03  | Gestionar usuarios                                      | Administrador      |
| CU-04  | Buscar y consultar un cuello                            | Admin / Operador   |
| CU-05  | Crear o editar un cuello (con diseño de colores)        | Administrador      |
| CU-06  | Registrar un movimiento de cono (entrada/salida/ajuste) | Admin / Operador   |
| CU-07  | Registrar una venta                                     | Admin / Operador   |
| CU-08  | Registrar producción bajo pedido                        | Admin / Operador   |
| CU-09  | Calcular y guardar una estimación de costo              | Administrador      |
| CU-10  | Consultar reportes por período                          | Administrador      |

---

### CU-01: Inicio de sesión

| Elemento                | Descripción                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-01                                                                                                                                                                                                                                                                                     |
| **Actor**               | Usuario registrado                                                                                                                                                                                                                                                                        |
| **Descripción**         | El usuario accede al sistema con sus credenciales.                                                                                                                                                                                                                                        |
| **Precondiciones**      | Tener una cuenta activa (no deshabilitada ni bloqueada).                                                                                                                                                                                                                                  |
| **Entrada**             | Correo y contraseña.                                                                                                                                                                                                                                                                      |
| **Flujo principal**     | 1. El usuario abre `/login`. 2. Ingresa correo y contraseña. 3. El sistema valida las credenciales contra GoTrue. 4. Si el perfil está activo y no requiere cambio de contraseña, se crea la sesión y se redirige a su pantalla inicial (dashboard para admin, producción para operador). |
| **Flujos alternativos** | 3a. Si el usuario debe cambiar su contraseña, se redirige a `/cuenta/contrasena` (ver CU-02).                                                                                                                                                                                             |
| **Excepciones**         | Credenciales incorrectas → mensaje genérico de error. 5 fallos → cuenta bloqueada 15 min. Usuario deshabilitado → sin acceso.                                                                                                                                                             |
| **Postcondiciones**     | Sesión iniciada correctamente; token JWT (1 h) y refresh token almacenados por supabase-js.                                                                                                                                                                                               |

### CU-02: Cambiar contraseña

| Elemento                | Descripción                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-02                                                                                                                                                                                                                                                    |
| **Actor**               | Usuario registrado                                                                                                                                                                                                                                       |
| **Descripción**         | El usuario cambia su contraseña, obligatorio en el primer ingreso o tras un reseteo.                                                                                                                                                                     |
| **Precondiciones**      | Sesión iniciada.                                                                                                                                                                                                                                         |
| **Entrada**             | Contraseña actual y nueva (mín. 8 caracteres, con un número y una mayúscula).                                                                                                                                                                            |
| **Flujo principal**     | 1. El sistema detecta `debe_cambiar_contrasena = true` y redirige a `/cuenta/contrasena`. 2. El usuario ingresa la nueva contraseña. 3. La función `fn_cambiar_mi_contrasena` valida y actualiza. 4. Se levanta la marca y el usuario accede al sistema. |
| **Flujos alternativos** | El usuario cambia su contraseña voluntariamente desde su nombre → _Cambiar contraseña_.                                                                                                                                                                  |
| **Excepciones**         | Contraseña débil o que no cumple el formato → error de validación.                                                                                                                                                                                       |
| **Postcondiciones**     | Contraseña actualizada; `debe_cambiar_contrasena = false`.                                                                                                                                                                                               |

### CU-03: Gestionar usuarios

| Elemento                | Descripción                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-03                                                                                                                                                                                                                                         |
| **Actor**               | Administrador                                                                                                                                                                                                                                 |
| **Descripción**         | Crear, editar, habilitar/deshabilitar y resetear contraseña de usuarios.                                                                                                                                                                      |
| **Precondiciones**      | Sesión de administrador.                                                                                                                                                                                                                      |
| **Entrada**             | Datos del usuario (nombre, correo, rol) o acción sobre uno existente.                                                                                                                                                                         |
| **Flujo principal**     | 1. El admin abre `/usuarios`. 2. Crea un usuario (nombre, correo, rol) → `fn_crear_usuario` genera contraseña temporal. 3. O edita (`fn_actualizar_usuario`), deshabilita (`fn_cambiar_estado_usuario`) o resetea (`fn_resetear_contrasena`). |
| **Flujos alternativos** | Reactivar un usuario deshabilitado.                                                                                                                                                                                                           |
| **Excepciones**         | Deshabilitar/quitar admin al último admin → 403 (`fn_proteger_ultimo_admin`). Un operador que llame a la API → 403 (`fn_exigir_admin`).                                                                                                       |
| **Postcondiciones**     | Usuario creado/actualizado; si se deshabilita, sus sesiones se cierran.                                                                                                                                                                       |

### CU-04: Buscar y consultar un cuello

| Elemento                | Descripción                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-04                                                                                                                                                                                                                                 |
| **Actor**               | Administrador / Operador                                                                                                                                                                                                              |
| **Descripción**         | Buscar un cuello y ver su ficha técnica.                                                                                                                                                                                              |
| **Precondiciones**      | Sesión iniciada.                                                                                                                                                                                                                      |
| **Entrada**             | Término de búsqueda y/o filtros (tipo, medida).                                                                                                                                                                                       |
| **Flujo principal**     | 1. El usuario abre `/cuellos`. 2. Escribe un término; `fn_buscar_cuellos` devuelve coincidencias (sin acentos/mayúsculas). 3. Aplica filtros de tipo/medida. 4. Abre la ficha (`/cuellos/:id`) y ve datos técnicos, colores e imagen. |
| **Flujos alternativos** | Consultar un puño (`/punos/:id`), que usa la misma ficha.                                                                                                                                                                             |
| **Excepciones**         | Sin coincidencias → lista vacía.                                                                                                                                                                                                      |
| **Postcondiciones**     | El usuario visualiza la información del cuello.                                                                                                                                                                                       |

### CU-05: Crear o editar un cuello

| Elemento                | Descripción                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-05                                                                                                                                                                                              |
| **Actor**               | Administrador                                                                                                                                                                                      |
| **Descripción**         | Alta o edición de un cuello con su diseño de colores por zona.                                                                                                                                     |
| **Precondiciones**      | Sesión de administrador (permiso `cuellos.editar`).                                                                                                                                                |
| **Entrada**             | Código, tipo, hilos, posiciones, pasadas, medidas, notas, imagen y colores por zona.                                                                                                               |
| **Flujo principal**     | 1. El admin abre `/cuellos/nuevo` o `/cuellos/:id/editar`. 2. Completa los datos y diseña los colores. 3. `fn_guardar_cuello` crea/actualiza el cuello y reemplaza sus colores en una transacción. |
| **Flujos alternativos** | Dar de baja lógica (`activo = false`); vincular un puño (herencia).                                                                                                                                |
| **Excepciones**         | Código duplicado o datos fuera de rango → error de validación (en navegador y base). Operador → 403.                                                                                               |
| **Postcondiciones**     | Cuello y colores guardados; `updated_at` actualizado por trigger.                                                                                                                                  |

### CU-06: Registrar un movimiento de cono

| Elemento                | Descripción                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-06                                                                                                                                                                                                     |
| **Actor**               | Administrador / Operador                                                                                                                                                                                  |
| **Descripción**         | Registrar entrada, salida o ajuste de un cono; el stock se recalcula solo.                                                                                                                                |
| **Precondiciones**      | Sesión iniciada (permiso `conos.editar`); el cono existe.                                                                                                                                                 |
| **Entrada**             | Tipo de movimiento, cantidad, fecha, referencia y datos de entrada (lote, proveedor, costo) si aplica.                                                                                                    |
| **Flujo principal**     | 1. El usuario abre `/conos` y elige entrada/salida sobre un cono. 2. Ingresa la cantidad. 3. El trigger `fn_aplicar_movimiento_cono` actualiza `stock_actual` y guarda `stock_resultante` y `usuario_id`. |
| **Flujos alternativos** | Ajuste con signo para corregir el stock.                                                                                                                                                                  |
| **Excepciones**         | Salida mayor al stock o cantidad inválida → rechazo por `check`/trigger.                                                                                                                                  |
| **Postcondiciones**     | Movimiento registrado; stock y estado del cono actualizados.                                                                                                                                              |

### CU-07: Registrar una venta

| Elemento                | Descripción                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Código**              | CU-07                                                                                                                                                              |
| **Actor**               | Administrador / Operador                                                                                                                                           |
| **Descripción**         | Registrar una venta con líneas por diseño y talla.                                                                                                                 |
| **Precondiciones**      | Sesión iniciada (permiso `ventas.registrar`).                                                                                                                      |
| **Entrada**             | Cliente (opcional), método de pago, notas y líneas (diseño, talla, cantidad, precio).                                                                              |
| **Flujo principal**     | 1. El usuario abre `/ventas/nueva`. 2. Agrega líneas. 3. `fn_registrar_venta` valida cada dato, calcula los totales en la base y asigna `usuario_id` de la sesión. |
| **Flujos alternativos** | —                                                                                                                                                                  |
| **Excepciones**         | Datos fuera de rango → rechazo. El operador no puede ver el historial (`/ventas`) ni eliminar.                                                                     |
| **Postcondiciones**     | Venta registrada; totales calculados por la base; lo vendido queda _pendiente de producir_.                                                                        |

### CU-08: Registrar producción bajo pedido

| Elemento                | Descripción                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-08                                                                                                                                                                       |
| **Actor**               | Administrador / Operador                                                                                                                                                    |
| **Descripción**         | Registrar cuellos/puños producidos, que entran a la existencia.                                                                                                             |
| **Precondiciones**      | Sesión iniciada (permiso `produccion.registrar`).                                                                                                                           |
| **Entrada**             | Diseño, talla, cantidad, fecha y notas.                                                                                                                                     |
| **Flujo principal**     | 1. El usuario abre `/produccion` y ve lo pendiente de producir. 2. Registra la producción con `fn_registrar_produccion`. 3. La existencia (`v_stock_cuellos`) se actualiza. |
| **Flujos alternativos** | El admin puede eliminar una producción.                                                                                                                                     |
| **Excepciones**         | Cantidad fuera de rango → rechazo.                                                                                                                                          |
| **Postcondiciones**     | Producción registrada; existencia por diseño y talla actualizada.                                                                                                           |

### CU-09: Calcular y guardar una estimación de costo

| Elemento                | Descripción                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-09                                                                                                                                                               |
| **Actor**               | Administrador                                                                                                                                                       |
| **Descripción**         | Estimar el costo de un pedido (material + mano de obra) y guardarlo.                                                                                                |
| **Precondiciones**      | Sesión de administrador (permiso `estimador.usar`).                                                                                                                 |
| **Entrada**             | Líneas (diseño, talla, cantidad, conos/unidad, minutos/unidad), tarifa por hora y costo de cono.                                                                    |
| **Flujo principal**     | 1. El admin abre `/estimador`. 2. Agrega líneas; el sistema calcula material, mano de obra y total. 3. `fn_guardar_estimacion` persiste la estimación y sus líneas. |
| **Flujos alternativos** | Eliminar una estimación (solo admin).                                                                                                                               |
| **Excepciones**         | Valores negativos o fuera de rango → rechazo.                                                                                                                       |
| **Postcondiciones**     | Estimación guardada; alimenta el costo estimado por diseño de los reportes.                                                                                         |

### CU-10: Consultar reportes por período

| Elemento                | Descripción                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**              | CU-10                                                                                                                                                            |
| **Actor**               | Administrador                                                                                                                                                    |
| **Descripción**         | Ver cifras agregadas de inventario, producción, ventas y resumen por rango de fechas.                                                                            |
| **Precondiciones**      | Sesión de administrador (permiso `reportes.ver`).                                                                                                                |
| **Entrada**             | Rango de fechas / período.                                                                                                                                       |
| **Flujo principal**     | 1. El admin abre `/reportes`. 2. Elige el período. 3. Las funciones `fn_reporte_*` / `fn_resumen_periodo` devuelven cifras ya agregadas. 4. Exporta a CSV/Excel. |
| **Flujos alternativos** | Ver el dashboard (`/`) con indicadores (`fn_dashboard`).                                                                                                         |
| **Excepciones**         | Operador → 403 (no tiene `reportes.ver`).                                                                                                                        |
| **Postcondiciones**     | El admin visualiza y/o exporta los reportes.                                                                                                                     |

---

## Diagrama de casos de uso (textual)

```
            ┌─────────────────────────── Sistema ───────────────────────────┐
            │                                                                │
 Operador ──┤ CU-01 Login   CU-02 Cambiar contraseña                        │
            │ CU-04 Consultar cuello   CU-06 Movimiento de cono             │
            │ CU-07 Registrar venta    CU-08 Registrar producción           │
            │                                                                │
  Admin ────┤ (todo lo del operador) +                                       │
            │ CU-03 Gestionar usuarios  CU-05 Crear/editar cuello           │
            │ CU-09 Estimación de costo CU-10 Reportes                       │
            └────────────────────────────────────────────────────────────────┘
```
