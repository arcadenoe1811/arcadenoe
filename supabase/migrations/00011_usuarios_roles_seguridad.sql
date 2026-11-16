-- =====================================================================
-- 00011 - Usuarios, roles y endurecimiento de seguridad
--
-- Hasta aqui cualquier usuario autenticado tenia acceso total (politicas
-- `using (true)`). Esta migracion agrega:
--
-- * perfiles:         nombre, rol (admin | operador) y estado de cada
--                     usuario de auth.users. El primer usuario es admin.
-- * Autorizacion:     politicas RLS por rol en TODAS las tablas. La
--                     proteccion real vive aqui, no en la interfaz.
--                     Un usuario deshabilitado pierde el acceso al instante
--                     aunque su token siga vigente.
-- * Gestion:          funciones solo-admin para crear, editar, habilitar /
--                     deshabilitar usuarios y resetear contrasenas. Los
--                     usuarios no se eliminan.
-- * Fuerza bruta:     hook de GoTrue que bloquea la cuenta 15 minutos tras
--                     5 contrasenas incorrectas.
--
-- Permisos:
--                      admin                 operador
--   usuarios           todo                  nada
--   conos              todo                  crear, editar, movimientos
--   catalogo_colores   todo                  crear, editar
--   cuellos / punos    todo                  solo lectura
--
-- Las contrasenas las guarda Supabase Auth con bcrypt (nunca texto plano).
-- =====================================================================

-- Tabla: perfiles -------------------------------------------------------
create table public.perfiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  nombre                   text not null,
  rol                      text not null default 'operador',
  activo                   boolean not null default true,
  debe_cambiar_contrasena  boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz,

  constraint perfiles_rol_valido   check (rol in ('admin', 'operador')),
  constraint perfiles_nombre_largo check (length(btrim(nombre)) between 1 and 80)
);

comment on table  public.perfiles        is 'Rol y estado de cada usuario de auth.users';
comment on column public.perfiles.activo is 'false = deshabilitado: no puede iniciar sesion ni leer datos';
comment on column public.perfiles.debe_cambiar_contrasena
  is 'true = contrasena temporal: debe cambiarla antes de usar el sistema';

create trigger perfiles_updated_at
  before update on public.perfiles
  for each row execute function public.fn_actualizar_updated_at();

-- Intentos fallidos de inicio de sesion (solo lo usa el hook de GoTrue).
create table public.intentos_acceso (
  usuario_id       uuid primary key references auth.users (id) on delete cascade,
  fallidos         integer not null default 0,
  ultimo_fallo     timestamptz,
  bloqueado_hasta  timestamptz
);

comment on table public.intentos_acceso is 'Contador de contrasenas incorrectas por usuario (bloqueo temporal)';

-- Rol del usuario actual ------------------------------------------------
-- null si no hay sesion, si el usuario esta deshabilitado o si todavia
-- debe cambiar su contrasena temporal. SECURITY DEFINER para poder leer
-- perfiles desde las politicas sin recursion.
create or replace function public.fn_rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.perfiles p
  where p.id = (select auth.uid())
    and p.activo
    and not p.debe_cambiar_contrasena;
$$;

create or replace function public.fn_tiene_acceso()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.fn_rol_actual() is not null;
$$;

create or replace function public.fn_es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.fn_rol_actual() = 'admin', false);
$$;

