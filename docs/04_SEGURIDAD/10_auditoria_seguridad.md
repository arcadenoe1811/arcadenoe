# 10 — Documento de auditoría de seguridad

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17
**Rama auditada:** `fix/erroresdediseno`

> Este documento es el **informe formal** de la auditoría. El detalle técnico completo de
> cada hallazgo (archivos, líneas, pruebas de concepto) está en
> [`auditoria.md`](../../auditoria.md) y el plan de corrección en
> [`recomendacion.md`](../../recomendacion.md), en la raíz del repositorio.

---

## 1. Introducción

Se realizó una revisión de seguridad del código completo del repositorio: frontend
(React/Vite), paquete compartido, migraciones SQL de Supabase e infraestructura
(Docker). El sistema es deliberadamente **local / mono-taller**, con arquitectura
**Supabase + React (SPA)** sin backend propio: toda la autorización vive en la base de
datos (RLS, funciones `SECURITY DEFINER`, triggers).

## 2. Objetivo de la auditoría

Determinar si el sistema contiene vulnerabilidades explotables o configuraciones
inseguras, clasificarlas por nivel de riesgo y recomendar correcciones priorizadas.

## 3. Alcance de la evaluación

- Frontend React/Vite (`apps/web`).
- Lógica compartida (`packages/shared`).
- Migraciones SQL, RLS, funciones y triggers (`supabase/migrations/00001`–`00015`).
- Infraestructura local (`docker-compose.yml`, `config.toml`, nginx).

## 4. Tecnologías evaluadas

React 18, React Router 6, Vite 6, `@supabase/supabase-js`, PostgreSQL 15, PostgREST,
GoTrue, Docker Compose.

## 5. Metodología utilizada

Revisión manual de código orientada a OWASP (control de acceso, inyección, XSS, CSRF,
autenticación/sesión, exposición de datos, configuración), análisis de las políticas RLS
y funciones SQL, y revisión de la configuración de despliegue. Se verificaron tanto los
puntos **con hallazgo** como los **revisados sin hallazgo explotable**.

## 6. Herramientas utilizadas

- Revisión manual del código y de las migraciones.
- `npm audit` para vulnerabilidades de dependencias.
- Inspección del historial de git para fugas de secretos.

## 7. Vulnerabilidades identificadas

**Total: 13 hallazgos** — Críticos: 1 · Altos: 3 · Medios: 5 · Bajos/informativos: 4.

| # | Nivel | Hallazgo |
| --- | --- | --- |
| C-1 | 🔴 Crítico | `JWT_SECRET`/`POSTGRES_PASSWORD` con valores demo públicos + API expuesta en todas las interfaces → forja de token `service_role` y bypass total de RLS. |
| A-1 | 🟠 Alto | Credenciales de admin por defecto versionadas (`seed_usuario.sql`: `admin1234`) sin forzar cambio. |
| A-2 | 🟠 Alto | El “despliegue” sirve el dev server de Vite expuesto en `0.0.0.0:5173`. |
| A-3 | 🟠 Alto | Puertos de API (`54321`) y web (`5173`) publicados en todas las interfaces. |
| M-1 | 🟡 Medio | Dependencia `react-router` con vulnerabilidad conocida (open redirect). |
| M-2 | 🟡 Medio | Sin cabeceras de seguridad (CSP, etc.) servidas por el host de producción. |
| M-3 | 🟡 Medio | Sin HTTPS/TLS en los servicios locales. |
| M-4 | 🟡 Medio | Token de sesión en `localStorage` (no `httpOnly`). |
| M-5 | 🟡 Medio | `.env` con credenciales débiles y variables muertas (`VITE_DEFAULT_*`). |
| B-1 | 🔵 Bajo | El operador ve nombres de clientes vía funciones de producción (intencional). |
| B-2 | 🔵 Bajo | `imagen_url` renderiza una URL externa arbitraria como `<img>`. |
| B-3 | 🔵 Bajo | Esquema `graphql_public` expuesto (superficie extra). |
| B-4 | 🔵 Bajo | Sin registro de auditoría de cambios de rol / eliminaciones. |

### Ejemplo de hallazgo documentado (formato estándar)

