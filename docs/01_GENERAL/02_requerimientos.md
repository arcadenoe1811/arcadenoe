# 02 — Especificación de requerimientos del sistema

**Proyecto:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

Este documento describe **qué debe hacer** el sistema (requerimientos funcionales) y las
**condiciones de calidad** que debe cumplir (requerimientos no funcionales). Cada
requerimiento tiene identificador, descripción, prioridad, módulo/usuario involucrado y
criterios de aceptación.

**Prioridades:** Alta (indispensable) · Media (importante) · Baja (deseable).

## A. Requerimientos funcionales

### Autenticación y sesión

| ID    | Descripción                                                                         | Prioridad | Módulo / Usuario | Criterios de aceptación                                                                                       |
| ----- | ----------------------------------------------------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| RF-01 | El sistema debe permitir el inicio de sesión con correo y contraseña.               | Alta      | Auth / Todos     | Con credenciales válidas se accede; con inválidas se muestra error sin revelar cuál dato falló.               |
| RF-02 | El sistema no debe permitir el registro público de usuarios.                        | Alta      | Auth             | No existe pantalla de registro; los usuarios solo los crea un admin.                                          |
| RF-03 | El sistema debe exigir cambio de contraseña en el primer ingreso o tras un reseteo. | Alta      | Auth / Todos     | Un usuario con contraseña temporal es redirigido a _Cambiar contraseña_ y no accede al resto hasta cambiarla. |
| RF-04 | El sistema debe cerrar la sesión automáticamente tras 8 horas de inactividad.       | Media     | Auth             | Tras el tiempo configurado (`VITE_SESION_INACTIVIDAD_MINUTOS`) la sesión caduca en cliente y servidor.        |
| RF-05 | El sistema debe bloquear la cuenta 15 minutos tras 5 contraseñas incorrectas.       | Alta      | Auth             | Al sexto intento fallido consecutivo el acceso queda bloqueado 15 minutos.                                    |
| RF-06 | El usuario debe poder cerrar sesión de forma segura.                                | Alta      | Auth / Todos     | _Cerrar sesión_ revoca los tokens en el servidor y limpia el almacenamiento local.                            |

### Gestión de usuarios y roles

| ID    | Descripción                                                                          | Prioridad | Módulo / Usuario | Criterios de aceptación                                                          |
| ----- | ------------------------------------------------------------------------------------ | --------- | ---------------- | -------------------------------------------------------------------------------- |
| RF-07 | El administrador debe poder registrar nuevos usuarios con rol y contraseña temporal. | Alta      | Usuarios / Admin | El usuario se crea y entra con contraseña temporal que debe cambiar.             |
| RF-08 | El administrador debe poder editar el nombre y el rol de un usuario.                 | Alta      | Usuarios / Admin | Los cambios se reflejan; un admin no puede cambiarse su propio rol.              |
| RF-09 | El administrador debe poder habilitar/deshabilitar usuarios (no se eliminan).        | Alta      | Usuarios / Admin | Un usuario deshabilitado pierde el acceso al instante y se cierran sus sesiones. |
| RF-10 | El administrador debe poder resetear la contraseña de un usuario.                    | Alta      | Usuarios / Admin | El usuario recibe contraseña temporal y debe cambiarla al entrar.                |
| RF-11 | El sistema debe garantizar que siempre exista al menos un administrador activo.      | Alta      | Usuarios         | No se puede deshabilitar ni quitar el rol admin al último admin activo.          |

### Cuellos y puños

