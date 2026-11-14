-- =====================================================================
-- 00003 - Tipos de cuello editables y posiciones del cuerpo por color
-- =====================================================================
-- 1) El tipo deja de ser un enum fijo: pasa a una tabla catalogo
--    (tipos_cuello) para poder agregar tipos nuevos desde la app.
-- 2) posicion_cuerpo (un solo numero) se reemplaza por posiciones_cuerpo:
--    una posicion por color del cuerpo, marcando si ese color es letra.
--    Formato: [{"posicion": 12, "letra": false}, {"posicion": 14, "letra": true}]

-- Catalogo de tipos -----------------------------------------------------
create table public.tipos_cuello (
  nombre text primary key
    check (nombre = lower(btrim(nombre)) and length(nombre) between 1 and 40)
);

comment on table public.tipos_cuello is 'Tipos de cuello disponibles (liso, tubular, ...)';

insert into public.tipos_cuello (nombre) values
  ('liso'), ('tubular'), ('gaspeado'), ('otro')
on conflict (nombre) do nothing;

alter table public.cuellos
  alter column tipo type text using tipo::text;

alter table public.cuellos
  add constraint cuellos_tipo_fkey
  foreign key (tipo) references public.tipos_cuello (nombre) on update cascade;

drop type public.tipo_cuello;

-- Posiciones del cuerpo por color ---------------------------------------
alter table public.cuellos
  add column posiciones_cuerpo jsonb not null default '[]'::jsonb;

alter table public.cuellos
  add constraint cuellos_posiciones_cuerpo_arreglo
  check (
    jsonb_typeof(posiciones_cuerpo) = 'array'
    and jsonb_array_length(posiciones_cuerpo) <= 30
  );

comment on column public.cuellos.posiciones_cuerpo is
  'Una posicion por color del cuerpo: [{"posicion": 12, "letra": false}, ...]';

update public.cuellos
set posiciones_cuerpo = jsonb_build_array(
  jsonb_build_object('posicion', posicion_cuerpo, 'letra', false)
)
where posicion_cuerpo is not null;

alter table public.cuellos drop column posicion_cuerpo;

-- Guardar cuello (nuevas columnas) --------------------------------------
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
      codigo, nombre, tipo, cantidad_hilos, posiciones_cuerpo, posicion_tubular,
      pasadas_tubular, medidas, notas, imagen_url, activo
    ) values (
      v_datos.codigo, v_datos.nombre, v_datos.tipo, v_datos.cantidad_hilos,
      coalesce(v_datos.posiciones_cuerpo, '[]'::jsonb), v_datos.posicion_tubular,
      v_datos.pasadas_tubular, v_datos.medidas, v_datos.notas, v_datos.imagen_url,
      coalesce(v_datos.activo, true)
    )
    returning * into v_cuello;
  else
    update public.cuellos set
      codigo            = v_datos.codigo,
      nombre            = v_datos.nombre,
      tipo              = v_datos.tipo,
      cantidad_hilos    = v_datos.cantidad_hilos,
      posiciones_cuerpo = coalesce(v_datos.posiciones_cuerpo, '[]'::jsonb),
      posicion_tubular  = v_datos.posicion_tubular,
      pasadas_tubular   = v_datos.pasadas_tubular,
      medidas           = v_datos.medidas,
      notas             = v_datos.notas,
      imagen_url        = v_datos.imagen_url,
      activo            = coalesce(v_datos.activo, cuellos.activo)
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
alter table public.tipos_cuello enable row level security;

create policy usuario_autenticado_tipos_cuello
  on public.tipos_cuello for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.tipos_cuello to authenticated;
revoke all on public.tipos_cuello from anon;

-- Que PostgREST vea la tabla y columnas nuevas sin reiniciar.
notify pgrst, 'reload schema';
