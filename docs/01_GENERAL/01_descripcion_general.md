# 01 — Descripción general del proyecto

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17
**Rama:** `fix/erroresdediseno`

---

## 1. Portada

|                        |                                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Nombre del sistema** | Inventario de Cuellos                                                  |
| **Tipo de aplicación** | Aplicación web (SPA) de gestión de inventario y producción             |
| **Dominio**            | Taller de tejido industrial (fabricación de cuellos y puños)           |
| **Stack**              | React + Vite · Supabase (PostgreSQL + PostgREST + GoTrue)              |
| **Modalidad de uso**   | Mono-taller, un solo inventario compartido por el personal autenticado |

## 2. Introducción

El Inventario de Cuellos es un sistema diseñado para una **tejedora industrial** que
fabrica cuellos y puños tejidos. El sistema reemplaza el registro manual (cuadernos y
hojas de cálculo) por una aplicación web donde se concentran los diseños de cuellos, el
inventario de conos de hilo, las ventas, la producción bajo pedido y la estimación de
costos.

La aplicación es una **SPA (Single Page Application)** que el personal usa desde el
navegador, tanto en computadora como en móvil (diseño _mobile-first_). No existe un
servidor de aplicaciones propio: el navegador se comunica directamente con la plataforma
Supabase, y toda la lógica de negocio sensible y la autorización viven en la base de datos.

## 3. Antecedentes del proyecto

El taller llevaba el control de sus productos y materiales de forma manual. Los **cuellos**
se identifican con códigos internos (por ejemplo `maza4`, `maz4t5`, `cous`) y cada uno
tiene características técnicas (tipo de tejido, cantidad de hilos, posiciones, pasadas,
medidas/tallas y combinación de colores por zona). Los **conos de hilo** son la materia
prima. El registro manual dificultaba buscar un diseño, saber qué conos había disponibles,
estimar el costo de un pedido y llevar el historial de ventas y producción.

## 4. Planteamiento del problema

El control manual de un catálogo creciente de diseños y de la materia prima presenta
problemas concretos:

- **Búsqueda lenta** de un diseño entre decenas de cuellos con códigos parecidos.
- **Falta de visibilidad** del inventario de conos (qué hay, cuánto queda, cuándo está bajo o agotado).
- **Dificultad para estimar costos** de un pedido (material + mano de obra) de forma consistente.
- **Sin historial confiable** de ventas y producción, lo que impide saber qué está _pendiente de producir_.
- **Sin control de acceso**: cualquiera con el cuaderno podía ver o alterar todo.

## 5. Justificación

Digitalizar el inventario permite:

- Buscar un cuello por código, nombre, notas o color en segundos (búsqueda sin acentos ni mayúsculas).
- Conocer en todo momento el estado del inventario de conos (disponible / bajo / agotado) y su valor.
- Registrar ventas y producción con totales **calculados y validados por la base de datos**, no a mano.
- Trabajar **bajo pedido**: lo vendido que aún no se produjo aparece como _pendiente de producir_.
- Separar responsabilidades mediante **roles** (administrador y operador) con permisos distintos.
- Mantener la información **protegida** (autenticación, autorización por rol, validaciones y respaldo).

## 6. Objetivo general

Desarrollar una aplicación web que permita a una tejedora industrial **registrar, consultar
y gestionar** sus diseños de cuellos, su inventario de conos de hilo, sus ventas, su
producción bajo pedido y la estimación de costos, con control de acceso por roles y la
información protegida y validada.

## 7. Objetivos específicos

1. Catalogar los cuellos y puños con todas sus características técnicas y su combinación de colores.
2. Proveer una **búsqueda** tolerante a acentos y mayúsculas, con filtros por tipo y medida.
3. Gestionar el **inventario de conos** con entradas, salidas y ajustes, y estado de stock automático.
4. Registrar **ventas** y **producción** con totales calculados en la base y autoría por usuario.
5. Ofrecer un **estimador de costos** (material + mano de obra) configurable por tarifa horaria.
6. Entregar un **dashboard y reportes** con cifras agregadas por período, exportables.
7. Implementar **autenticación y autorización por rol** (admin / operador) aplicada en la base de datos.
8. Garantizar la **validación** de datos tanto en el navegador como en la base de datos.

