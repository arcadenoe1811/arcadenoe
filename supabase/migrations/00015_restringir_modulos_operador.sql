-- =====================================================================
-- 00015 - Restringir modulos al rol admin (Dashboard, Ventas, Estimador,
--         Reportes)
--
-- El operador deja de tener acceso a Dashboard, Ventas (historial y
-- registrar), Estimador de costos y Reportes. Hasta 00014 el operador
-- podia ver y registrar ventas, estimar y ver reportes (asi se diseno en
-- 00012). Ahora esos modulos son SOLO del admin. Esta migracion mueve la
-- autorizacion real a la base, para que la restriccion no dependa solo de
-- la interfaz: un operador que llame a la API directamente recibe 403 (en
-- las funciones) o 0 filas (en las lecturas de tabla).
--
-- Debe quedar en sintonia con packages/shared/usuarios/permisos.js:
--                      admin              operador
--   dashboard          ver                —
--   reportes           ver                —
--   ventas             registrar, ver,    —
--                      marcar entrega
--   estimador          usar, ver          —
--   produccion         registrar, ver     registrar, ver   (sin cambios)
--   inventario/colores/cuellos                   (sin cambios)
--
-- Lo delicado: el operador SIGUE usando Produccion, que se nutre de las
-- ventas (FIFO) y del stock. Por eso:
--   * Las funciones de produccion (fn_pendientes_produccion,
--     fn_produccion_asignada, fn_total_pendiente) y la vista v_stock_cuellos
--     pasan a SECURITY DEFINER / security_invoker=false: su dueno es
--     supabase_admin (BYPASSRLS), asi leen ventas y venta_lineas aunque el
--     operador ya no pueda leer esas tablas directamente.
--   * Las lecturas directas de ventas, venta_lineas, estimaciones,
--     estimacion_lineas y configuracion quedan solo para el admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Produccion y stock: siguen disponibles para el operador aunque las
--    tablas de ventas se cierren. Al correr como su dueno (supabase_admin,
--    BYPASSRLS) ya no dependen del RLS de ventas / venta_lineas.
-- ---------------------------------------------------------------------

alter view public.v_stock_cuellos set (security_invoker = false);

-- Pendiente de producir, con desglose por cliente (cuerpo identico a 00014:
-- incluye venta_linea_id y la nota de la venta; ahora SECURITY DEFINER).
-- Conserva el guard de acceso: solo usuarios activos.
create or replace function public.fn_pendientes_produccion()
returns table (
  cuello_id          uuid,
  codigo             text,
  pieza              text,
  talla              text,
  vendido            int,
  producido          int,
  pendiente          int,
  venta_mas_antigua  date,
  cliente_mas_antiguo text,
  dias               int,
  detalle            jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.fn_exigir_acceso_actual();
  return query
  with pend as (
    select a.id as venta_linea_id, a.cuello_id, a.diseno_codigo, a.pieza, a.talla,
           a.venta_id, a.cliente, a.venta_fecha, a.venta_notas,
           a.cantidad, a.asignado, a.pendiente
    from public.v_lineas_asignadas a
  )
  select
    g.cuello_id,
    g.diseno_codigo,
    g.pieza,
    g.talla,
    sum(g.cantidad)::int,
    sum(g.asignado)::int,
    sum(g.pendiente)::int,
    min(g.venta_fecha) filter (where g.pendiente > 0),
    (array_agg(coalesce(g.cliente, 'Sin cliente') order by g.venta_fecha, g.venta_id)
       filter (where g.pendiente > 0))[1],
    (current_date - min(g.venta_fecha) filter (where g.pendiente > 0))::int,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'venta_id', g.venta_id,
        'venta_linea_id', g.venta_linea_id,
        'cliente', coalesce(g.cliente, 'Sin cliente'),
        'fecha', g.venta_fecha,
        'pendiente', g.pendiente,
        'dias', (current_date - g.venta_fecha),
        'nota', g.venta_notas
      ) order by g.venta_fecha, g.venta_id
    ) filter (where g.pendiente > 0), '[]'::jsonb)
  from pend g
  group by g.cuello_id, g.diseno_codigo, g.pieza, g.talla
  having sum(g.pendiente) > 0
  order by min(g.venta_fecha) filter (where g.pendiente > 0), g.diseno_codigo, g.talla;
end;
$$;

