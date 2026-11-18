# 12 — Plan de respaldo y recuperación

**Sistema:** Inventario de Cuellos (Arca de Noé)
**Versión del documento:** 1.0
**Fecha:** 2026-11-17

---

## 1. Objetivo del plan

Definir cómo recuperar el sistema y sus datos ante fallos, errores, ataques o pérdida de
información, con tiempos y responsabilidades claros.

## 2. Información que debe respaldarse

| Elemento | Dónde vive | Prioridad |
| --- | --- | --- |
| **Base de datos PostgreSQL** (datos y esquema) | Supabase (local o cloud) | Crítica |
| **Migraciones SQL** (`supabase/migrations/`) | Repositorio git | Crítica (ya versionada) |
| **Código fuente** | Repositorio git | Crítica (ya versionado) |
| **Variables de entorno** (`.env`) | Fuera de git | Alta (guardar en gestor de secretos) |
| **Imágenes** | Hosts externos (ImgBB, Drive…) | Media (son enlaces, no archivos propios) |

> El código y las migraciones ya están respaldados por **git**. El plan se centra en los
> **datos** de la base, que no están en el repositorio.

## 3. Frecuencia de los respaldos

| Entorno | Estrategia | Frecuencia |
| --- | --- | --- |
| **Supabase Cloud** | Backups automáticos gestionados por Supabase (según el plan contratado). | Diaria (automática) |
| **Local / self-hosted** | `pg_dump` manual o programado. | Diaria o antes de cada cambio importante |

## 4. Ubicación de almacenamiento

- **Cloud:** backups gestionados por Supabase + una copia descargada periódica fuera de la plataforma.
- **Local:** carpeta de respaldos **fuera del repositorio** y, de ser posible, en un medio/ubicación distinta (regla 3-2-1: 3 copias, 2 medios, 1 fuera de sitio).

## 5. Responsables

| Rol | Responsabilidad |
| --- | --- |
| Administrador del sistema | Ejecutar/verificar respaldos y restauraciones. |
| Responsable técnico | Mantener los scripts y la configuración de backups de Supabase. |

## 6. Procedimiento de respaldo

### Local (Docker)

```bash
# Respaldo completo de la base
docker compose exec -T db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U postgres -d postgres' \
  > respaldos/inventario_$(date +%F).sql
```

### Supabase Cloud

- Descargar el backup desde el panel (Database → Backups) o usar `pg_dump` contra la
  cadena de conexión del proyecto. Conservar una copia fuera de Supabase.

## 7. Procedimiento de recuperación

### Local (Docker)

```bash
# Restaurar en una base limpia
docker compose exec -T db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d postgres -v ON_ERROR_STOP=1' \
  < respaldos/inventario_2026-11-17.sql
docker compose up -d
```

### Supabase Cloud

- Restaurar desde el panel (Point-in-Time Recovery o restauración de backup, según el plan)
  o reaplicar las migraciones (`npx supabase db push`) y recargar los datos desde el dump.

## 8. Verificación de integridad

- Tras cada respaldo, comprobar que el archivo no esté vacío y que abra sin errores.
- Verificar conteos clave (número de cuellos, conos, ventas, usuarios) antes y después.
- Confirmar que las **migraciones** aplicadas coinciden con las esperadas.

## 9. Pruebas de restauración

- Restaurar el último respaldo en un **entorno de prueba** al menos una vez al mes.
- Validar el inicio de sesión del admin y una consulta por módulo.
- Documentar el resultado (ver [informe de pruebas](../05_PRUEBAS/14_informe_pruebas.md)).

## 10. Objetivos de recuperación

| Métrica | Valor objetivo | Justificación |
| --- | --- | --- |
| **RTO** (Tiempo objetivo de recuperación) | ≤ 4 horas | Un taller puede operar en papel unas horas mientras se restaura. |
| **RPO** (Punto objetivo de recuperación) | ≤ 24 horas | Con respaldo diario, la pérdida máxima es de un día de registros. |

> Ajuste RTO/RPO según la criticidad real para el negocio; si se requiere RPO menor,
> aumentar la frecuencia de respaldo o usar Point-in-Time Recovery de Supabase.

## 11. Escenario especial: olvido de contraseña del único admin

No requiere restaurar la base. Ver el procedimiento SQL en el
[manual de administrador](../03_MANUALES/09_manual_administrador.md#9-procedimientos-de-mantenimiento).