## 8. Alcance del sistema

**Incluye:**

- Gestión de catálogo de cuellos y puños (alta, edición, baja lógica, vínculo puño–cuello, tipos).
- Catálogo de colores para autocompletado del diseñador.
- Inventario de conos de hilo con movimientos (entrada, salida, ajuste) e historial.
- Registro de ventas (con líneas por talla) y de producción bajo pedido.
- Estimador de costos con tarifa de mano de obra configurable.
- Dashboard, reportes por período y exportación (CSV/Excel con neutralización de fórmulas).
- Gestión de usuarios y roles; cambio y reseteo de contraseñas; bloqueo por intentos fallidos.

**Excluye (fuera de alcance actual):**

- Facturación fiscal / integración contable.
- Pasarela de pagos en línea.
- Almacenamiento de imágenes propio (se usan URLs externas; Supabase Storage está deshabilitado).
- Multi-taller / multi-empresa (el sistema es mono-taller: un único inventario compartido).

## 9. Limitaciones del proyecto

- **Mono-taller:** todo el personal autenticado comparte el mismo inventario; no hay separación por sucursal.
- **Imágenes externas:** las fotos de cuellos/conos son enlaces externos (ImgBB, Cloudinary, Google Drive), no archivos alojados.
- **Despliegue local por defecto:** la configuración de origen es `localhost` (Docker/CLI). Para exponer el sistema fuera de la máquina hay requisitos de seguridad adicionales (ver [auditoría](../04_SEGURIDAD/10_auditoria_seguridad.md)).
- **Sin SSR:** es una SPA; no hay renderizado del lado del servidor.
- **Reportes acotados:** la API entrega como máximo 1000 filas, por eso las cifras se agregan con funciones SQL y no en el navegador.

## 10. Descripción general de las funcionalidades

| Módulo                   | Descripción                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticación**        | Inicio de sesión, cambio de contraseña obligatorio en primer ingreso, bloqueo por fuerza bruta, expiración por inactividad.      |
| **Cuellos / puños**      | Catálogo con búsqueda, filtros, ficha técnica, diseñador de colores por zona y herencia puño–cuello.                             |
| **Colores**              | Catálogo de colores normalizados para autocompletar el diseñador.                                                                |
| **Conos**                | Inventario de conos de hilo: alta/edición, movimientos (entrada/salida/ajuste), estado de stock, muestrario y familias de color. |
| **Diseños**              | Precio base por diseño y existencia (producido − vendido) por talla.                                                             |
| **Ventas**               | Registro de ventas con líneas por talla, métodos de pago, historial y estado de venta.                                           |
| **Producción**           | Registro de producción bajo pedido y vista de lo _pendiente de producir_.                                                        |
| **Estimador**            | Cálculo y guardado de estimaciones de costo (material + mano de obra).                                                           |
| **Dashboard y reportes** | Cifras agregadas por período (inventario, producción, ventas, resumen) exportables.                                              |
| **Usuarios**             | Gestión de usuarios y roles (solo administrador).                                                                                |

## 11. Tecnologías utilizadas

| Capa               | Tecnología                              | Versión                   |
| ------------------ | --------------------------------------- | ------------------------- |
| Frontend           | React                                   | 18.3.x                    |
| Frontend           | React Router DOM                        | 6.28.x                    |
| Build / dev server | Vite                                    | 6.x                       |
| Lenguaje           | JavaScript (ESM) con JSDoc              | —                         |
| Cliente de datos   | `@supabase/supabase-js`                 | 2.45+                     |
| Base de datos      | PostgreSQL (Supabase)                   | 15                        |
| API de datos       | PostgREST                               | (gestionado por Supabase) |
| Autenticación      | GoTrue (Supabase Auth)                  | (gestionado por Supabase) |
| Pruebas            | Vitest + Testing Library                | Vitest 4.x                |
| Calidad            | ESLint 9 + Prettier 3                   | —                         |
| Infra local        | Docker Compose / Supabase CLI           | —                         |
| Monorepo           | npm workspaces (`apps/*`, `packages/*`) | —                         |

Más detalle en [04 — Arquitectura del sistema](../02_TECNICA/04_arquitectura.md).