-- Perfil automatico -----------------------------------------------------
-- Cada usuario nuevo de auth.users recibe su perfil. El primero del
-- sistema es admin; los demas, operador (un admin puede cambiarlo).
create or replace function public.fn_crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(
      nullif(btrim(left(new.raw_user_meta_data ->> 'nombre', 80)), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    ),
    case when exists (select 1 from public.perfiles) then 'operador' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger usuarios_crear_perfil
  after insert on auth.users
  for each row execute function public.fn_crear_perfil();

-- Usuarios que ya existian: el mas antiguo queda como admin.
insert into public.perfiles (id, nombre, rol, created_at)
select
  u.id,
  coalesce(
    nullif(btrim(left(u.raw_user_meta_data ->> 'nombre', 80)), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Usuario'
  ),
  case when row_number() over (order by u.created_at, u.id) = 1 then 'admin' else 'operador' end,
  coalesce(u.created_at, now())
from auth.users u
on conflict (id) do nothing;

-- Siempre debe quedar al menos un admin activo --------------------------
-- Se valida en la tabla (no solo en las funciones) para que la regla se
-- cumpla por cualquier camino, incluido SQL directo.
create or replace function public.fn_proteger_ultimo_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.rol = 'admin' and old.activo
     and (tg_op = 'DELETE' or new.rol <> 'admin' or not new.activo) then
    -- Bloquea a los admins activos: dos cambios simultaneos no pueden
    -- dejar el sistema sin administrador.
    perform 1 from public.perfiles p where p.rol = 'admin' and p.activo for update;
    if not exists (
      select 1 from public.perfiles p
      where p.rol = 'admin' and p.activo and p.id <> old.id
    ) then
      raise exception 'Debe existir al menos un administrador activo.'
        using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger_ultimo_admin
  before update or delete on public.perfiles
  for each row execute function public.fn_proteger_ultimo_admin();

-- Validaciones compartidas por las funciones de usuarios ----------------
-- Mismas reglas que packages/shared/usuarios/validaciones.js.
create or replace function public.fn_validar_contrasena(p_contrasena text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_contrasena is null
     or length(p_contrasena) < 8
     or length(p_contrasena) > 72          -- limite de bcrypt
     or p_contrasena !~ '[0-9]'
     or p_contrasena !~ '[A-Z]' then
    raise exception 'La contraseña debe tener entre 8 y 72 caracteres, con al menos un número y una mayúscula.'
      using errcode = 'P0001', hint = 'contrasena';
  end if;
end;
$$;

create or replace function public.fn_exigir_admin_actual()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.fn_es_admin() then
    raise exception 'Solo un administrador puede realizar esta operación.'
      using errcode = '42501';
  end if;
end;
$$;

-- Cierra todas las sesiones de un usuario (invalida sus refresh tokens).
create or replace function public.fn_cerrar_sesiones(p_usuario uuid, p_excepto uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions s
  where s.user_id = p_usuario
    and (p_excepto is null or s.id <> p_excepto);
end;
$$;

-- Gestion de usuarios (solo admin) --------------------------------------
create or replace function public.fn_listar_usuarios()
returns table (
  id uuid,
  nombre text,
  email text,
  rol text,
  activo boolean,
  debe_cambiar_contrasena boolean,
  created_at timestamptz,
  ultimo_acceso timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.fn_exigir_admin_actual();
  return query
    select p.id, p.nombre, u.email::text, p.rol, p.activo, p.debe_cambiar_contrasena,
           p.created_at, u.last_sign_in_at
    from public.perfiles p
    join auth.users u on u.id = p.id
    order by p.activo desc, lower(p.nombre), u.email;
end;
$$;

-- Normaliza y valida nombre, correo y rol; devuelve los valores limpios.
create or replace function public.fn_validar_datos_usuario(
  p_nombre text, p_email text, p_rol text,
  out v_nombre text, out v_email text
)
language plpgsql
immutable
set search_path = ''
as $$
begin
  v_nombre := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_email  := lower(btrim(coalesce(p_email, '')));

  if length(v_nombre) < 1 or length(v_nombre) > 80 then
    raise exception 'Escribe el nombre (máximo 80 caracteres).'
      using errcode = 'P0001', hint = 'nombre';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'El correo no es válido.'
      using errcode = 'P0001', hint = 'email';
  end if;
  if p_rol is null or p_rol not in ('admin', 'operador') then
    raise exception 'Elige un rol válido.'
      using errcode = 'P0001', hint = 'rol';
  end if;
end;
$$;

-- Crea un usuario con contrasena temporal: debera cambiarla al entrar.
create or replace function public.fn_crear_usuario(
  p_nombre text, p_email text, p_contrasena text, p_rol text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id     uuid := gen_random_uuid();
  v_nombre text;
  v_email  text;
begin
  perform public.fn_exigir_admin_actual();
  select d.v_nombre, d.v_email into v_nombre, v_email
  from public.fn_validar_datos_usuario(p_nombre, p_email, p_rol) d;
  perform public.fn_validar_contrasena(p_contrasena);

  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Ya existe un usuario con ese correo.'
      using errcode = 'P0001', hint = 'email';
  end if;

  -- Los campos *_token y email_change deben ser '' y no NULL (GoTrue).
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    extensions.crypt(p_contrasena, extensions.gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', v_nombre),
    'authenticated',
    'authenticated',
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    now(), now(), now()
  );

  -- El trigger usuarios_crear_perfil ya creo el perfil; aqui se completa.
  update public.perfiles
  set nombre = v_nombre, rol = p_rol, debe_cambiar_contrasena = true
  where id = v_id;

  return v_id;
end;
$$;

create or replace function public.fn_actualizar_usuario(
  p_id uuid, p_nombre text, p_email text, p_rol text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text;
  v_email  text;
  v_rol    text;
begin
  perform public.fn_exigir_admin_actual();
  select d.v_nombre, d.v_email into v_nombre, v_email
  from public.fn_validar_datos_usuario(p_nombre, p_email, p_rol) d;

  select p.rol into v_rol from public.perfiles p where p.id = p_id for update;
  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;
  if p_id = auth.uid() and p_rol <> v_rol then
    raise exception 'No puedes cambiar tu propio rol.'
      using errcode = 'P0001', hint = 'rol';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email and u.id <> p_id) then
    raise exception 'Ya existe un usuario con ese correo.'
      using errcode = 'P0001', hint = 'email';
  end if;

  update auth.users u set
    email              = v_email,
    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                         || jsonb_build_object('nombre', v_nombre),
    updated_at         = now()
  where u.id = p_id;

  update auth.identities i set
    identity_data = coalesce(i.identity_data, '{}'::jsonb)
                    || jsonb_build_object('email', v_email),
    updated_at    = now()
  where i.user_id = p_id and i.provider = 'email';

  -- perfiles_proteger_ultimo_admin impide quitar el rol al ultimo admin.
  update public.perfiles set nombre = v_nombre, rol = p_rol where id = p_id;
end;
$$;

-- Deshabilita o habilita. Deshabilitar: no puede iniciar sesion
-- (banned_until), se cierran sus sesiones y RLS deja de darle datos.
create or replace function public.fn_cambiar_estado_usuario(p_id uuid, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fn_exigir_admin_actual();
  if p_activo is null then
    raise exception 'Indica el estado.' using errcode = 'P0001';
  end if;
  if p_id = auth.uid() then
    raise exception 'No puedes deshabilitar tu propio usuario.' using errcode = 'P0001';
  end if;

  update public.perfiles set activo = p_activo where id = p_id;
  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  update auth.users u set
    banned_until = case when p_activo then null else now() + interval '100 years' end,
    updated_at   = now()
  where u.id = p_id;

  if p_activo then
    delete from public.intentos_acceso where usuario_id = p_id;
  else
    perform public.fn_cerrar_sesiones(p_id);
  end if;
end;
$$;

-- El admin fija una contrasena temporal: se cierran las sesiones del
-- usuario y debera cambiarla al volver a entrar.
create or replace function public.fn_resetear_contrasena(p_id uuid, p_contrasena text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fn_exigir_admin_actual();
  if p_id = auth.uid() then
    raise exception 'Para tu propia contraseña usa "Cambiar contraseña".'
      using errcode = 'P0001';
  end if;
  perform public.fn_validar_contrasena(p_contrasena);

  update auth.users u set
    encrypted_password = extensions.crypt(p_contrasena, extensions.gen_salt('bf', 10)),
    updated_at         = now()
  where u.id = p_id;
  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  update public.perfiles set debe_cambiar_contrasena = true where id = p_id;
  delete from public.intentos_acceso where usuario_id = p_id;
  perform public.fn_cerrar_sesiones(p_id);
end;
$$;

-- Cualquier usuario activo cambia su propia contrasena. Pide la actual
-- (una sesion robada no basta para apropiarse de la cuenta) y cierra las
-- demas sesiones del usuario.
create or replace function public.fn_cambiar_mi_contrasena(p_actual text, p_nueva text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id     uuid := auth.uid();
  v_hash   text;
  v_sesion uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
begin
  if v_id is null
     or not exists (select 1 from public.perfiles p where p.id = v_id and p.activo) then
    raise exception 'No hay permisos para esta operación.' using errcode = '42501';
  end if;

  select u.encrypted_password into v_hash from auth.users u where u.id = v_id for update;
  if v_hash is null or p_actual is null
     or v_hash <> extensions.crypt(p_actual, v_hash) then
    raise exception 'La contraseña actual no es correcta.'
      using errcode = 'P0001', hint = 'actual';
  end if;

  perform public.fn_validar_contrasena(p_nueva);
  if p_nueva = p_actual then
    raise exception 'La contraseña nueva debe ser distinta de la actual.'
      using errcode = 'P0001', hint = 'contrasena';
  end if;

  update auth.users u set
    encrypted_password = extensions.crypt(p_nueva, extensions.gen_salt('bf', 10)),
    updated_at         = now()
  where u.id = v_id;

  update public.perfiles set debe_cambiar_contrasena = false where id = v_id;
  if v_sesion is not null then
    perform public.fn_cerrar_sesiones(v_id, v_sesion);
  end if;
end;
$$;

-- Bloqueo por fuerza bruta ----------------------------------------------
-- Hook "password verification attempt" de GoTrue (se activa en
-- config.toml / docker-compose.yml). GoTrue lo llama en cada intento con
-- { user_id, valid }. Tras 5 contrasenas incorrectas seguidas la cuenta
-- queda bloqueada 15 minutos, incluso si luego se escribe la correcta.
create or replace function public.fn_hook_intento_contrasena(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_maximo  constant integer  := 5;
  c_bloqueo constant interval := interval '15 minutes';
  v_id      uuid    := (event ->> 'user_id')::uuid;
  v_valida  boolean := coalesce((event ->> 'valid')::boolean, false);
  v_fila    public.intentos_acceso;
  v_fallos  integer;
begin
  select * into v_fila from public.intentos_acceso i where i.usuario_id = v_id for update;

  if v_fila.bloqueado_hasta is not null and v_fila.bloqueado_hasta > now() then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 429,
        'message', 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.'
      )
    );
  end if;

  if v_valida then
    delete from public.intentos_acceso i where i.usuario_id = v_id;
    return jsonb_build_object('decision', 'continue');
  end if;

  insert into public.intentos_acceso as i (usuario_id, fallidos, ultimo_fallo)
  values (v_id, 1, now())
  on conflict (usuario_id) do update set
    -- Los fallos viejos (o de un bloqueo ya cumplido) no cuentan.
    fallidos        = case when i.bloqueado_hasta is not null
                             or i.ultimo_fallo < now() - c_bloqueo
                           then 1 else i.fallidos + 1 end,
    ultimo_fallo    = now(),
    bloqueado_hasta = null
  returning i.fallidos into v_fallos;

  if v_fallos >= c_maximo then
    update public.intentos_acceso i
    set bloqueado_hasta = now() + c_bloqueo
    where i.usuario_id = v_id;
  end if;

  return jsonb_build_object('decision', 'continue');
end;
$$;

-- Autorizacion por rol (RLS) --------------------------------------------
alter table public.perfiles        enable row level security;
alter table public.intentos_acceso enable row level security;

drop policy if exists usuario_autenticado_cuellos               on public.cuellos;
drop policy if exists usuario_autenticado_colores_cuello        on public.colores_cuello;
drop policy if exists usuario_autenticado_catalogo_colores      on public.catalogo_colores;
drop policy if exists usuario_autenticado_tipos_cuello          on public.tipos_cuello;
drop policy if exists usuario_autenticado_conos                 on public.conos;
drop policy if exists usuario_autenticado_leer_movimientos      on public.movimientos_cono;
drop policy if exists usuario_autenticado_registrar_movimientos on public.movimientos_cono;

-- `(select fn())` hace que Postgres evalue la funcion una vez por
-- consulta y no una vez por fila.

-- Cuellos / punos y sus tablas: todos leen, solo el admin escribe.
create policy lectura_cuellos on public.cuellos
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_escribe_cuellos on public.cuellos
  for all to authenticated
  using ((select public.fn_es_admin())) with check ((select public.fn_es_admin()));

create policy lectura_colores_cuello on public.colores_cuello
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_escribe_colores_cuello on public.colores_cuello
  for all to authenticated
  using ((select public.fn_es_admin())) with check ((select public.fn_es_admin()));

create policy lectura_tipos_cuello on public.tipos_cuello
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_escribe_tipos_cuello on public.tipos_cuello
  for all to authenticated
  using ((select public.fn_es_admin())) with check ((select public.fn_es_admin()));

-- Catalogo de colores: todos crean y editan, solo el admin elimina.
create policy lectura_catalogo_colores on public.catalogo_colores
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy crear_catalogo_colores on public.catalogo_colores
  for insert to authenticated with check ((select public.fn_tiene_acceso()));
create policy editar_catalogo_colores on public.catalogo_colores
  for update to authenticated
  using ((select public.fn_tiene_acceso())) with check ((select public.fn_tiene_acceso()));
create policy admin_elimina_catalogo_colores on public.catalogo_colores
  for delete to authenticated using ((select public.fn_es_admin()));

-- Conos: todos crean y editan, solo el admin elimina.
create policy lectura_conos on public.conos
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy crear_conos on public.conos
  for insert to authenticated with check ((select public.fn_tiene_acceso()));
create policy editar_conos on public.conos
  for update to authenticated
  using ((select public.fn_tiene_acceso())) with check ((select public.fn_tiene_acceso()));
create policy admin_elimina_conos on public.conos
  for delete to authenticated using ((select public.fn_es_admin()));

-- Movimientos: se leen y se registran (nunca se editan ni se borran), y
-- solo a nombre propio: usuario_id no se puede falsificar.
create policy lectura_movimientos on public.movimientos_cono
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy registrar_movimientos on public.movimientos_cono
  for insert to authenticated
  with check ((select public.fn_tiene_acceso()) and usuario_id = (select auth.uid()));

-- Perfiles: cada quien ve el suyo; el admin ve todos. Nadie escribe
-- directo: solo las funciones fn_*_usuario.
create policy lectura_perfil_propio on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.fn_es_admin()));

-- intentos_acceso no tiene politicas: nadie lo lee por la API.

-- Respuesta 403 explicita -----------------------------------------------
-- Con RLS, un UPDATE o DELETE sin permiso no falla: simplemente no afecta
-- filas. Estos triggers hacen que la API responda 403 (codigo 42501) en
-- vez de un "ok" silencioso. Solo aplican a peticiones de la API
-- (rol authenticated); las semillas y el SQL de mantenimiento no pasan
-- por aqui.
create or replace function public.fn_exigir_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.fn_es_admin() then
    raise exception 'Solo un administrador puede realizar esta operación.'
      using errcode = '42501';
  end if;
  return null;
end;
$$;

create trigger cuellos_solo_admin
  before insert or update or delete on public.cuellos
  for each statement execute function public.fn_exigir_admin();
create trigger colores_cuello_solo_admin
  before insert or update or delete on public.colores_cuello
  for each statement execute function public.fn_exigir_admin();
create trigger tipos_cuello_solo_admin
  before insert or update or delete on public.tipos_cuello
  for each statement execute function public.fn_exigir_admin();
create trigger catalogo_colores_eliminar_solo_admin
  before delete on public.catalogo_colores
  for each statement execute function public.fn_exigir_admin();
create trigger conos_eliminar_solo_admin
  before delete on public.conos
  for each statement execute function public.fn_exigir_admin();

-- Lo mismo para las tablas donde el operador si escribe: un usuario
-- deshabilitado (o con la contrasena temporal sin cambiar) cuyo token aun
-- no vence recibe 403 en vez de un error confuso.
create or replace function public.fn_exigir_acceso()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.fn_tiene_acceso() then
    raise exception 'Tu usuario no tiene acceso a esta operación.'
      using errcode = '42501';
  end if;
  return null;
end;
$$;

create trigger conos_exigir_acceso
  before insert or update on public.conos
  for each statement execute function public.fn_exigir_acceso();
create trigger movimientos_cono_exigir_acceso
  before insert on public.movimientos_cono
  for each statement execute function public.fn_exigir_acceso();
create trigger catalogo_colores_exigir_acceso
  before insert or update on public.catalogo_colores
  for each statement execute function public.fn_exigir_acceso();

-- Desactivar un cono lo saca del muestrario: es una baja, asi que tambien
-- queda reservado al admin.
create or replace function public.fn_proteger_activo_cono()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.activo is distinct from old.activo
     and current_user in ('authenticated', 'anon')
     and not public.fn_es_admin() then
    raise exception 'Solo un administrador puede desactivar o reactivar un cono.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger conos_proteger_activo
  before update of activo on public.conos
  for each row execute function public.fn_proteger_activo_cono();

-- Privilegios -----------------------------------------------------------
revoke all on public.perfiles, public.intentos_acceso from anon, authenticated, public;
grant select on public.perfiles to authenticated;

-- Explicitos (no depender de los privilegios por defecto del stack).
grant select, insert, update, delete on public.conos to authenticated;
grant select, insert on public.movimientos_cono to authenticated;

revoke execute on function
  public.fn_rol_actual(),
  public.fn_tiene_acceso(),
  public.fn_es_admin(),
  public.fn_crear_perfil(),
  public.fn_proteger_ultimo_admin(),
  public.fn_validar_contrasena(text),
  public.fn_exigir_admin_actual(),
  public.fn_cerrar_sesiones(uuid, uuid),
  public.fn_listar_usuarios(),
  public.fn_validar_datos_usuario(text, text, text),
  public.fn_crear_usuario(text, text, text, text),
  public.fn_actualizar_usuario(uuid, text, text, text),
  public.fn_cambiar_estado_usuario(uuid, boolean),
  public.fn_resetear_contrasena(uuid, text),
  public.fn_cambiar_mi_contrasena(text, text),
  public.fn_hook_intento_contrasena(jsonb),
  public.fn_exigir_admin(),
  public.fn_exigir_acceso(),
  public.fn_proteger_activo_cono()
from anon, authenticated, public;

-- Lo que la app puede llamar. Las funciones de gestion verifican por
-- dentro que quien llama sea admin (un operador recibe 403).
grant execute on function
  public.fn_rol_actual(),
  public.fn_tiene_acceso(),
  public.fn_es_admin(),
  public.fn_exigir_admin_actual(),
  public.fn_validar_contrasena(text),
  public.fn_validar_datos_usuario(text, text, text),
  public.fn_listar_usuarios(),
  public.fn_crear_usuario(text, text, text, text),
  public.fn_actualizar_usuario(uuid, text, text, text),
  public.fn_cambiar_estado_usuario(uuid, boolean),
  public.fn_resetear_contrasena(uuid, text),
  public.fn_cambiar_mi_contrasena(text, text),
  public.fn_exigir_admin(),
  public.fn_exigir_acceso(),
  public.fn_proteger_activo_cono()
to authenticated;

-- GoTrue ejecuta el hook con su propio rol.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.fn_hook_intento_contrasena(jsonb) to supabase_auth_admin;

notify pgrst, 'reload schema';
