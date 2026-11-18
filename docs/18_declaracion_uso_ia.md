# 18 — Declaración de uso de inteligencia artificial en el desarrollo del proyecto

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> Documento complementario. Su objetivo es transparentar el uso de herramientas de
> inteligencia artificial durante el desarrollo y, sobre todo, dejar constancia de que el
> equipo **revisó, comprendió, probó y validó** el resultado, no se limitó a generar código.

---

## 1. Herramientas de IA utilizadas

- Asistentes de IA de generación de código y documentación (modelos de lenguaje tipo
  Claude / asistentes integrados al editor).

> _Nota para el equipo:_ indique aquí las herramientas concretas que usaron (por ejemplo
> Claude Code, GitHub Copilot, ChatGPT), sus versiones aproximadas y el período de uso.

## 2. Actividades en las que se utilizó

| Actividad              | Uso de IA                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| Generación de código   | Apoyo en componentes React, hooks, validaciones y funciones SQL. |
| Documentación          | Redacción y estructura de los documentos de la carpeta `docs/`.  |
| Auditoría de seguridad | Revisión del código y redacción de hallazgos (`auditoria.md`).   |
| Depuración             | Sugerencias para corregir errores y entender mensajes.           |

## 3. Componentes o módulos que recibieron asistencia de IA

- Frontend (`apps/web`): componentes, páginas y hooks.
- Lógica compartida (`packages/shared`): validaciones, cálculos y formato.
- Base de datos (`supabase/migrations`): funciones, políticas RLS y triggers.
- Documentación (`docs/`, `README.md`, `auditoria.md`, `recomendacion.md`).

> _Nota para el equipo:_ ajuste esta lista a lo que realmente fue asistido por IA frente a
> lo escrito manualmente.

## 4. Modificaciones y validaciones realizadas por el equipo

- Revisión y adaptación del código generado al estilo del proyecto (nombres en español, JSDoc, CSS _mobile-first_, sin TypeScript).
- Verificación de que las validaciones viven en `packages/shared` y la autorización en la base.
- Ajuste de las políticas RLS y de la tabla de permisos de la interfaz para que coincidan.
- Pruebas manuales de los flujos principales y revisión de los resultados.

## 5. Cómo se verificó la seguridad del código generado

- Se realizó una **auditoría de seguridad** completa (ver
  [documento 10](04_SEGURIDAD/10_auditoria_seguridad.md) y `auditoria.md`): 13 hallazgos,
  ninguno de ellos una vulnerabilidad clásica de aplicación explotable (sin IDOR, XSS, CSRF,
  SQLi ni escalamiento).
- Se ejecutó `npm audit` sobre las dependencias.
- Se verificó que los secretos no están versionados (`.env` en `.gitignore`) y que ninguna
  variable `VITE_*` contiene secretos.
- Se confirmó que la autorización se aplica en la base de datos (RLS + funciones), no solo
  en el frontend.

## 6. Limitaciones identificadas

- La IA puede proponer configuraciones inseguras por defecto (ej. secretos demo, puertos
  expuestos): se detectaron y documentaron como hallazgos de la auditoría, con plan de
  corrección en `recomendacion.md`.
- El código generado requiere **revisión humana**: no se integró nada sin comprenderlo.
- Herramientas y entornos cambian: se detectó un bloqueo real de la suite de pruebas con
  Node 25 + Vitest 4 (ver [informe de pruebas](05_PRUEBAS/14_informe_pruebas.md)), lo que
  confirma la necesidad de validar siempre en el entorno objetivo.

## 7. Conclusión

El uso de IA aceleró el desarrollo y la documentación, pero las decisiones de diseño, la
validación de seguridad y la verificación funcional fueron responsabilidad del equipo, que
revisó, comprendió, probó y validó el resultado antes de su entrega.
