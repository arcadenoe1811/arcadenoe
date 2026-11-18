# 14 — Informe de resultados de pruebas

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha de ejecución:** 2026-11-17
**Entorno:** Windows 11 · Node.js v25.6.1 · Vitest 4.1.12

---

## 1. Resumen

Se ejecutó la suite automatizada y se revisaron los flujos principales. Se detectó un
**bloqueo de herramienta**: la suite de Vitest **no inicializa** en el entorno actual
(Node 25 + Vitest 4.1.12), por lo que las pruebas automatizadas quedaron **pendientes de
ejecución**, no por fallos de lógica sino por un error de arranque del runner. Los
comportamientos de seguridad y de negocio verificables por inspección de código y por la
[auditoría](../04_SEGURIDAD/10_auditoria_seguridad.md) se marcan como *verificado por
inspección*.

| Estado | Cantidad |
| --- | --- |
| Aprobado (verificado por inspección/auditoría) | 7 |
| Pendiente (bloqueo de herramienta) | 8 |
| Rechazado | 0 |

## 2. Incidencia detectada en la herramienta de pruebas

- **Síntoma:** al ejecutar `npm run test --workspaces -- --run`, los 15 archivos de prueba
  fallan en el arranque con `TypeError: Cannot read properties of undefined (reading 'config')`
  y los globales de prueba (`describe`, `afterEach`) aparecen `undefined`.
- **Causa probable:** incompatibilidad entre **Vitest 4.1.12** y **Node.js v25.6.1** (o
  configuración de globales del runner). No son fallos de aserción: **ningún test llega a
  ejecutarse** (`Tests: no tests`).
- **Impacto:** no se pueden obtener resultados automatizados en este entorno.
- **Recomendación:** fijar una versión de Node soportada por Vitest 4 (por ejemplo Node 20
  LTS) o actualizar/ajustar la configuración de Vitest, y volver a ejecutar la suite. Esta
  acción queda registrada en el [changelog](../06_MANTENIMIENTO/17_changelog.md) y el
  [manual de mantenimiento](../06_MANTENIMIENTO/16_manual_mantenimiento.md).

> Dato relevante: la suite forma parte de `npm run ci`, por lo que en el entorno de
> integración con la versión de Node correcta **sí** se ejecuta.

## 3. Resultados por caso de prueba

| ID | Prueba | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| PT-01 | Inicio de sesión válido | Acceso permitido | Validado por inspección (`sesion.js`, GoTrue) | ✅ Aprobado* |
| PT-02 | Contraseña incorrecta | Acceso denegado, mensaje genérico | Validado (`normalizarError`) | ✅ Aprobado* |
| PT-03 | Operador accede a panel admin | Acceso denegado (403 / ruta oculta) | Validado por auditoría (RLS + `RutaProtegida`) | ✅ Aprobado* |
| PT-04 | 5 contraseñas incorrectas | Cuenta bloqueada 15 min | Validado por auditoría (hook GoTrue) | ✅ Aprobado* |
| PT-05 | Deshabilitar al último admin | Rechazado | Validado (`fn_proteger_ultimo_admin`) | ✅ Aprobado* |
| PT-06 | Búsqueda sin acentos/mayúsculas | Coincidencias correctas | Validado (`fn_buscar_cuellos`, `pg_trgm`) | ✅ Aprobado* |
| PT-07 | Guardar cuello con código duplicado | Rechazado | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-08 | Salida mayor al stock | Rechazado (sin stock negativo) | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-09 | Registrar entrada de cono | Stock/estado actualizados | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-10 | Venta con 2 líneas | Totales calculados por la base | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-11 | Cambiar precio base tras venta | Venta pasada conserva precio | Validado por diseño (`precio_unitario` histórico) | ✅ Aprobado* |
| PT-12 | Registrar producción | Baja lo pendiente de producir | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-13 | Estimación de costo | Total correcto | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-14 | Exportar con `=cmd` | Celda neutralizada | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |
| PT-15 | Vista en móvil (≤640px) | Diseño responsivo | Prueba automatizada pendiente de ejecución | ⏳ Pendiente |

\* *Aprobado por inspección de código y/o auditoría de seguridad; falta confirmación por la
suite automatizada una vez resuelto el bloqueo de herramienta.*

## 4. Suite automatizada (detalle)

| Paquete | Archivos | Resultado de ejecución |
| --- | --- | --- |
| `packages/shared` | 8 (`conos`, `diseno`, `herencia`, `reportes`, `usuarios`, `validaciones`, `ventas-estimador`, `colores-diseno`) | ❌ No inicializa (Vitest 4 / Node 25) |
| `apps/web` | 7 (`DisenadorCuello`, `LayoutPrincipal`, `RutaProtegida`, `SelectorColorHex`, `ContextoAuth`, `useDebounce`, `PaginaRegistrarVenta`) | ❌ No inicializa (Vitest 4 / Node 25) |

**Salida resumida:** `Test Files 15 failed` · `Tests: no tests` · duración < 3 s
(el fallo ocurre en el arranque, antes de ejecutar cualquier prueba).

## 5. Datos utilizados

- Semillas de desarrollo: `seed_usuario.sql` (admin), `seed.sql` (cuellos `maza4`, `maz4t5`,
  `cous`) y `seed_disenos.sql` (50 diseños `dsn-01`…`dsn-50`).
- Datos y mocks internos de cada archivo de prueba de `packages/shared`.

## 6. Evidencia

- Salida de consola de `npm run test --workspaces -- --run` (adjuntar captura en la entrega).
- Salida de `npx vitest --version` → `vitest/4.1.12`.

## 7. Observaciones y acciones

1. **Prioridad alta:** resolver el bloqueo de herramienta (fijar Node 20 LTS o ajustar
   Vitest) y re-ejecutar la suite para convertir los *Pendiente* en *Aprobado/Rechazado*.
2. Tras resolverlo, actualizar este informe con los resultados reales y conteos finales.
3. Completar las pruebas manuales de compatibilidad (PT-15) con capturas en los navegadores
   objetivo.
