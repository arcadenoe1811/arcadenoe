-- =====================================================================
-- 00007 - Piezas (cuello / puno) y herencia de disenos
--
-- La tabla cuellos pasa a guardar "piezas": cuellos y punos comparten
-- ficha tecnica, colores y diseno Jacquard.
--
-- * pieza:     'cuello' | 'puno'.
-- * codigo:    el codigo del DISENO (ej: maz4t5). El codigo de maquina se
--              arma con la talla delante: 16maz4t5 (cuello), pgmaz4t5
--              (puno). Por eso ahora es unico POR PIEZA: puede existir el
--              cuello maz4t5 y el puno maz4t5.
-- * tallas:    tallas del puno (pp, pg, pee, pex). Los cuellos siguen
--              usando medidas (numeros).
-- * padre_id:  pieza de la que hereda el diseno (null = independiente).
-- * overrides: campos del diseno que el hijo cambio respecto al padre
--              (texto, fondo, color_texto, desplazamiento, debajo, arriba,
--              medio). Un hijo no guarda "diseno": se calcula en la app
--              con el diseno del padre + la paleta del hijo + overrides.
--              Ver packages/shared/cuellos/herencia.js
-- =====================================================================

alter table public.cuellos
  add column pieza     text  not null default 'cuello',
  add column tallas    text[],
  add column padre_id  uuid  references public.cuellos (id) on delete set null,
  add column overrides jsonb not null default '{}'::jsonb,
  add constraint cuellos_pieza_valida
    check (pieza in ('cuello', 'puno')),
  add constraint cuellos_tallas_validas
    check (tallas is null or tallas <@ array['pp', 'pg', 'pee', 'pex']::text[]),
  add constraint cuellos_overrides_objeto
    check (jsonb_typeof(overrides) = 'object'),
  add constraint cuellos_overrides_tamano
    check (octet_length(overrides::text) <= 16384),
  add constraint cuellos_padre_distinto
    check (padre_id is null or padre_id <> id);

comment on column public.cuellos.pieza     is 'Tipo de pieza: cuello o puno';
comment on column public.cuellos.tallas    is 'Tallas del puno: pp (12-13), pg (14-16), pee (17), pex (18)';
comment on column public.cuellos.padre_id  is 'Pieza de la que hereda el diseno (null = independiente)';
comment on column public.cuellos.overrides is 'Campos del diseno que este hijo sobrescribe respecto al padre';

-- Codigo unico por pieza (antes era unico en toda la tabla).
alter table public.cuellos drop constraint if exists cuellos_codigo_key;
alter table public.cuellos
  add constraint cuellos_pieza_codigo_key unique (pieza, codigo);

create index cuellos_padre_id_idx on public.cuellos (padre_id) where padre_id is not null;
create index cuellos_pieza_idx    on public.cuellos (pieza) where activo;

-- Sin ciclos en la herencia (A hija de B hija de A) ---------------------
create or replace function public.fn_validar_padre()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_actual uuid := new.padre_id;
  v_pasos  int  := 0;
begin
  while v_actual is not null loop
    if v_actual = new.id then
      raise exception 'Un diseño no puede heredar de sí mismo ni de sus hijos.'
        using errcode = '23514';
    end if;
    v_pasos := v_pasos + 1;
    if v_pasos > 20 then
      raise exception 'La cadena de herencia es demasiado larga.' using errcode = '23514';
    end if;
    select c.padre_id into v_actual from public.cuellos c where c.id = v_actual;
  end loop;
  return new;
end;
$$;

create trigger cuellos_validar_padre
  before insert or update of padre_id on public.cuellos
  for each row
  when (new.padre_id is not null)
  execute function public.fn_validar_padre();

-- Guardar pieza (columnas nuevas) ---------------------------------------
-- Las claves nuevas son opcionales: un cliente viejo que no las manda no
-- borra la herencia ni las tallas.
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
      pieza, codigo, nombre, tipo, cantidad_hilos, posiciones_cuerpo, posicion_tubular,
      pasadas_tubular, medidas, tallas, notas, imagen_url, diseno, padre_id, overrides,
      activo
    ) values (
      coalesce(v_datos.pieza, 'cuello'), v_datos.codigo, v_datos.nombre, v_datos.tipo,
      v_datos.cantidad_hilos, coalesce(v_datos.posiciones_cuerpo, '[]'::jsonb),
      v_datos.posicion_tubular, v_datos.pasadas_tubular, v_datos.medidas, v_datos.tallas,
      v_datos.notas, v_datos.imagen_url, v_datos.diseno, v_datos.padre_id,
      coalesce(v_datos.overrides, '{}'::jsonb), coalesce(v_datos.activo, true)
    )
    returning * into v_cuello;
  else
    update public.cuellos set
      pieza             = case when p_cuello ? 'pieza'
                               then coalesce(v_datos.pieza, cuellos.pieza) else cuellos.pieza end,
      codigo            = v_datos.codigo,
      nombre            = v_datos.nombre,
      tipo              = v_datos.tipo,
      cantidad_hilos    = v_datos.cantidad_hilos,
      posiciones_cuerpo = coalesce(v_datos.posiciones_cuerpo, '[]'::jsonb),
      posicion_tubular  = case when p_cuello ? 'posicion_tubular'
                               then v_datos.posicion_tubular else cuellos.posicion_tubular end,
      pasadas_tubular   = case when p_cuello ? 'pasadas_tubular'
                               then v_datos.pasadas_tubular else cuellos.pasadas_tubular end,
      medidas           = v_datos.medidas,
      tallas            = case when p_cuello ? 'tallas'
                               then v_datos.tallas else cuellos.tallas end,
      notas             = v_datos.notas,
      imagen_url        = v_datos.imagen_url,
      diseno            = case when p_cuello ? 'diseno'
                               then v_datos.diseno else cuellos.diseno end,
      padre_id          = case when p_cuello ? 'padre_id'
                               then v_datos.padre_id else cuellos.padre_id end,
      overrides         = case when p_cuello ? 'overrides'
                               then coalesce(v_datos.overrides, '{}'::jsonb) else cuellos.overrides end,
      activo            = coalesce(v_datos.activo, cuellos.activo)
    where cuellos.id = v_id
    returning * into v_cuello;

    if not found then
      raise exception 'Pieza no encontrada' using errcode = 'P0002';
    end if;

    delete from public.colores_cuello where cuello_id = v_id;
  end if;

  insert into public.colores_cuello (cuello_id, zona, posicion, color, codigo, hex, cantidad_hilos, orden)
  select v_cuello.id, x.zona, x.posicion, btrim(x.color), nullif(btrim(x.codigo), ''),
         lower(nullif(btrim(x.hex), '')), x.cantidad_hilos, x.orden
  from jsonb_populate_recordset(null::public.colores_cuello, coalesce(p_colores, '[]'::jsonb)) x;

  return v_cuello;
end;
$$;

notify pgrst, 'reload schema';