| ID    | Descripción                                                                        | Prioridad | Módulo / Usuario | Criterios de aceptación                                                           |
| ----- | ---------------------------------------------------------------------------------- | --------- | ---------------- | --------------------------------------------------------------------------------- |
| RF-12 | El usuario debe poder buscar cuellos por código, nombre, notas y colores.          | Alta      | Cuellos / Todos  | La búsqueda ignora acentos y mayúsculas y prioriza coincidencia exacta de código. |
| RF-13 | El usuario debe poder filtrar cuellos por tipo y medida.                           | Media     | Cuellos / Todos  | Los filtros se combinan con la búsqueda.                                          |
| RF-14 | El usuario debe poder consultar la ficha técnica de un cuello/puño.                | Alta      | Cuellos / Todos  | Muestra tipo, hilos, posiciones, pasadas, medidas, colores por zona e imagen.     |
| RF-15 | El administrador debe poder crear, editar y dar de baja (lógica) cuellos y puños.  | Alta      | Cuellos / Admin  | La baja es lógica (`activo=false`); el operador solo consulta.                    |
| RF-16 | El administrador debe poder diseñar la combinación de colores por zona del cuello. | Alta      | Cuellos / Admin  | Se guardan colores por zona (tubular, cuerpo, borde, otro) con hilos y orden.     |
| RF-17 | El administrador debe poder vincular un puño a un cuello (herencia).               | Media     | Cuellos / Admin  | El puño puede heredar datos del cuello padre.                                     |

### Colores

| ID    | Descripción                                                          | Prioridad | Módulo / Usuario           | Criterios de aceptación                                                |
| ----- | -------------------------------------------------------------------- | --------- | -------------------------- | ---------------------------------------------------------------------- |
| RF-18 | El usuario debe poder consultar y crear/editar colores del catálogo. | Media     | Colores / Admin y Operador | Los nombres se normalizan (minúsculas); el hex es opcional y validado. |
| RF-19 | El administrador debe poder eliminar colores del catálogo.           | Baja      | Colores / Admin            | Solo admin elimina.                                                    |

### Conos (inventario de hilo)

| ID    | Descripción                                                                            | Prioridad | Módulo / Usuario         | Criterios de aceptación                                                 |
| ----- | -------------------------------------------------------------------------------------- | --------- | ------------------------ | ----------------------------------------------------------------------- |
| RF-20 | El usuario debe poder crear y editar conos con sus datos técnicos.                     | Alta      | Conos / Admin y Operador | Código, color, familia, material, proveedor, peso, costo, stock mínimo. |
| RF-21 | El usuario debe poder registrar entradas, salidas y ajustes de conos.                  | Alta      | Conos / Admin y Operador | Cada movimiento actualiza el stock; el stock no se edita a mano.        |
| RF-22 | El sistema debe calcular automáticamente el estado del cono (disponible/bajo/agotado). | Alta      | Conos                    | El estado deriva de `stock_actual` vs `stock_minimo`.                   |
| RF-23 | El usuario debe poder consultar el historial de movimientos de un cono.                | Media     | Conos / Todos            | La ficha del cono muestra todos sus movimientos.                        |
| RF-24 | El administrador debe poder eliminar o desactivar/reactivar conos.                     | Media     | Conos / Admin            | Solo admin elimina o desactiva.                                         |

### Ventas, producción y estimador

| ID    | Descripción                                                                       | Prioridad | Módulo / Usuario              | Criterios de aceptación                                              |
| ----- | --------------------------------------------------------------------------------- | --------- | ----------------------------- | -------------------------------------------------------------------- |
| RF-25 | El usuario debe poder registrar ventas con líneas por diseño y talla.             | Alta      | Ventas / Admin y Operador     | Los totales los calcula la base; cada línea guarda su propio precio. |
| RF-26 | El administrador debe poder ver el historial de ventas y eliminarlas.             | Alta      | Ventas / Admin                | El operador registra pero no ve el historial completo ni elimina.    |
| RF-27 | El usuario debe poder registrar producción bajo pedido.                           | Alta      | Producción / Admin y Operador | La producción entra a la existencia por diseño y talla.              |
| RF-28 | El sistema debe mostrar lo _pendiente de producir_ (vendido aún no producido).    | Alta      | Producción                    | La vista de existencia calcula producido − vendido por talla.        |
| RF-29 | El usuario debe poder calcular y guardar estimaciones de costo.                   | Media     | Estimador / Admin             | Material + mano de obra según tarifa horaria y costo de cono.        |
| RF-30 | El administrador debe poder fijar el precio base por diseño y la tarifa por hora. | Alta      | Diseños / Admin               | Cambiar el precio base no altera ventas pasadas.                     |

