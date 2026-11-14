-- =====================================================================
-- 00004 - Colores: codigo del cono y color del cuerpo al que pertenecen
-- =====================================================================
-- codigo:   numero/codigo del color segun el cono (ej: "34").
-- posicion: color N de cuellos.posiciones_cuerpo (desde 1). Solo tiene
--           sentido en la zona cuerpo; null = cuerpo en general.

alter table public.colores_cuello
  add column codigo text
    check (codigo is null or length(btrim(codigo)) between 1 and 20),
  add column posicion smallint
    check (posicion is null or (zona = 'cuerpo' and posicion between 1 and 30));

drop index if exists public.colores_cuello_cuello_id_idx;
create index colores_cuello_cuello_id_idx
  on public.colores_cuello (cuello_id, zona, posicion, orden);

-- Guardar: ahora inserta tambien codigo y posicion.
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
    -- posicion_tubular y pasadas_tubular ya no estan en el formulario:
    -- si no vienen se conserva lo que hubiera.
    update public.cuellos set
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

  insert into public.colores_cuello (cuello_id, zona, posicion, color, codigo, cantidad_hilos, orden)
  select v_cuello.id, x.zona, x.posicion, btrim(x.color), nullif(btrim(x.codigo), ''),
         x.cantidad_hilos, x.orden
  from jsonb_populate_recordset(null::public.colores_cuello, coalesce(p_colores, '[]'::jsonb)) x;

  return v_cuello;
end;
$$;

notify pgrst, 'reload schema';
