# 17 — Registro de cambios (Changelog)

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> Historial de cambios del proyecto, reconstruido a partir del historial de git. El formato
> sigue el espíritu de [Keep a Changelog](https://keepachangelog.com/). Las fechas son
> reales; los números de versión son una propuesta para ordenar las entregas.

---

## [No liberado] — rama `fix/erroresdediseno`

### Corregido / en progreso
- Correcciones de errores de diseño en el formulario de conos (`PaginaFormularioCono.jsx`, `conos.css`).

### Añadido
- Componente `ModalProveedor` para el módulo de conos.

### Documentación
- Se incorpora la carpeta `docs/` con la documentación formal del proyecto (17 documentos + declaración de uso de IA).
- Se añaden `auditoria.md` y `recomendacion.md` en la raíz (auditoría de seguridad y plan de remediación).

### Pendiente
- Resolver el bloqueo de la suite de pruebas con Node 25 + Vitest 4 (ver [informe de pruebas](../05_PRUEBAS/14_informe_pruebas.md)).

## [0.5.0] — 2026-11-17

### Añadido
- Módulo de **módulos de negocio** (ventas, estimador, producción y reportes) — PR #6 (`feature/modulos`).

## [0.4.0] — 2026-11-16

### Añadido / Mejorado
- Mejoras al **módulo de inventario de conos** — PR #5 (`feature/inventariodeconos`).

## [0.3.0] — 2026-11-14

### Añadido
- Módulo de **puños** con herencia puño–cuello — PR #3 (`feature/punos`).

### Infraestructura
- Ajustes del flujo de integración continua (`ci.yml`).

## [0.2.0] — 2026-11-13

### Añadido
- **Portada** y mejoras de presentación — PR #2 (`fix/portada`).

## [0.1.0] — 2026-11-12

### Añadido
- Inicialización del **inventario de cuellos** (esquema, búsqueda y catálogo).
- **Paletas de colores** / catálogo de colores — PR #1 (`feature/paletasdecolores`).
- **Inicio de sesión con Supabase Auth** y protección de rutas por rol.

---

## Plantilla para nuevas entradas

```
## [X.Y.Z] — AAAA-MM-DD
### Añadido
- ...
### Cambiado
- ...
### Corregido
- ...
### Seguridad
- ...
```
