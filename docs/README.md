# Documentación — Inventario de Cuellos (Arca de Noé)

Documentación formal del sistema **Inventario de Cuellos**, una aplicación web
para registrar, buscar y gestionar los cuellos (y puños), los conos de hilo, las
ventas, la producción bajo pedido y los costos de una tejedora industrial.

- **Frontend:** React 18 + Vite (SPA), JavaScript con JSDoc.
- **Backend / Base de datos:** Supabase (PostgreSQL + PostgREST + GoTrue Auth).
- **Autorización:** políticas RLS y funciones SQL en la base de datos (sin servidor propio).

> La fecha de referencia de esta documentación es **2026-11-17** y corresponde a la
> rama `fix/erroresdediseno`.

## Estructura de la documentación

| Carpeta | Documento | Estado |
| --- | --- | --- |
| `01_GENERAL/` | [01 — Descripción general del proyecto](01_GENERAL/01_descripcion_general.md) | ✅ |
| `01_GENERAL/` | [02 — Especificación de requerimientos](01_GENERAL/02_requerimientos.md) | ✅ |
| `01_GENERAL/` | [03 — Especificación de casos de uso](01_GENERAL/03_casos_de_uso.md) | ✅ |
| `02_TECNICA/` | [04 — Arquitectura del sistema](02_TECNICA/04_arquitectura.md) | ✅ |
| `02_TECNICA/` | [05 — Diccionario de datos y DER](02_TECNICA/05_diccionario_datos.md) | ✅ |
| `02_TECNICA/` | [06 — Documentación del código fuente](02_TECNICA/06_codigo_fuente.md) | ✅ |
| `02_TECNICA/` | [07 — Documentación de API](02_TECNICA/07_api.md) | ✅ |
| `03_MANUALES/` | [08 — Manual de usuario](03_MANUALES/08_manual_usuario.md) | ✅ |
| `03_MANUALES/` | [09 — Manual de administrador](03_MANUALES/09_manual_administrador.md) | ✅ |
| `04_SEGURIDAD/` | [10 — Auditoría de seguridad](04_SEGURIDAD/10_auditoria_seguridad.md) | ✅ |
| `04_SEGURIDAD/` | [11 — Políticas de seguridad](04_SEGURIDAD/11_politicas_seguridad.md) | ✅ |
| `04_SEGURIDAD/` | [12 — Plan de respaldo y recuperación](04_SEGURIDAD/12_respaldo_recuperacion.md) | ✅ |
| `05_PRUEBAS/` | [13 — Plan de pruebas](05_PRUEBAS/13_plan_pruebas.md) | ✅ |
| `05_PRUEBAS/` | [14 — Informe de resultados de pruebas](05_PRUEBAS/14_informe_pruebas.md) | ✅ |
| `06_MANTENIMIENTO/` | [15 — Manual de instalación y despliegue](06_MANTENIMIENTO/15_instalacion_despliegue.md) | ✅ |
| `06_MANTENIMIENTO/` | [16 — Manual de mantenimiento](06_MANTENIMIENTO/16_manual_mantenimiento.md) | ✅ |
| `06_MANTENIMIENTO/` | [17 — Registro de cambios (Changelog)](06_MANTENIMIENTO/17_changelog.md) | ✅ |
| `docs/` | [18 — Declaración de uso de inteligencia artificial](18_declaracion_uso_ia.md) | ✅ |

## Documentos fuente ya existentes en el repositorio

- [`README.md`](../README.md) — guía técnica de puesta en marcha.
- [`auditoria.md`](../auditoria.md) — auditoría de seguridad detallada (13 hallazgos).
- [`recomendacion.md`](../recomendacion.md) — plan de remediación para Supabase Cloud.

Los documentos de esta carpeta **resumen, estructuran y formalizan** esa información;
cuando corresponde enlazan a los archivos fuente para no duplicar el detalle.