-- A que ventas se asigno cada produccion (cuerpo identico a 00014: dirigida
-- + FIFO del pool no dirigido; ahora SECURITY DEFINER).
create or replace function public.fn_produccion_asignada(p_limite int default 50)
returns table (
  id             uuid,
  fecha          date,
  created_at     timestamptz,
  cuello_id      uuid,
  diseno_codigo  text,
  pieza          text,
  talla          text,
  cantidad       int,
  asignado       jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limite int := least(greatest(coalesce(p_limite, 50), 1), 200);
begin
  perform public.fn_exigir_acceso_actual();
  return query
  with recientes as (
    select pr.id, pr.fecha, pr.created_at, pr.cuello_id, pr.diseno_codigo,
           pr.pieza, pr.talla, pr.cantidad, pr.venta_linea_id
    from public.producciones pr
    where pr.cuello_id is not null
    order by pr.fecha desc, pr.created_at desc
    limit v_limite
  ),
  -- Para las dirigidas: el cliente de su línea.
  dirigidas as (
    select r.id,
      jsonb_build_array(jsonb_build_object(
        'cliente', coalesce(v.cliente, 'Sin cliente'),
        'fecha', v.fecha,
        'cantidad', least(r.cantidad, l.cantidad)
      )) as asignado
    from recientes r
    join public.venta_lineas l on l.id = r.venta_linea_id
    join public.ventas v on v.id = l.venta_id
  ),
  -- Para las NO dirigidas: FIFO sobre la demanda que queda tras lo dirigido.
  prod_und as (
    select pr.id, pr.cuello_id, pr.talla, pr.cantidad,
      coalesce(sum(pr.cantidad) over (
        partition by pr.cuello_id, pr.talla
        order by pr.fecha, pr.created_at, pr.id
        rows between unbounded preceding and 1 preceding
      ), 0) as antes
    from public.producciones pr
    where pr.cuello_id is not null and pr.venta_linea_id is null
  ),
  demanda_und as (
    select a.id, a.cuello_id, a.talla, a.cliente, a.venta_fecha,
           a.venta_created, a.orden, a.cantidad
    from public.v_lineas_asignadas a
  ),
  -- demanda que el pool FIFO debe cubrir = cantidad menos lo dirigido a la línea.
  demanda as (
    select d.cuello_id, d.talla, d.cliente, d.venta_fecha,
      greatest(0, d.cantidad - least(d.cantidad,
        (select coalesce(sum(p.cantidad),0) from public.producciones p where p.venta_linea_id = d.id)
      )) as restante,
      coalesce(sum(
        greatest(0, d.cantidad - least(d.cantidad,
          (select coalesce(sum(p.cantidad),0) from public.producciones p where p.venta_linea_id = d.id)
        ))
      ) over (
        partition by d.cuello_id, d.talla
        order by d.venta_fecha, d.venta_created, d.orden, d.id
        rows between unbounded preceding and 1 preceding
      ), 0) as antes
    from demanda_und d
  ),
  cruce as (
    select p.id, dm.cliente, dm.venta_fecha,
      (least(p.antes + p.cantidad, dm.antes + dm.restante)
        - greatest(p.antes, dm.antes)) as unidades
    from prod_und p
    join demanda dm on dm.cuello_id = p.cuello_id and dm.talla = p.talla
      and dm.restante > 0
      and least(p.antes + p.cantidad, dm.antes + dm.restante) > greatest(p.antes, dm.antes)
  ),
  no_dirigidas as (
    select r.id,
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'cliente', coalesce(c.cliente, 'Sin cliente'),
                 'fecha', c.venta_fecha,
                 'cantidad', c.unidades
               ) order by c.venta_fecha)
        from cruce c where c.id = r.id and c.unidades > 0
      ), '[]'::jsonb) as asignado
    from recientes r
    where r.venta_linea_id is null
  )
  select r.id, r.fecha, r.created_at, r.cuello_id, r.diseno_codigo, r.pieza,
         r.talla, r.cantidad,
         coalesce(d.asignado, n.asignado, '[]'::jsonb)
  from recientes r
  left join dirigidas d on d.id = r.id
  left join no_dirigidas n on n.id = r.id
  order by r.fecha desc, r.created_at desc;
end;
$$;

-- Total de cuellos pendientes (KPI del dashboard; identica a 00013, ahora
-- DEFINER para que lea las ventas sin depender del RLS).
create or replace function public.fn_total_pendiente()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(a.pendiente), 0)::int from public.v_lineas_asignadas a;
$$;

-- ---------------------------------------------------------------------
-- 2) Funciones de los modulos restringidos: ahora exigen admin. Los
--    cuerpos son identicos a 00012 / 00013; solo cambia el guard inicial
--    (fn_exigir_acceso_actual -> fn_exigir_admin_actual).
-- ---------------------------------------------------------------------

