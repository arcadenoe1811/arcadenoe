# 15 — Manual de instalación y despliegue

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

> Guía resumida. La referencia de puesta en marcha más detallada es el
> [`README.md`](../../README.md) del repositorio.

---

## 1. Requisitos de hardware

- Equipo capaz de ejecutar Docker Desktop (4 GB de RAM mínimos recomendados; 8 GB holgado).
- ~2 GB libres para las imágenes de Supabase.

## 2. Requisitos de software

- **Node.js 20 o superior.**
- **Docker Desktop en ejecución** (para el stack local).
- Navegador moderno (Chrome/Edge/Firefox/Safari).

> **Nota:** se detectó que **Node.js 25 + Vitest 4** impide ejecutar la suite de pruebas
> (ver [informe de pruebas](../05_PRUEBAS/14_informe_pruebas.md)). Use **Node 20 LTS** para
> desarrollo y pruebas.

## 3. Versiones de tecnologías

React 18.3 · React Router 6.28 · Vite 6 · `@supabase/supabase-js` 2.45+ · PostgreSQL 15 ·
Vitest 4 · ESLint 9 · Prettier 3 · Supabase CLI 2.

## 4. Instalación de dependencias

```bash
git clone <url-del-repositorio>
cd arcadenoe
npm install          # instala todos los workspaces
```

## 5. Configuración de variables de entorno

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

Variables mínimas:

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<llave-anonima-local>
VITE_SESION_INACTIVIDAD_MINUTOS=480
# Solo para docker-compose local:
POSTGRES_PASSWORD=<clave-local>
JWT_SECRET=<secreto-de-32+-caracteres>
```

> Nunca versione `.env`. Ninguna `VITE_*` debe contener secretos (se incrustan en el bundle).

## 6. Configuración de la base de datos y 7. Migraciones

Elija **una** opción de entorno local:

### Opción A — Todo en Docker (web + API + BD)

```bash
npm run docker:iniciar      # docker compose up -d --build
```

| Capa            | URL                    |
| --------------- | ---------------------- |
| Frontend (Vite) | http://localhost:5173  |
| API (PostgREST) | http://localhost:54321 |
| PostgreSQL      | localhost:54322        |

Las migraciones `00001`–`00015` se aplican automáticamente con el volumen vacío. Para
empezar de cero: `docker compose down -v`.

### Opción B — Supabase CLI + Vite

```bash
npm run db:iniciar          # supabase start (aplica migraciones y semillas)
npm run db:estado           # copie la "anon key" a VITE_SUPABASE_ANON_KEY en .env
npm run dev                 # http://localhost:5173
```

### Aplicar una migración nueva a una base con datos

- **CLI:** `npx supabase migration up`.
- **Docker:** aplicar a mano como `supabase_admin` y recrear servicios:
  ```bash
  docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -h localhost -d postgres -v ON_ERROR_STOP=1' < supabase/migrations/00015_restringir_modulos_operador.sql
  docker compose up -d
  ```

## 8. Usuario inicial

Tras `supabase start` (Opción B) o el servicio `semilla-usuario` (Opción A) existe el admin
de desarrollo: `admin@inventario.local` / `admin1234`. **Cámbielo** fuera de `localhost`.

## 9. Compilación del frontend

```bash
npm run build --workspace=apps/web     # genera apps/web/dist
```

## 10. Inicio del backend

En local el backend es Supabase (Docker/CLI). En producción es **Supabase Cloud** (no se
despliega backend propio).

## 11-13. Despliegue a producción (Supabase Cloud)

Sigue el [plan de remediación](../../recomendacion.md). Resumen:

1. Crear el proyecto en **Supabase Cloud**; copiar _Project URL_ y _anon key_ al `.env` de producción. **No** copiar la _service_role key_ al frontend.
2. Subir migraciones: `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. Crear el admin real desde el panel con contraseña fuerte; marcar `debe_cambiar_contrasena = true`. **No** ejecutar `seed_usuario.sql` en cloud.
4. En Auth → URL Configuration: **Site URL** y **Redirect URLs** con el dominio `https://` real.
5. `npm run build` y desplegar `dist/` en un host estático con **HTTPS** (Vercel/Netlify/Cloudflare/nginx).
6. Configurar **cabeceras de seguridad + CSP** en el host del frontend (ver M-2 de la auditoría).

## 14. Verificación del funcionamiento

- Abrir la URL y confirmar la pantalla de login.
- Iniciar sesión como admin, cambiar la contraseña temporal.
- Crear un cono, registrar una entrada y verificar el stock.
- Registrar una venta y confirmar que aparece como pendiente de producir.

## Comandos útiles

| Comando                                                                       | Qué hace                          |
| ----------------------------------------------------------------------------- | --------------------------------- |
| `npm run dev`                                                                 | Dev server de la web.             |
| `npm run build`                                                               | Build de producción.              |
| `npm run db:iniciar` / `db:detener` / `db:estado` / `db:reiniciar`            | Supabase local (CLI).             |
| `npm run docker:iniciar` / `docker:detener` / `docker:estado` / `docker:logs` | Stack Docker completo.            |
| `npm run ci`                                                                  | lint + formato + build + pruebas. |
