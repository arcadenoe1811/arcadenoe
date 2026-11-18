# 08 — Manual de usuario

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Dirigido a:** personal operativo (rol _operador_ y _administrador_)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> **Nota sobre capturas de pantalla.** Este manual deja marcados los lugares donde deben
> insertarse capturas con el formato `[Captura: …]`. Reemplácelas por imágenes reales del
> sistema en ejecución antes de la entrega.

---

## 1. Portada

Manual de uso del sistema **Inventario de Cuellos**, aplicación web para registrar y
consultar los cuellos, conos de hilo, ventas y producción de una tejedora industrial.

## 2. Introducción

El sistema funciona en el **navegador** (computadora o móvil). Permite buscar diseños de
cuellos, controlar el inventario de conos, registrar ventas y producción, y (según su rol)
estimar costos y ver reportes. No requiere instalar nada en su equipo.

## 3. Objetivo del manual

Guiar al usuario, paso a paso, en el uso de las funcionalidades del sistema, sin necesidad
de conocimientos de programación.

## 4. Requisitos para utilizar el sistema

- Un navegador web moderno (Chrome, Edge, Firefox o Safari actualizados).
- Conexión a la dirección del sistema (en local: `http://localhost:5173`).
- Un usuario y contraseña proporcionados por el administrador.

## 5. Cómo acceder a la plataforma

1. Abra el navegador y escriba la dirección del sistema.
2. Verá la pantalla de **inicio de sesión**.

`[Captura: pantalla de inicio de sesión]`

## 6. Inicio de sesión

1. Escriba su **correo** y su **contraseña**.
2. Pulse **Iniciar sesión**.
3. Si es su primer ingreso (o le resetearon la contraseña), el sistema le pedirá
   **cambiar la contraseña** antes de continuar (mínimo 8 caracteres, con un número y una
   mayúscula).

> ⚠️ Tras **5 intentos fallidos** la cuenta se bloquea **15 minutos**. La sesión se cierra
> sola tras **8 horas de inactividad**.

`[Captura: cambio de contraseña obligatorio]`

## 7. Descripción de la interfaz

- **Menú de navegación** (lateral/superior): acceso a cada módulo según su rol.
- **Área de contenido:** la pantalla del módulo seleccionado.
- **Su nombre** (esquina): opción _Cambiar contraseña_ y _Cerrar sesión_.

El operador aterriza en **Producción** al iniciar sesión; el administrador, en el
**Dashboard**.

`[Captura: interfaz principal con el menú]`

## 8. Explicación de cada módulo

| Módulo         | Qué permite (operador)                                                  |
| -------------- | ----------------------------------------------------------------------- |
| **Cuellos**    | Buscar y consultar diseños de cuellos y puños.                          |
| **Colores**    | Consultar, crear y editar colores del catálogo.                         |
| **Conos**      | Crear/editar conos y registrar entradas, salidas y ajustes.             |
| **Producción** | Ver lo pendiente de producir y registrar producción.                    |
| **Ventas**     | Registrar ventas (el historial completo es solo para el administrador). |

## 9. Procedimientos paso a paso

### 9.1 Buscar un cuello

1. Entre a **Cuellos**.
2. Escriba parte del código, nombre o color en el buscador (no importan tildes ni mayúsculas).
3. Use los filtros de **tipo** y **medida** si lo necesita.
4. Pulse un resultado para ver su **ficha** (datos técnicos, colores e imagen).

`[Captura: búsqueda y ficha de un cuello]`

### 9.2 Registrar una entrada o salida de cono

1. Entre a **Conos**.
2. Ubique el cono y elija **Entrada** o **Salida**.
3. Indique la **cantidad** (y, en entradas, proveedor/costo/lote si aplica).
4. Guarde. El **stock** y el **estado** (disponible/bajo/agotado) se actualizan solos.

`[Captura: registro de movimiento de cono]`

### 9.3 Registrar una venta

1. Entre a **Ventas → Registrar venta**.
2. Agregue una o varias **líneas**: diseño, talla, cantidad y precio.
3. (Opcional) indique cliente y método de pago.
4. Guarde. Los **totales los calcula el sistema**.

`[Captura: registrar venta]`

### 9.4 Registrar producción

1. Entre a **Producción**. Verá lo **pendiente de producir** (lo vendido aún no producido).
2. Registre la producción: diseño, talla, cantidad.
3. Guarde. La existencia se actualiza por diseño y talla.

`[Captura: registrar producción]`

### 9.5 Cambiar su contraseña

1. Pulse su **nombre** → **Cambiar contraseña**.
2. Ingrese la contraseña actual y la nueva.
3. Guarde.

## 10. Mensajes de error frecuentes

| Mensaje                      | Causa                            | Solución                                             |
| ---------------------------- | -------------------------------- | ---------------------------------------------------- |
| Credenciales incorrectas     | Correo o contraseña equivocados. | Verifique los datos; cuide mayúsculas.               |
| Cuenta bloqueada             | 5 intentos fallidos.             | Espere 15 minutos o pida al admin que la desbloquee. |
| Debe cambiar su contraseña   | Contraseña temporal.             | Cambie la contraseña para continuar.                 |
| Sin permiso para esta acción | Su rol no incluye esa operación. | Solicítelo a un administrador.                       |
| Datos inválidos              | Un campo fuera de rango o vacío. | Corrija el campo señalado.                           |

## 11. Preguntas frecuentes

- **¿Puedo usarlo desde el celular?** Sí, el diseño es _mobile-first_.
- **Cerré la pestaña, ¿perdí la sesión?** No necesariamente; la sesión dura hasta 8 h de inactividad.
- **No veo el módulo de Ventas/Reportes.** Es normal para el rol operador; son del administrador.
- **El stock de un cono se ve mal.** Regístrelo con un **ajuste**; nunca se edita a mano.

## 12. Información de soporte

Ante dudas o incidencias, contacte al **administrador del sistema** de su taller. Para
problemas técnicos, consulte el [manual de mantenimiento](../06_MANTENIMIENTO/16_manual_mantenimiento.md).