-- Registrar venta (solo admin) ------------------------------------------
create or replace function public.fn_registrar_venta(p_venta jsonb, p_lineas jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id       uuid := gen_random_uuid();
  v_fecha    date;
  v_metodo   text := coalesce(nullif(btrim(p_venta ->> 'metodo_pago'), ''), 'efectivo');
  v_linea    jsonb;
  v_orden    integer := 0;
  v_cuello   public.cuellos;
  v_cantidad integer;
  v_precio   numeric;
  v_unidades integer := 0;
  v_total    numeric := 0;
begin
  perform public.fn_exigir_admin_actual();

  v_fecha := public.fn_validar_fecha_registro(nullif(p_venta ->> 'fecha', '')::date);
  if v_metodo not in ('efectivo', 'transferencia', 'otro') then
    raise exception 'Elige un método de pago válido.'
      using errcode = 'P0001', hint = 'metodo_pago';
  end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array'
     or jsonb_array_length(p_lineas) < 1 or jsonb_array_length(p_lineas) > 50 then
    raise exception 'Agrega entre 1 y 50 líneas a la venta.'
      using errcode = 'P0001', hint = 'lineas';
  end if;

  insert into public.ventas (id, fecha, cliente, metodo_pago, notas, total_unidades, total, usuario_id)
  values (
    v_id, v_fecha,
    public.fn_texto_opcional(p_venta ->> 'cliente', 120, 'cliente'),
    v_metodo,
    public.fn_texto_opcional(p_venta ->> 'notas', 1000, 'notas'),
    1, 0, auth.uid()
  );

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    select c.* into v_cuello
    from public.cuellos c
    where c.id = nullif(v_linea ->> 'cuello_id', '')::uuid;
    if not found then
      raise exception 'Elige el diseño de cada línea.'
        using errcode = 'P0001', hint = 'lineas';
    end if;

    v_cantidad := (v_linea ->> 'cantidad')::integer;
    v_precio   := round((v_linea ->> 'precio_unitario')::numeric, 2);
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 99999 then
      raise exception 'La cantidad debe ser un entero mayor que cero.'
        using errcode = 'P0001', hint = 'lineas';
    end if;
    if v_precio is null or v_precio < 0 or v_precio > 9999999 then
      raise exception 'El precio no puede ser negativo.'
        using errcode = 'P0001', hint = 'lineas';
    end if;

    insert into public.venta_lineas (
      venta_id, cuello_id, diseno_codigo, pieza, talla, cantidad, precio_unitario, orden
    ) values (
      v_id, v_cuello.id, v_cuello.codigo, v_cuello.pieza,
      public.fn_normalizar_talla(v_linea ->> 'talla'), v_cantidad, v_precio, v_orden
    );

    v_orden    := v_orden + 1;
    v_unidades := v_unidades + v_cantidad;
    v_total    := v_total + v_cantidad * v_precio;
  end loop;

  update public.ventas set total_unidades = v_unidades, total = v_total where id = v_id;
  return v_id;
end;
$$;

-- Marcar / desmarcar la entrega (solo admin) ----------------------------
create or replace function public.fn_marcar_entrega(p_venta uuid, p_modo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fn_exigir_admin_actual();
  if p_modo not in ('entregado', 'parcial', 'ninguno') then
    raise exception 'Estado de entrega no válido.' using errcode = 'P0001';
  end if;

  update public.ventas set
    entregado       = (p_modo = 'entregado'),
    entrega_parcial = (p_modo = 'parcial'),
    entregado_en    = case when p_modo = 'ninguno' then null else now() end
  where id = p_venta;

  if not found then
    raise exception 'Venta no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

-- Guardar estimacion (solo admin) ---------------------------------------
create or replace function public.fn_guardar_estimacion(p_estimacion jsonb, p_lineas jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id       uuid := gen_random_uuid();
  v_tarifa   numeric := round((p_estimacion ->> 'tarifa_hora')::numeric, 2);
  v_costo    numeric := round((p_estimacion ->> 'costo_cono')::numeric, 2);
  v_linea    jsonb;
  v_orden    integer := 0;
  v_cuello   public.cuellos;
  v_cantidad integer;
  v_conos    numeric;
  v_minutos  numeric;
  v_unidades integer := 0;
  v_t_conos  numeric := 0;
  v_t_min    numeric := 0;
  v_material numeric;
  v_mano     numeric;
begin
  perform public.fn_exigir_admin_actual();

  if v_tarifa is null or v_tarifa < 0 or v_tarifa > 99999 then
    raise exception 'La tarifa por hora no es válida.'
      using errcode = 'P0001', hint = 'tarifa_hora';
  end if;
  if v_costo is null or v_costo < 0 or v_costo > 9999999 then
    raise exception 'El costo por cono no es válido.'
      using errcode = 'P0001', hint = 'costo_cono';
  end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array'
     or jsonb_array_length(p_lineas) < 1 or jsonb_array_length(p_lineas) > 50 then
    raise exception 'Agrega entre 1 y 50 líneas a la estimación.'
      using errcode = 'P0001', hint = 'lineas';
  end if;

  insert into public.estimaciones (
    id, nombre, notas, tarifa_hora, costo_cono, total_unidades, total_conos,
    total_minutos, costo_material, costo_mano_obra, costo_total, usuario_id
  ) values (
    v_id,
    public.fn_texto_opcional(p_estimacion ->> 'nombre', 120, 'nombre'),
    public.fn_texto_opcional(p_estimacion ->> 'notas', 1000, 'notas'),
    v_tarifa, v_costo, 1, 0, 0, 0, 0, 0, auth.uid()
  );

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    select c.* into v_cuello
    from public.cuellos c
    where c.id = nullif(v_linea ->> 'cuello_id', '')::uuid;
    if not found then
      raise exception 'Elige el diseño de cada línea.'
        using errcode = 'P0001', hint = 'lineas';
    end if;

    v_cantidad := (v_linea ->> 'cantidad')::integer;
    v_conos    := round((v_linea ->> 'conos_por_unidad')::numeric, 3);
    v_minutos  := round((v_linea ->> 'minutos_por_unidad')::numeric, 2);
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 99999 then
      raise exception 'La cantidad debe ser un entero mayor que cero.'
        using errcode = 'P0001', hint = 'lineas';
    end if;
    if v_conos is null or v_conos < 0 or v_conos > 999
       or v_minutos is null or v_minutos < 0 or v_minutos > 9999 then
      raise exception 'Conos y minutos por unidad no pueden ser negativos.'
        using errcode = 'P0001', hint = 'lineas';
    end if;

    insert into public.estimacion_lineas (
      estimacion_id, cuello_id, diseno_codigo, pieza, talla, cantidad,
      conos_por_unidad, minutos_por_unidad, orden
    ) values (
      v_id, v_cuello.id, v_cuello.codigo, v_cuello.pieza,
      public.fn_normalizar_talla(v_linea ->> 'talla'), v_cantidad, v_conos, v_minutos, v_orden
    );

    v_orden    := v_orden + 1;
    v_unidades := v_unidades + v_cantidad;
    v_t_conos  := v_t_conos + v_cantidad * v_conos;
    v_t_min    := v_t_min + v_cantidad * v_minutos;
  end loop;

  v_material := round(v_t_conos * v_costo, 2);
  v_mano     := round(v_t_min / 60.0 * v_tarifa, 2);

  update public.estimaciones set
    total_unidades  = v_unidades,
    total_conos     = v_t_conos,
    total_minutos   = v_t_min,
    costo_material  = v_material,
    costo_mano_obra = v_mano,
    costo_total     = v_material + v_mano
  where id = v_id;

  return v_id;
end;
$$;

-- Dashboard (solo admin; cuerpo identico a 00013) -----------------------
create or replace function public.fn_dashboard(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_grano text;
  v_paso  interval;
  v_res   jsonb;
begin
  perform public.fn_exigir_admin_actual();
  perform public.fn_validar_rango(p_desde, p_hasta);
  v_grano := public.fn_grano(p_desde, p_hasta);
  v_paso  := case v_grano when 'day' then interval '1 day'
                          when 'week' then interval '1 week'
                          else interval '1 month' end;

  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'grano', v_grano,

    'inventario', (
      select jsonb_build_object(
        'tipos',       count(*),
        'conos',       coalesce(sum(c.stock_actual), 0),
        'peso_g',      coalesce(sum(c.stock_actual * c.peso_por_cono_g), 0),
        'valor',       coalesce(sum(c.valor_stock), 0),
        'por_reponer', count(*) filter (where c.stock_actual <= c.stock_minimo),
        'agotados',    count(*) filter (where c.stock_actual = 0)
      )
      from public.conos c where c.activo
    ),

    -- Pendiente de producir: estado actual, no depende del rango.
    'pendientes', public.fn_total_pendiente(),

    'conos', (
      select jsonb_build_object(
        'utilizados', coalesce(sum(m.cantidad) filter (where m.tipo = 'salida'), 0),
        'entrados',   coalesce(sum(m.cantidad) filter (where m.tipo = 'entrada'), 0)
      )
      from public.movimientos_cono m
      where m.fecha between p_desde and p_hasta
    ),

    'cuellos_producidos', (
      select coalesce(sum(p.cantidad), 0)
      from public.producciones p
      where p.fecha between p_desde and p_hasta
    ),

    'ventas', (
      select jsonb_build_object(
        'cantidad', count(*),
        'unidades', coalesce(sum(v.total_unidades), 0),
        'total',    coalesce(sum(v.total), 0)
      )
      from public.ventas v
      where v.fecha between p_desde and p_hasta
    ),

    'consumo_por_color', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.cantidad desc, x.nombre), '[]'::jsonb)
      from (
        select c.id, c.codigo, c.nombre_color as nombre, c.hex, sum(m.cantidad) as cantidad
        from public.movimientos_cono m
        join public.conos c on c.id = m.cono_id
        where m.tipo = 'salida' and m.fecha between p_desde and p_hasta
        group by c.id
        order by sum(m.cantidad) desc, c.nombre_color
        limit 8
      ) x
    ),

    'serie_movimientos', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'periodo',  b.d,
        'entradas', coalesce(s.entradas, 0),
        'salidas',  coalesce(s.salidas, 0)
      ) order by b.d), '[]'::jsonb)
      from (
        select g::date as d
        from generate_series(date_trunc(v_grano, p_desde::timestamp), p_hasta::timestamp, v_paso) g
      ) b
      left join (
        select date_trunc(v_grano, m.fecha::timestamp)::date as d,
               sum(m.cantidad) filter (where m.tipo = 'entrada') as entradas,
               sum(m.cantidad) filter (where m.tipo = 'salida')  as salidas
        from public.movimientos_cono m
        where m.fecha between p_desde and p_hasta
        group by 1
      ) s using (d)
    ),

    'serie_ventas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'periodo',  b.d,
        'total',    coalesce(s.total, 0),
        'unidades', coalesce(s.unidades, 0)
      ) order by b.d), '[]'::jsonb)
      from (
        select g::date as d
        from generate_series(date_trunc(v_grano, p_desde::timestamp), p_hasta::timestamp, v_paso) g
      ) b
      left join (
        select date_trunc(v_grano, v.fecha::timestamp)::date as d,
               sum(v.total) as total, sum(v.total_unidades) as unidades
        from public.ventas v
        where v.fecha between p_desde and p_hasta
        group by 1
      ) s using (d)
    ),

    'top_disenos', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.unidades desc, x.codigo), '[]'::jsonb)
      from (
        select l.diseno_codigo as codigo, l.pieza,
               sum(l.cantidad) as unidades, sum(l.subtotal) as total
        from public.venta_lineas l
        join public.ventas v on v.id = l.venta_id
        where v.fecha between p_desde and p_hasta
        group by l.diseno_codigo, l.pieza
        order by sum(l.cantidad) desc, l.diseno_codigo
        limit 5
      ) x
    )
  ) into v_res;

  return v_res;
