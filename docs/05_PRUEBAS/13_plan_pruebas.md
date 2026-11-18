# 13 — Plan de pruebas

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Objetivos de las pruebas

Verificar que las funcionalidades cumplen los [requerimientos](../01_GENERAL/02_requerimientos.md),
que los módulos se integran correctamente y que no existen vulnerabilidades explotables,
asegurando la calidad antes de la entrega.

## 2. Alcance

- **Incluye:** lógica de negocio compartida (validaciones, permisos, cálculos, filtros,
  herencia, reportes), componentes de UI clave y flujos principales (login, venta, etc.).
- **Excluye:** pruebas de carga a gran escala y pruebas de penetración automatizadas
  (la seguridad se cubre con la [auditoría](../04_SEGURIDAD/10_auditoria_seguridad.md)).

## 3. Módulos evaluados

Autenticación/sesión, usuarios y permisos, cuellos (validaciones, diseño, herencia,
filtros), colores, conos, ventas, estimador y reportes.

## 4. Tipos de pruebas

| Tipo                        | Qué evalúa                                          | Cómo se cubre                                           |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| **Funcionales (unitarias)** | Que cada función trabaje correctamente.             | Vitest sobre `packages/shared`.                         |
| **Integración**             | Que los módulos/componentes se comuniquen bien.     | Vitest + Testing Library sobre `apps/web`.              |
| **Interfaz**                | Que la UI funcione y se visualice.                  | Testing Library + revisión manual _mobile-first_.       |
| **Rendimiento**             | Que el sistema responda adecuadamente.              | Índices `pg_trgm`, agregación en la base (≤1000 filas). |
| **Seguridad**               | Que no existan vulnerabilidades explotables.        | Auditoría manual + `npm audit` (ver doc 10).            |
| **Compatibilidad**          | Que funcione en distintos navegadores/dispositivos. | Revisión manual en Chrome/Edge/Firefox + móvil.         |
| **Aceptación**              | Que cumpla las necesidades del usuario.             | Validación de casos de uso con el taller.               |

## 5. Herramientas

- **Vitest 4** (runner) + **@testing-library/react** y **jsdom** (entorno de componentes).
- **ESLint 9** y **Prettier 3** (calidad y formato).
- **`npm audit`** (dependencias).
- Script agregador: `npm run ci` = lint + formato + build + pruebas.

## 6. Ambiente de pruebas

- Node.js 20+, dependencias instaladas con `npm install`.
- Las pruebas unitarias **no** requieren la base de datos (usan datos y mocks).
- Las pruebas manuales de integración usan el stack local (Docker o Supabase CLI).

## 7. Criterios de aceptación

- Toda la suite automatizada **pasa** (`npm run test --workspaces -- --run`).
- `npm run lint` y `npm run format:check` sin errores.
- `npm run build` genera `apps/web/dist` sin errores.
- Los casos de uso principales se validan manualmente sin defectos bloqueantes.

## 8. Casos de prueba planificados

| ID    | Módulo     | Descripción                                    | Resultado esperado                       |
| ----- | ---------- | ---------------------------------------------- | ---------------------------------------- |
| PT-01 | Auth       | Inicio de sesión con credenciales válidas.     | Acceso permitido.                        |
| PT-02 | Auth       | Inicio de sesión con contraseña incorrecta.    | Acceso denegado, mensaje genérico.       |
| PT-03 | Permisos   | Operador intenta acceder al panel admin.       | Acceso denegado (403 / ruta oculta).     |
| PT-04 | Auth       | 5 contraseñas incorrectas.                     | Cuenta bloqueada 15 min.                 |
| PT-05 | Usuarios   | Deshabilitar al último admin.                  | Rechazado (`fn_proteger_ultimo_admin`).  |
| PT-06 | Cuellos    | Buscar “MAZ” con acentos/mayúsculas mezclados. | Devuelve coincidencias correctas.        |
| PT-07 | Cuellos    | Guardar cuello con código duplicado.           | Rechazado por validación.                |
| PT-08 | Conos      | Registrar salida mayor al stock.               | Rechazado (sin stock negativo).          |
| PT-09 | Conos      | Registrar entrada.                             | Stock y estado se actualizan solos.      |
| PT-10 | Ventas     | Registrar venta con 2 líneas.                  | Totales calculados por la base.          |
| PT-11 | Ventas     | Cambiar precio base tras una venta.            | La venta pasada conserva su precio.      |
| PT-12 | Producción | Registrar producción de un pedido.             | Baja lo pendiente de producir.           |
| PT-13 | Estimador  | Calcular costo (material + mano de obra).      | Total correcto según tarifa y conos.     |
| PT-14 | Reportes   | Exportar reporte con texto `=cmd`.             | Celda neutralizada (anti-inyección CSV). |
| PT-15 | UI         | Vista en móvil (≤640px).                       | Diseño responsivo, toques ≥44px.         |

> Los IDs PT-01…PT-15 se corresponden con el
> [informe de resultados de pruebas](14_informe_pruebas.md).

## 9. Suite automatizada existente

| Paquete           | Archivos de prueba                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared` | `conos`, `diseno`, `herencia`, `reportes`, `usuarios`, `validaciones`, `ventas-estimador`, `colores-diseno` (8).                      |
| `apps/web`        | `DisenadorCuello`, `LayoutPrincipal`, `RutaProtegida`, `SelectorColorHex`, `ContextoAuth`, `useDebounce`, `PaginaRegistrarVenta` (7). |

**Total: 15 archivos de prueba.** Su estado de ejecución actual se reporta en el
[informe de resultados](14_informe_pruebas.md).

## 10. Responsables

| Rol                              | Responsabilidad                                                 |
| -------------------------------- | --------------------------------------------------------------- |
| Desarrollador                    | Escribir y mantener las pruebas automatizadas.                  |
| Responsable de calidad           | Ejecutar la suite y las pruebas manuales, registrar resultados. |
| Administrador/usuario del taller | Pruebas de aceptación de los casos de uso.                      |