### Dashboard y reportes

| ID    | Descripción                                                                                      | Prioridad | Módulo / Usuario  | Criterios de aceptación                                       |
| ----- | ------------------------------------------------------------------------------------------------ | --------- | ----------------- | ------------------------------------------------------------- |
| RF-31 | El sistema debe mostrar un dashboard con indicadores del negocio.                                | Media     | Dashboard / Admin | Muestra cifras agregadas; el operador aterriza en Producción. |
| RF-32 | El sistema debe permitir generar reportes por período (inventario, producción, ventas, resumen). | Alta      | Reportes / Admin  | Las cifras se agregan en la base para un rango de fechas.     |
| RF-33 | El sistema debe permitir exportar reportes a CSV/Excel de forma segura.                          | Media     | Reportes / Admin  | Se neutraliza la inyección de fórmulas (`=`, `+`, `-`, `@`).  |

## B. Requerimientos no funcionales

| ID     | Descripción                                                                            | Prioridad | Criterios de aceptación                                                                     |
| ------ | -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| RNF-01 | El sistema debe usar HTTPS/TLS en cualquier despliegue fuera de `localhost`.           | Alta      | API y frontend accesibles solo por `https://` en red/servidor.                              |
| RNF-02 | La aplicación debe ser compatible con dispositivos móviles (_mobile-first_).           | Alta      | Diseño responsivo (640/1024 px); toques ≥ 44px; entradas de 16px en móvil.                  |
| RNF-03 | Las contraseñas deben almacenarse con hashing seguro (bcrypt).                         | Alta      | Supabase Auth guarda las contraseñas con bcrypt; nunca en texto plano.                      |
| RNF-04 | El sistema debe responder en tiempos aceptables.                                       | Media     | Búsquedas con índices `pg_trgm`; reportes agregados en la base (≤ 1000 filas por petición). |
| RNF-05 | El sistema debe implementar controles de acceso por rol en la base de datos.           | Alta      | Toda tabla tiene RLS; lo que la UI oculta, la API lo rechaza con 403.                       |
| RNF-06 | La autorización no debe depender únicamente del frontend.                              | Alta      | Las funciones `fn_*` verifican rol en la base; el frontend solo decide qué muestra.         |
| RNF-07 | Los datos deben validarse en el navegador y nuevamente en la base de datos.            | Alta      | Validaciones en `packages/shared` y restricciones `check`/funciones en SQL.                 |
| RNF-08 | Los secretos no deben versionarse en git.                                              | Alta      | `.env` está en `.gitignore`; solo se versiona `.env.example`.                               |
| RNF-09 | Ninguna variable `VITE_*` debe contener secretos.                                      | Alta      | Toda `VITE_*` se incrusta en el bundle; nunca lleva `service_role` ni contraseñas.          |
| RNF-10 | La sesión debe expirar por inactividad y los tokens deben rotarse.                     | Media     | JWT de 1 h, refresh rotado con revocación por reúso, inactividad de 8 h.                    |
| RNF-11 | El código debe mantener un estándar de calidad verificable.                            | Media     | `npm run ci`: lint (ESLint) + formato (Prettier) + build + pruebas (Vitest).                |
| RNF-12 | El sistema debe degradar con mensajes de error claros y sin filtrar detalles internos. | Media     | Los errores se normalizan con `normalizarError`; no se muestran stack traces.               |
| RNF-13 | El sistema debe ser instalable de forma reproducible.                                  | Media     | Docker Compose o Supabase CLI con migraciones versionadas (`00001`–`00015`).                |
| RNF-14 | La aplicación web debe servir cabeceras de seguridad.                                  | Media     | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` (y CSP en producción).       |

## Trazabilidad

Los requerimientos se relacionan con los casos de uso ([03](03_casos_de_uso.md)), la
arquitectura ([04](../02_TECNICA/04_arquitectura.md)) y el plan de pruebas
([13](../05_PRUEBAS/13_plan_pruebas.md)). La verificación de RNF de seguridad se documenta
en la [auditoría de seguridad](../04_SEGURIDAD/10_auditoria_seguridad.md).