end;
$$;

-- Actividad reciente (solo admin; cuerpo identico a 00012) --------------
create or replace function public.fn_actividad_reciente(p_limite integer default 10)
returns table (
  id uuid,
  tipo text,
  fecha date,
  created_at timestamptz,
  usuario text,
  detalle text,
  cantidad integer,
  monto numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limite integer := least(greatest(coalesce(p_limite, 10), 1), 50);
begin
  perform public.fn_exigir_admin_actual();
  return query
    select a.id, a.tipo, a.fecha, a.created_at, coalesce(p.nombre, '—'), a.detalle, a.cantidad, a.monto
    from (
      (select m.id, m.tipo::text as tipo, m.fecha, m.created_at, m.usuario_id,
              c.nombre_color || ' (' || c.codigo || ')'
                || coalesce(' · ' || m.referencia, '') as detalle,
              m.cantidad, null::numeric as monto
       from public.movimientos_cono m
       join public.conos c on c.id = m.cono_id
       order by m.created_at desc limit v_limite)
      union all
      (select v.id, 'venta', v.fecha, v.created_at, v.usuario_id,
              coalesce(v.cliente, 'Venta sin cliente'), v.total_unidades, v.total
       from public.ventas v
       order by v.created_at desc limit v_limite)
      union all
      (select pr.id, 'produccion', pr.fecha, pr.created_at, pr.usuario_id,
              pr.diseno_codigo || ' · talla ' || pr.talla, pr.cantidad, null::numeric
       from public.producciones pr
       order by pr.created_at desc limit v_limite)
    ) a
    left join public.perfiles p on p.id = a.usuario_id
    order by a.created_at desc
    limit v_limite;
end;
$$;

-- Resumen de un periodo (solo admin; cuerpo identico a 00012) -----------
create or replace function public.fn_resumen_periodo(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_res jsonb;
begin
  perform public.fn_exigir_admin_actual();
  perform public.fn_validar_rango(p_desde, p_hasta);

  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'inversion_material', (
      select coalesce(sum(m.cantidad * m.costo_unitario), 0)
      from public.movimientos_cono m
      where m.tipo = 'entrada' and m.fecha between p_desde and p_hasta
    ),
    'conos_comprados', (
      select coalesce(sum(m.cantidad), 0)
      from public.movimientos_cono m
      where m.tipo = 'entrada' and m.fecha between p_desde and p_hasta
    ),
    'conos_utilizados', (
      select coalesce(sum(m.cantidad), 0)
      from public.movimientos_cono m
      where m.tipo = 'salida' and m.fecha between p_desde and p_hasta
    ),
    'costo_material_utilizado', (
      select coalesce(sum(m.cantidad * coalesce(c.costo_por_cono, 0)), 0)
      from public.movimientos_cono m
      join public.conos c on c.id = m.cono_id
      where m.tipo = 'salida' and m.fecha between p_desde and p_hasta
    ),
    'cuellos_producidos', (
      select coalesce(sum(p.cantidad), 0)
      from public.producciones p
      where p.fecha between p_desde and p_hasta
    ),
    'ventas', (
      select jsonb_build_object(
        'cantidad', count(*),
        'unidades', coalesce(sum(v.total_unidades), 0),
        'total',    coalesce(sum(v.total), 0)
      )
      from public.ventas v
      where v.fecha between p_desde and p_hasta
    ),
    -- Costo estimado de lo vendido; las lineas de disenos sin estimacion
    -- guardada no suman (se informa cuantas unidades quedaron sin costo).
    'costo_estimado_vendido', (
      select coalesce(sum(l.cantidad * k.costo_unitario), 0)
      from public.venta_lineas l
      join public.ventas v on v.id = l.venta_id
      join public.v_costo_estimado_diseno k on k.cuello_id = l.cuello_id
      where v.fecha between p_desde and p_hasta
    ),
    'unidades_sin_costo', (
      select coalesce(sum(l.cantidad), 0)
      from public.venta_lineas l
      join public.ventas v on v.id = l.venta_id
      left join public.v_costo_estimado_diseno k on k.cuello_id = l.cuello_id
      where v.fecha between p_desde and p_hasta and k.cuello_id is null
    )
  ) into v_res;

  return v_res;
end;
$$;

-- Reporte de inventario (solo admin; cuerpo identico a 00012) -----------
create or replace function public.fn_reporte_inventario(
  p_desde date, p_hasta date, p_grano text default null
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_grano text;
  v_paso  interval;
  v_res   jsonb;
begin
  perform public.fn_exigir_admin_actual();
  perform public.fn_validar_rango(p_desde, p_hasta);
  v_grano := public.fn_grano(p_desde, p_hasta, p_grano);
  v_paso  := case v_grano when 'day' then interval '1 day'
                          when 'week' then interval '1 week'
                          else interval '1 month' end;

  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'grano', v_grano,

    'conos', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.codigo), '[]'::jsonb)
      from (
        select c.id, c.codigo, c.nombre_color, c.hex, c.material, c.proveedor,
               c.stock_actual, c.stock_minimo, c.estado, c.costo_por_cono, c.valor_stock,
               coalesce(s.entradas, 0) as entradas,
               coalesce(s.salidas, 0)  as salidas,
               coalesce(s.ajustes, 0)  as ajustes,
               u.ultimo_movimiento
        from public.conos c
        left join (
          select m.cono_id,
                 sum(m.cantidad) filter (where m.tipo = 'entrada') as entradas,
                 sum(m.cantidad) filter (where m.tipo = 'salida')  as salidas,
                 sum(m.cantidad) filter (where m.tipo = 'ajuste')  as ajustes
          from public.movimientos_cono m
          where m.fecha between p_desde and p_hasta
          group by m.cono_id
        ) s on s.cono_id = c.id
        left join (
          select m.cono_id, max(m.fecha) as ultimo_movimiento
          from public.movimientos_cono m
          group by m.cono_id
        ) u on u.cono_id = c.id
        where c.activo
      ) x
    ),

    'totales', (
      select jsonb_build_object(
        'movimientos', count(*),
        'entradas',    coalesce(sum(m.cantidad) filter (where m.tipo = 'entrada'), 0),
        'salidas',     coalesce(sum(m.cantidad) filter (where m.tipo = 'salida'), 0),
        'ajustes',     coalesce(sum(m.cantidad) filter (where m.tipo = 'ajuste'), 0),
        'inversion',   coalesce(sum(m.cantidad * m.costo_unitario) filter (where m.tipo = 'entrada'), 0)
      )
      from public.movimientos_cono m
      where m.fecha between p_desde and p_hasta
    ),

    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'periodo',  b.d,
        'entradas', coalesce(s.entradas, 0),
        'salidas',  coalesce(s.salidas, 0)
      ) order by b.d), '[]'::jsonb)
      from (
        select g::date as d
        from generate_series(date_trunc(v_grano, p_desde::timestamp), p_hasta::timestamp, v_paso) g
      ) b
      left join (
        select date_trunc(v_grano, m.fecha::timestamp)::date as d,
               sum(m.cantidad) filter (where m.tipo = 'entrada') as entradas,
               sum(m.cantidad) filter (where m.tipo = 'salida')  as salidas
        from public.movimientos_cono m
        where m.fecha between p_desde and p_hasta
        group by 1
      ) s using (d)
    )
  ) into v_res;

  return v_res;
