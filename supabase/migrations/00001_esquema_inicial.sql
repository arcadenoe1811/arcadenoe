-- =====================================================================
-- 00001 - Esquema inicial del inventario de cuellos
-- =====================================================================

-- Extensiones -----------------------------------------------------------
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- unaccent() no es IMMUTABLE, por eso no sirve para indices.
-- Este envoltorio fija el diccionario, pasa a minusculas y si puede
-- usarse en indices.
create or replace function public.f_sin_acentos(texto text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto));
$$;

-- Enums -----------------------------------------------------------------
create type public.tipo_cuello as enum ('liso', 'tubular', 'gaspeado', 'otro');
create type public.zona_color  as enum ('tubular', 'cuerpo', 'borde', 'otro');

-- Tabla: cuellos --------------------------------------------------------
create table public.cuellos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,
  nombre            text,
  tipo              public.tipo_cuello not null,
  cantidad_hilos    smallint,
  posicion_cuerpo   smallint,
  posicion_tubular  smallint,
  pasadas_tubular   smallint,
  medidas           smallint[],
  notas             text,
  imagen_url        text,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,

  constraint cuellos_codigo_formato
    check (codigo = lower(btrim(codigo)) and length(codigo) between 1 and 40),
  constraint cuellos_cantidad_hilos_rango   check (cantidad_hilos   is null or cantidad_hilos   between 1 and 99),
  constraint cuellos_posicion_cuerpo_rango  check (posicion_cuerpo  is null or posicion_cuerpo  between 0 and 999),
  constraint cuellos_posicion_tubular_rango check (posicion_tubular is null or posicion_tubular between 0 and 999),
  constraint cuellos_pasadas_tubular_rango  check (pasadas_tubular  is null or pasadas_tubular  between 0 and 999),
  constraint cuellos_medidas_sin_nulos
    check (medidas is null or array_position(medidas, null) is null),
  constraint cuellos_imagen_url_http
    check (imagen_url is null or imagen_url ~* '^https?://')
);

comment on table  public.cuellos            is 'Cuellos tejidos en la maquina tejedora';
comment on column public.cuellos.codigo     is 'Codigo unico de la empresa (ej: maza4, maz4t5, cous)';
comment on column public.cuellos.medidas    is 'Medidas compatibles, ej: {18,17,16,15,14}';
comment on column public.cuellos.imagen_url is 'URL externa de la imagen (no se usa Supabase Storage)';

-- Tabla: colores_cuello -------------------------------------------------
create table public.colores_cuello (
  id              uuid primary key default gen_random_uuid(),
  cuello_id       uuid not null references public.cuellos (id) on delete cascade,
  zona            public.zona_color not null,
  color           text not null check (length(btrim(color)) > 0),
  cantidad_hilos  smallint check (cantidad_hilos is null or cantidad_hilos between 1 and 99),
  orden           smallint check (orden is null or orden between 0 and 999)
);

create index colores_cuello_cuello_id_idx on public.colores_cuello (cuello_id, zona, orden);

-- Tabla: catalogo_colores -----------------------------------------------
create table public.catalogo_colores (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique check (nombre = lower(btrim(nombre)) and length(nombre) > 0),
  hex     text check (hex is null or hex ~ '^#[0-9a-fA-F]{6}$')
);

-- Trigger updated_at ----------------------------------------------------
create or replace function public.fn_actualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger cuellos_updated_at
  before update on public.cuellos
  for each row execute function public.fn_actualizar_updated_at();

-- Indices de busqueda (trigramas sobre texto sin acentos) ---------------
create index cuellos_codigo_trgm_idx       on public.cuellos        using gin (public.f_sin_acentos(codigo) extensions.gin_trgm_ops);
create index cuellos_nombre_trgm_idx       on public.cuellos        using gin (public.f_sin_acentos(nombre) extensions.gin_trgm_ops);
create index cuellos_notas_trgm_idx        on public.cuellos        using gin (public.f_sin_acentos(notas)  extensions.gin_trgm_ops);
create index colores_cuello_color_trgm_idx on public.colores_cuello using gin (public.f_sin_acentos(color)  extensions.gin_trgm_ops);
create index cuellos_medidas_idx           on public.cuellos        using gin (medidas);
create index cuellos_tipo_idx              on public.cuellos (tipo) where activo;

