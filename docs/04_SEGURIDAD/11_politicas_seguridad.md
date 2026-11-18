# 11 — Documento de políticas de seguridad

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> Establece las reglas y medidas para proteger el sistema y la información. Se basa en la
> arquitectura real (Supabase + SPA) y en los hallazgos de la
> [auditoría](10_auditoria_seguridad.md).

---

## 1. Política de contraseñas

- Longitud mínima **8 caracteres**, con al menos **un número** y **una mayúscula** (validado en navegador y base).
- Las contraseñas se almacenan con **bcrypt** (Supabase Auth); nunca en texto plano.
- Los usuarios nuevos o reseteados reciben una **contraseña temporal** y deben cambiarla en el primer ingreso (`debe_cambiar_contrasena`).
- La contraseña del admin inicial de desarrollo (`admin1234`) **debe cambiarse** en cualquier entorno distinto de `localhost`.

## 2. Política de control de acceso

- **Autenticación obligatoria:** todas las pantallas exigen sesión; no hay registro público.
- **Autorización por rol** (admin / operador) aplicada en la **base de datos** mediante RLS y funciones. Lo que la interfaz oculta, la API lo rechaza con **403**.
- El frontend **no** es la frontera de seguridad: solo decide qué se muestra.
- La tabla de permisos de la UI (`packages/shared/usuarios/permisos.js`) debe mantenerse **sincronizada** con las políticas RLS.

## 3. Gestión de usuarios y permisos

- Los usuarios los crea y gestiona un **administrador**; no se eliminan, se **deshabilitan**.
- Un usuario deshabilitado pierde acceso al instante (aunque su token siga vigente).
- Siempre debe existir **al menos un administrador activo**; un admin no puede quitarse su propio rol ni deshabilitarse.
- La **service_role key** jamás se usa en el frontend; solo del lado servidor si fuera necesaria.

## 4. Protección de información

- Validación de datos en dos capas: `packages/shared` (navegador) y restricciones/funciones SQL (base).
- Los totales de ventas y estimaciones se **calculan en la base**; el `usuario_id` sale de la sesión. El cliente no puede falsearlos.
- Exportación a CSV/Excel con **neutralización de inyección de fórmulas** (celdas que empiezan por `=`, `+`, `-`, `@`).
- Los errores se **normalizan** y no exponen detalles internos de la base.

## 5. Gestión de sesiones

- **JWT de 1 hora**; **refresh tokens rotados** con revocación por reúso.
- Cierre automático por **inactividad de 8 horas** (cliente y servidor).
- _Cerrar sesión_ revoca los tokens en el servidor y limpia el almacenamiento local.
- **Bloqueo por fuerza bruta:** la cuenta se bloquea **15 minutos** tras **5 intentos fallidos**; además hay rate-limit de login por IP.
- El token se guarda en `localStorage` (patrón estándar de las SPA de Supabase). Riesgo aceptado y mitigado por disciplina anti-XSS + CSP (ver hallazgo M-4).

## 6. Uso de conexiones HTTPS

- En **Supabase Cloud** la API y Auth ya usan HTTPS.
- El **frontend** debe servirse por HTTPS en cualquier host de producción (Vercel/Netlify/Cloudflare lo proveen; con nginx, usar certificado como Let's Encrypt).
- En producción, configurar **Site URL** y **Redirect URLs** con el dominio `https://` real.
- Para cualquier entorno fuera de `localhost`: nunca exponer PostgREST/GoTrue crudos sin TLS.

## 7. Gestión de respaldos

- Ver el [plan de respaldo y recuperación](12_respaldo_recuperacion.md).
- Respaldos regulares de la base (local con `pg_dump`; en cloud, backups gestionados de Supabase) y **verificación periódica de la restauración**.

## 8. Manejo de incidentes

1. **Detección:** monitoreo de logs e intentos de acceso anómalos.
2. **Contención:** deshabilitar usuarios comprometidos; en cloud, **rotar claves** (Settings → API) si una clave se expuso.
3. **Erradicación/recuperación:** restaurar desde respaldo si hubo alteración de datos.
4. **Lecciones aprendidas:** registrar el incidente y ajustar políticas.

## 9. Registro y monitoreo de actividades

- Traza parcial de autoría (`usuario_id`, `created_at`) en ventas, producción, estimaciones y movimientos de cono.
- Registro de intentos de acceso fallidos (`intentos_acceso`).
- **Mejora pendiente (B-4):** tabla de auditoría dedicada para acciones sensibles (cambios de rol, eliminaciones).

## 10. Gestión de vulnerabilidades

- Revisión periódica con `npm audit`; corregir runtime, priorizar sobre devDependencies.
- Revisar las políticas RLS al añadir tablas o funciones nuevas.
- Mantener sincronizada la tabla de permisos de la UI con la base.

## 11. Actualización de dependencias

- Aplicar `npm audit fix` para parches no disruptivos.
- Planificar las actualizaciones mayores (ej. `react-router-dom`) en ramas aparte y probar el enrutado y `RutaProtegida` antes de integrar.
- Mantener fijadas las versiones en `package-lock.json`.

## 12. Reglas sobre secretos

- `.env` **nunca** se versiona (está en `.gitignore`); solo `.env.example`.
- Ninguna variable `VITE_*` contiene secretos (se incrustan en el bundle del navegador).
- Generar secretos propios por entorno en despliegues self-hosted (`openssl rand -base64 48`).