end;
$$;

-- Reporte de produccion (solo admin; cuerpo identico a 00012) -----------
create or replace function public.fn_reporte_produccion(
  p_desde date, p_hasta date, p_grano text default null
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_grano text;
  v_paso  interval;
  v_res   jsonb;
begin
  perform public.fn_exigir_admin_actual();
  perform public.fn_validar_rango(p_desde, p_hasta);
  v_grano := public.fn_grano(p_desde, p_hasta, p_grano);
  v_paso  := case v_grano when 'day' then interval '1 day'
                          when 'week' then interval '1 week'
                          else interval '1 month' end;

  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'grano', v_grano,

    'producido', (
      select coalesce(sum(p.cantidad), 0)
      from public.producciones p
      where p.fecha between p_desde and p_hasta
    ),

    'por_diseno', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.unidades desc, x.codigo), '[]'::jsonb)
      from (
        select p.diseno_codigo as codigo, p.pieza, sum(p.cantidad) as unidades,
               string_agg(distinct p.talla, ', ' order by p.talla) as tallas
        from public.producciones p
        where p.fecha between p_desde and p_hasta
        group by p.diseno_codigo, p.pieza
      ) x
    ),

    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'periodo',  b.d,
        'unidades', coalesce(s.unidades, 0)
      ) order by b.d), '[]'::jsonb)
      from (
        select g::date as d
        from generate_series(date_trunc(v_grano, p_desde::timestamp), p_hasta::timestamp, v_paso) g
      ) b
      left join (
        select date_trunc(v_grano, p.fecha::timestamp)::date as d, sum(p.cantidad) as unidades
        from public.producciones p
        where p.fecha between p_desde and p_hasta
        group by 1
      ) s using (d)
    ),

    -- Salidas de conos asociadas a una pieza (campo "pieza producida").
    'consumo_por_diseno', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.conos desc, x.codigo), '[]'::jsonb)
      from (
        select q.codigo, q.pieza, sum(m.cantidad) as conos,
               sum(m.cantidad * coalesce(c.costo_por_cono, 0)) as costo
        from public.movimientos_cono m
        join public.cuellos q on q.id = m.pieza_id
        join public.conos c on c.id = m.cono_id
        where m.tipo = 'salida' and m.fecha between p_desde and p_hasta
        group by q.id
      ) x
    ),
    'conos_sin_diseno', (
      select coalesce(sum(m.cantidad), 0)
      from public.movimientos_cono m
      where m.tipo = 'salida' and m.pieza_id is null
        and m.fecha between p_desde and p_hasta
    ),

    'estimaciones', (
      select jsonb_build_object(
        'cantidad',        count(*),
        'unidades',        coalesce(sum(e.total_unidades), 0),
        'minutos',         coalesce(sum(e.total_minutos), 0),
        'conos',           coalesce(sum(e.total_conos), 0),
        'costo_total',     coalesce(sum(e.costo_total), 0),
        'costo_por_cuello', case when sum(e.total_unidades) > 0
                                 then round(sum(e.costo_total) / sum(e.total_unidades), 2) end
      )
      from public.estimaciones e
      where e.fecha between p_desde and p_hasta
    )
  ) into v_res;

  return v_res;