**VUL-C1: Secreto JWT demo + API expuesta**
Nivel: **Crítico**.
**Descripción:** el `JWT_SECRET` del `.env` es el secreto demo público de Supabase; con la
API publicada en `0.0.0.0:54321`, cualquiera en la red puede firmar un JWT `service_role`
y saltarse toda la RLS.
**Ubicación:** `.env` (líneas 5-6), `docker-compose.yml` (puerto `54321`).
**Evidencia:** un JWT forjado con el secreto conocido, enviado a `/rest/v1/ventas`,
devuelve todos los datos sin login.
**Impacto:** compromiso total de la base de datos.
**Recomendación:** generar secretos aleatorios por entorno, no publicar la API en `0.0.0.0`,
y en Supabase Cloud dejar que la plataforma gestione el secreto.
**Estado:** mitigado al migrar a Supabase Cloud (ver sección 11).

> El resto de hallazgos están documentados con el mismo nivel de detalle en
> [`auditoria.md`](../../auditoria.md).

## 8. Evidencias

Las pruebas de concepto, rutas de archivo y líneas exactas de cada hallazgo están en
[`auditoria.md`](../../auditoria.md). Para la entrega final se recomienda anexar capturas de:
`npm audit`, la respuesta de la API con token forjado (entorno de prueba aislado) y la
configuración de puertos.

## 9. Nivel de riesgo

El riesgo se concentra en **configuración de despliegue y valores por defecto**, y se
vuelve peligroso **solo si el stack deja de estar en `localhost`**. La **lógica de
aplicación es sólida**: no se encontró IDOR, escalamiento de privilegios explotable, SQL
injection, XSS, CSRF ni endpoints sin autenticar.

## 10. Recomendaciones

Orden sugerido de corrección: **C-1 → A-1 → A-3 → A-2 → M-2/M-3 → M-5 → M-1 → resto.**
El detalle de cada recomendación y el plan completo están en
[`recomendacion.md`](../../recomendacion.md).

## 11. Correcciones implementadas / plan de remediación

El despliegue previsto es **Supabase Cloud** con usuarios recreados desde cero. Esto
**resuelve de raíz** varios hallazgos:

| Hallazgo | Estado tras migrar a Supabase Cloud |
| --- | --- |
| C-1 | ✅ Resuelto: Supabase gestiona un `JWT secret` único y privado; API por HTTPS. |
| A-2 / A-3 | ✅ Resueltos: ya no se sirve la API/dev server propios; solo el frontend estático. |
| M-3 | ✅ Resuelto para API/Auth (HTTPS de Supabase) y frontend (host con HTTPS). |
| A-1 | 🔧 Acción: crear el admin real con contraseña fuerte y `debe_cambiar_contrasena = true`; no ejecutar `seed_usuario.sql` en cloud. |
| M-2 | 🔧 Acción: configurar cabeceras + CSP en el host del frontend. |
| M-5 | 🔧 Acción: eliminar `VITE_DEFAULT_*` del `.env`. |
| M-1 | 🔧 Acción: `npm audit fix` y planificar subida de `react-router-dom`. |
| B-1…B-4 | 🔧 Decisiones de negocio / endurecimientos opcionales. |

## 12. Resultados de la nueva evaluación

Tras aplicar el plan de remediación, se recomienda **re-auditar** verificando el checklist
de migración de [`recomendacion.md`](../../recomendacion.md): secretos gestionados por
Supabase, admin con contraseña fuerte, frontend estático con HTTPS y cabeceras/CSP, y sin
variables muertas.

## 13. Conclusiones

La **autorización es sólida y está bien diseñada** (RLS en todas las tablas, verificación
de rol en la base, bcrypt, anti-fuerza-bruta, manejo de sesión cuidado). No hay
vulnerabilidades clásicas de aplicación. El único hallazgo **crítico** (C-1) es de
configuración y se resuelve al migrar a Supabase Cloud. Corrigiendo C-1, A-1 y A-2 antes
de exponer el stack, el sistema queda en un nivel de seguridad adecuado para su uso
previsto.

*Auditoría realizada sin modificar código; las correcciones quedan a criterio del equipo.*
