# 16 — Manual de mantenimiento

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Actualización de dependencias

- Revisar vulnerabilidades: `npm audit`.
- Aplicar parches no disruptivos: `npm audit fix`.
- Actualizaciones mayores (ej. `react-router-dom`): en rama aparte, probar enrutado y `RutaProtegida`, luego integrar.
- Mantener `package-lock.json` versionado para builds reproducibles.

## 2. Corrección de errores

- Reproducir el error en el entorno local (Docker o CLI).
- Localizar el módulo (ver [documentación del código](../02_TECNICA/06_codigo_fuente.md)).
- Recordar que las **validaciones** van en `packages/shared` y la **autorización** en la base.
- Verificar con la suite de pruebas antes de integrar (ver nota de herramienta abajo).

## 3. Mantenimiento de la base de datos

- Toda modificación de esquema se hace con una **migración nueva** numerada (`00016_...`), nunca editando una migración ya aplicada.
- Al añadir una tabla o función, **definir su RLS** y mantener sincronizada la tabla de permisos de la UI (`packages/shared/usuarios/permisos.js`).
- Revisar índices si una consulta se vuelve lenta (el patrón es `pg_trgm` para búsquedas).

## 4. Revisión de registros (logs)

- **Docker:** `npm run docker:logs` (logs en vivo de web, API y BD).
- **Supabase Cloud:** panel → Logs (API, Auth, Postgres).
- Revisar `intentos_acceso` ante sospecha de ataques de fuerza bruta.

## 5. Actualizaciones de seguridad

- Seguir el [plan de remediación](../../recomendacion.md) y las [políticas de seguridad](../04_SEGURIDAD/11_politicas_seguridad.md).
- Rotar claves en Supabase (Settings → API) si alguna se expuso.
- Mantener HTTPS y las cabeceras/CSP en el host del frontend.

## 6. Respaldos

- Ver el [plan de respaldo y recuperación](../04_SEGURIDAD/12_respaldo_recuperacion.md).
- Verificar que los respaldos automáticos (cloud) o programados (local) se completan.

## 7. Monitoreo

- Revisar periódicamente el dashboard y los reportes para detectar anomalías de datos.
- Vigilar el rendimiento de las búsquedas y reportes.

## 8. Procedimientos de recuperación

- Restauración de datos: ver [plan de respaldo](../04_SEGURIDAD/12_respaldo_recuperacion.md).
- Recuperar acceso del admin: ver [manual de administrador](../03_MANUALES/09_manual_administrador.md).

## 9. Tarea de mantenimiento prioritaria (abierta)

> **Herramienta de pruebas.** La suite de Vitest **no se ejecuta** con Node 25 + Vitest
> 4.1.12 (globales `undefined`). **Acción:** usar Node 20 LTS o ajustar la configuración de
> Vitest, y re-ejecutar `npm run test --workspaces -- --run`. Detalle en el
> [informe de pruebas](../05_PRUEBAS/14_informe_pruebas.md).

## 10. Rutina de mantenimiento sugerida

| Frecuencia | Tarea                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Semanal    | Revisar logs e `intentos_acceso`; verificar respaldos.                                                   |
| Mensual    | `npm audit`; prueba de restauración; revisar dependencias.                                               |
| Por cambio | Ejecutar `npm run ci`; crear migración si cambia el esquema; actualizar el [changelog](17_changelog.md). |
| Trimestral | Revisar políticas RLS y permisos; plan de actualizaciones mayores.                                       |

## 11. Historial de cambios

Se mantiene en el [registro de cambios (changelog)](17_changelog.md).