end;
$$;

-- Reporte de ventas (solo admin; cuerpo identico a 00012) ---------------
create or replace function public.fn_reporte_ventas(
  p_desde date, p_hasta date, p_grano text default null
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_grano text;
  v_paso  interval;
  v_res   jsonb;
begin
  perform public.fn_exigir_admin_actual();
  perform public.fn_validar_rango(p_desde, p_hasta);
  v_grano := public.fn_grano(p_desde, p_hasta, p_grano);
  v_paso  := case v_grano when 'day' then interval '1 day'
                          when 'week' then interval '1 week'
                          else interval '1 month' end;

  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'grano', v_grano,

    'totales', (
      select jsonb_build_object(
        'cantidad', count(*),
        'unidades', coalesce(sum(v.total_unidades), 0),
        'total',    coalesce(sum(v.total), 0)
      )
      from public.ventas v
      where v.fecha between p_desde and p_hasta
    ),

    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'periodo',  b.d,
        'ventas',   coalesce(s.ventas, 0),
        'unidades', coalesce(s.unidades, 0),
        'total',    coalesce(s.total, 0)
      ) order by b.d), '[]'::jsonb)
      from (
        select g::date as d
        from generate_series(date_trunc(v_grano, p_desde::timestamp), p_hasta::timestamp, v_paso) g
      ) b
      left join (
        select date_trunc(v_grano, v.fecha::timestamp)::date as d,
               count(*) as ventas, sum(v.total_unidades) as unidades, sum(v.total) as total
        from public.ventas v
        where v.fecha between p_desde and p_hasta
        group by 1
      ) s using (d)
    ),

    'por_diseno', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.ingresos desc, x.codigo), '[]'::jsonb)
      from (
        select l.diseno_codigo as codigo, l.pieza,
               sum(l.cantidad) as unidades,
               sum(l.subtotal) as ingresos,
               max(k.costo_unitario) as costo_unitario,
               case when max(k.costo_unitario) is not null
                    then round(sum(l.cantidad) * max(k.costo_unitario), 2) end as costo_estimado
        from public.venta_lineas l
        join public.ventas v on v.id = l.venta_id
        left join public.v_costo_estimado_diseno k on k.cuello_id = l.cuello_id
        where v.fecha between p_desde and p_hasta
        group by l.diseno_codigo, l.pieza
      ) x
    ),

    'por_metodo', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc), '[]'::jsonb)
      from (
        select v.metodo_pago as metodo, count(*) as ventas, sum(v.total) as total
        from public.ventas v
        where v.fecha between p_desde and p_hasta
        group by v.metodo_pago
      ) x
    ),

    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc, x.cliente), '[]'::jsonb)
      from (
        select min(v.cliente) as cliente, count(*) as ventas,
               sum(v.total_unidades) as unidades, sum(v.total) as total
        from public.ventas v
        where v.fecha between p_desde and p_hasta and v.cliente is not null
        group by lower(v.cliente)
        order by sum(v.total) desc
        limit 10
      ) x
    )
  ) into v_res;

  return v_res;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Lecturas directas de tabla: solo admin. El operador que consulte
--    ventas / estimaciones / configuracion por la API recibe 0 filas.
--    v_lineas_asignadas y v_estado_ventas son security_invoker y leen
--    estas tablas, asi que tambien quedan restringidas al admin para
--    lecturas directas (produccion las lee via funciones DEFINER).
-- ---------------------------------------------------------------------

drop policy if exists lectura_ventas            on public.ventas;
drop policy if exists lectura_venta_lineas       on public.venta_lineas;
drop policy if exists lectura_estimaciones        on public.estimaciones;
drop policy if exists lectura_estimacion_lineas   on public.estimacion_lineas;
drop policy if exists lectura_configuracion       on public.configuracion;

create policy lectura_ventas on public.ventas
  for select to authenticated using ((select public.fn_es_admin()));
create policy lectura_venta_lineas on public.venta_lineas
  for select to authenticated using ((select public.fn_es_admin()));
create policy lectura_estimaciones on public.estimaciones
  for select to authenticated using ((select public.fn_es_admin()));
create policy lectura_estimacion_lineas on public.estimacion_lineas
  for select to authenticated using ((select public.fn_es_admin()));
create policy lectura_configuracion on public.configuracion
  for select to authenticated using ((select public.fn_es_admin()));

notify pgrst, 'reload schema';
