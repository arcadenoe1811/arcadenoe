# 09 — Manual de administrador

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Dirigido a:** usuarios con rol _administrador_
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> **Diferencia clave:** el [manual de usuario](08_manual_usuario.md) explica **cómo usar**
> el sistema; este manual explica **cómo gestionarlo y mantenerlo**.

---

## 1. Acceso al panel administrativo

El administrador inicia sesión igual que cualquier usuario, pero su menú incluye módulos
adicionales: **Usuarios**, **Dashboard**, **Reportes**, **Ventas** (historial), **Estimador**,
**Diseños/precios** y la edición completa de cuellos.

> Usuario inicial de desarrollo: `admin@inventario.local` / `admin1234`.
> **Cambie esta contraseña** en cualquier entorno que no sea su máquina local.

## 2. Administración de usuarios

Entre a **Usuarios** (`/usuarios`).

### Crear un usuario

1. **Nuevo usuario** → nombre, correo y **rol** (admin u operador).
2. El sistema genera una **contraseña temporal** que el usuario debe cambiar al entrar.

### Editar, deshabilitar y resetear

| Acción                  | Efecto                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **Editar**              | Cambia nombre y rol. Un admin **no** puede cambiarse su propio rol.                |
| **Deshabilitar**        | El usuario pierde acceso al instante y se cierran sus sesiones. **No se elimina.** |
| **Reactivar**           | Restaura el acceso.                                                                |
| **Resetear contraseña** | Genera una contraseña temporal; el usuario la cambia al entrar.                    |

> **Reglas de integridad (impuestas por la base):** siempre debe quedar **al menos un
> administrador activo**; un admin no puede deshabilitarse a sí mismo. Estas reglas se
> aplican en la base de datos (`fn_proteger_ultimo_admin`), no solo en la interfaz.

`[Captura: gestión de usuarios]`

## 3. Administración de roles y permisos

Hay dos roles: **administrador** y **operador**. El detalle de permisos:

| Módulo               | Administrador                                   | Operador                        |
| -------------------- | ----------------------------------------------- | ------------------------------- |
| Usuarios             | Crear, editar, habilitar/deshabilitar, resetear | Sin acceso                      |
| Conos                | Todo (incluye eliminar y desactivar)            | Crear, editar, entradas/salidas |
| Colores              | Todo (incluye eliminar)                         | Crear y editar                  |
| Cuellos / puños      | Todo                                            | Solo consulta                   |
| Precios y tarifa     | Cambiar precio base y tarifa por hora           | Solo consulta                   |
| Ventas               | Registrar y eliminar, ver historial             | Solo registrar                  |
| Estimador            | Guardar y eliminar estimaciones                 | —                               |
| Producción           | Registrar y eliminar                            | Registrar                       |
| Dashboard y reportes | Ver                                             | —                               |

> La tabla de permisos de la interfaz vive en
> [`packages/shared/usuarios/permisos.js`](../../packages/shared/usuarios/permisos.js) y
> **debe coincidir** con las políticas RLS de la base
> (`supabase/migrations/00011`, `00012`, `00015`). Si se cambia un permiso en un lado, hay
> que cambiarlo en el otro.

## 4. Configuración del sistema

- **Precio base por diseño:** en **Diseños**, fije el precio de venta de cada diseño (igual para todas las tallas). Cambiarlo **no** altera ventas pasadas.
- **Tarifa por hora:** en el estimador/configuración, fije la mano de obra por hora (tabla `configuracion`, fila única).
- **Variables de entorno:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SESION_INACTIVIDAD_MINUTOS` (ver [instalación](../06_MANTENIMIENTO/15_instalacion_despliegue.md)).

## 5. Gestión de catálogos

- **Cuellos/puños:** alta, edición, baja lógica, diseño de colores por zona y vínculo puño–cuello.
- **Colores:** catálogo de colores normalizados para el diseñador.
- **Conos:** catálogo de conos de hilo y sus familias de color.
- **Tipos de cuello:** catálogo extensible de tipos.

## 6. Supervisión de operaciones

- **Dashboard** (`/`): indicadores del negocio.
- **Reportes** (`/reportes`): inventario, producción, ventas y resumen por período; exportables a CSV/Excel.
- **Ventas** (`/ventas`): historial completo de ventas con su estado.
- **Producción** (`/produccion`): pendientes de producir y registro.

## 7. Consulta de registros de actividad

- Las tablas `ventas`, `producciones`, `estimaciones` y `movimientos_cono` guardan
  `usuario_id` y `created_at` (traza parcial de quién y cuándo).
- `intentos_acceso` registra los fallos de login por usuario.

> **Limitación conocida:** no existe aún un registro de auditoría dedicado para cambios de
> rol, deshabilitaciones ni eliminaciones (ver hallazgo B-4 de la
> [auditoría](../04_SEGURIDAD/10_auditoria_seguridad.md)).

## 8. Gestión de respaldos

Vea el [plan de respaldo y recuperación](../04_SEGURIDAD/12_respaldo_recuperacion.md).
En resumen: respalde la base de datos con `pg_dump` (local) o mediante los backups de
Supabase Cloud, y verifique la restauración periódicamente.

## 9. Procedimientos de mantenimiento

Vea el [manual de mantenimiento](../06_MANTENIMIENTO/16_manual_mantenimiento.md):
actualización de dependencias (`npm audit`), aplicación de migraciones, revisión de logs y
actualizaciones de seguridad.

### Recuperar el acceso del único admin (olvido de contraseña)

Por SQL (Supabase Studio o `docker compose exec db psql`):

```sql
update auth.users
set encrypted_password = extensions.crypt('Nueva-Contraseña-1', extensions.gen_salt('bf'))
where email = 'admin@inventario.local';
delete from public.intentos_acceso;  -- levanta un bloqueo por intentos fallidos
```

## 10. Recomendaciones de seguridad

- Cambie de inmediato la contraseña del admin inicial fuera de `localhost`.
- Antes de exponer el sistema a la red: use **HTTPS**, genere secretos propios y sirva el
  **build estático** (no el dev server de Vite). Siga el
  [plan de remediación](../../recomendacion.md) y las
  [políticas de seguridad](../04_SEGURIDAD/11_politicas_seguridad.md).
- Nunca suba `.env` al repositorio ni ponga secretos en variables `VITE_*`.
- Mantenga la **anon key** separada de la **service_role key** (esta última jamás en el frontend).