-- Busqueda --------------------------------------------------------------
-- Busca por codigo parcial, nombre, notas y colores, sin distinguir
-- mayusculas ni acentos. Devuelve filas de cuellos para que PostgREST
-- pueda aplicar filtros extra (tipo, medidas) sobre el resultado.
create or replace function public.fn_buscar_cuellos(termino text)
returns setof public.cuellos
language sql
stable
set search_path = public, extensions
as $$
  with t as (
    select public.f_sin_acentos(btrim(coalesce(termino, ''))) as q
  ),
  p as (
    -- escapar los comodines de LIKE que escriba el usuario
    select q,
           '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%' as patron
    from t
  )
  select c.*
  from public.cuellos c, p
  where c.activo
    and (
      p.q = ''
      or public.f_sin_acentos(c.codigo) ilike p.patron
      or public.f_sin_acentos(c.nombre) ilike p.patron
      or public.f_sin_acentos(c.notas)  ilike p.patron
      or exists (
        select 1 from public.colores_cuello cc
        where cc.cuello_id = c.id
          and public.f_sin_acentos(cc.color) ilike p.patron
      )
    )
  order by
    (public.f_sin_acentos(c.codigo) = p.q) desc,
    starts_with(public.f_sin_acentos(c.codigo), p.q) desc,
    c.codigo;
$$;

-- Guardar cuello + colores en una sola transaccion ----------------------
-- p_cuello:  objeto con los campos del cuello (incluye "id" para editar).
-- p_colores: arreglo de colores; reemplaza todos los existentes.
create or replace function public.fn_guardar_cuello(p_cuello jsonb, p_colores jsonb default '[]'::jsonb)
returns public.cuellos
language plpgsql
set search_path = public, extensions
as $$
declare
  v_id     uuid := nullif(p_cuello ->> 'id', '')::uuid;
  v_datos  public.cuellos;
  v_cuello public.cuellos;
begin
  v_datos := jsonb_populate_record(null::public.cuellos, p_cuello);

  if v_id is null then
    insert into public.cuellos (
      codigo, nombre, tipo, cantidad_hilos, posicion_cuerpo, posicion_tubular,
      pasadas_tubular, medidas, notas, imagen_url, activo
    ) values (
      v_datos.codigo, v_datos.nombre, v_datos.tipo, v_datos.cantidad_hilos,
      v_datos.posicion_cuerpo, v_datos.posicion_tubular, v_datos.pasadas_tubular,
      v_datos.medidas, v_datos.notas, v_datos.imagen_url, coalesce(v_datos.activo, true)
    )
    returning * into v_cuello;
  else
    update public.cuellos set
      codigo           = v_datos.codigo,
      nombre           = v_datos.nombre,
      tipo             = v_datos.tipo,
      cantidad_hilos   = v_datos.cantidad_hilos,
      posicion_cuerpo  = v_datos.posicion_cuerpo,
      posicion_tubular = v_datos.posicion_tubular,
      pasadas_tubular  = v_datos.pasadas_tubular,
      medidas          = v_datos.medidas,
      notas            = v_datos.notas,
      imagen_url       = v_datos.imagen_url,
      activo           = coalesce(v_datos.activo, cuellos.activo)
    where cuellos.id = v_id
    returning * into v_cuello;

    if not found then
      raise exception 'Cuello no encontrado' using errcode = 'P0002';
    end if;

    delete from public.colores_cuello where cuello_id = v_id;
  end if;

  insert into public.colores_cuello (cuello_id, zona, color, cantidad_hilos, orden)
  select v_cuello.id, x.zona, btrim(x.color), x.cantidad_hilos, x.orden
  from jsonb_populate_recordset(null::public.colores_cuello, coalesce(p_colores, '[]'::jsonb)) x;

  return v_cuello;
end;
$$;

-- Acceso ----------------------------------------------------------------
-- Sistema personal de un solo usuario en local: el rol anon tiene acceso
-- completo. ANTES de desplegar en un proyecto Supabase publico, cambia
-- estas politicas para exigir un usuario autenticado.
alter table public.cuellos          enable row level security;
alter table public.colores_cuello   enable row level security;
alter table public.catalogo_colores enable row level security;

create policy acceso_total_cuellos          on public.cuellos          for all to anon, authenticated using (true) with check (true);
create policy acceso_total_colores_cuello   on public.colores_cuello   for all to anon, authenticated using (true) with check (true);
create policy acceso_total_catalogo_colores on public.catalogo_colores for all to anon, authenticated using (true) with check (true);

grant usage on schema public     to anon, authenticated;
grant usage on schema extensions to anon, authenticated;
grant select, insert, update, delete
  on public.cuellos, public.colores_cuello, public.catalogo_colores
  to anon, authenticated;
grant execute on function public.f_sin_acentos(text)             to anon, authenticated;
grant execute on function public.fn_buscar_cuellos(text)         to anon, authenticated;
grant execute on function public.fn_guardar_cuello(jsonb, jsonb) to anon, authenticated;
