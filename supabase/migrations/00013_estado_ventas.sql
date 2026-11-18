-- =====================================================================
-- 00013 - Estados de venta y asignación automática de producción
--
-- El taller trabaja BAJO PEDIDO: primero se vende, luego se produce. Esta
-- migración conecta ambas cosas sin guardar una "asignación" explícita que
-- se pueda desincronizar: la producción se reparte a las ventas por orden
-- de antigüedad (FIFO) y todo se DERIVA con ventanas (window functions),
-- así que agregar o borrar una venta o una producción recalcula solo.
--
-- Estados de una venta:
--   * pendiente        nada producido todavía
--   * en_produccion    algo producido, pero falta
--   * listo            todo lo vendido ya se produjo
--   * entregado        (manual) se entregó al cliente
--   * entregado_parcial(manual) se entregó una parte
-- Los tres primeros se calculan solos; la entrega la marca el usuario.
--
-- Asignación FIFO: para un mismo diseño+medida, las unidades producidas
-- cubren las ventas de la más antigua a la más nueva. Ej.: Doña Marta pidió
-- 3 (9 nov) y Eder 35 (17 nov); se producen 20 -> 3 a Doña Marta (completa)
-- y 17 a Eder (parcial).
-- =====================================================================

-- Entrega (lo único manual; lo demás se deriva) -------------------------
alter table public.ventas
  add column entregado        boolean not null default false,
  add column entrega_parcial  boolean not null default false,
  add column entregado_en      timestamptz,
  add constraint ventas_entrega_coherente
    check (not (entregado and entrega_parcial));

comment on column public.ventas.entregado       is 'true = entregada por completo (manual)';
comment on column public.ventas.entrega_parcial is 'true = entregada en parte (manual)';

-- Asignación por línea de venta -----------------------------------------
-- Para cada línea, cuántas de sus unidades ya están producidas, repartiendo
-- la producción del mismo diseño+medida por antigüedad de la venta.
create view public.v_lineas_asignadas
with (security_invoker = true) as
with prod as (
  select p.cuello_id, p.talla, sum(p.cantidad) as producido
  from public.producciones p
  where p.cuello_id is not null
  group by p.cuello_id, p.talla
),
lineas as (
  select
    l.id, l.venta_id, l.cuello_id, l.diseno_codigo, l.pieza, l.talla,
    l.cantidad, l.orden, v.fecha as venta_fecha, v.cliente,
    -- unidades de las ventas MÁS antiguas (van primero en la cola FIFO)
    coalesce(sum(l.cantidad) over (
      partition by l.cuello_id, l.talla
      order by v.fecha, v.created_at, l.orden, l.id
      rows between unbounded preceding and 1 preceding
    ), 0) as previo
  from public.venta_lineas l
  join public.ventas v on v.id = l.venta_id
  where l.cuello_id is not null
)
select
  l.*,
  least(l.cantidad, greatest(0, coalesce(p.producido, 0) - l.previo)) as asignado,
  greatest(0, l.cantidad - greatest(0, coalesce(p.producido, 0) - l.previo)) as pendiente
from lineas l
left join prod p on p.cuello_id = l.cuello_id and p.talla = l.talla;

comment on view public.v_lineas_asignadas is
  'Unidades producidas (FIFO) y pendientes por línea de venta';

-- Estado de cada venta --------------------------------------------------
create view public.v_estado_ventas
with (security_invoker = true) as
select
  v.id,
  coalesce(sum(a.cantidad), 0)::int as vendido,
  coalesce(sum(a.asignado), 0)::int as producido,
  coalesce(sum(a.pendiente), 0)::int as pendiente,
  case
    when v.entregado then 'entregado'
    when v.entrega_parcial then 'entregado_parcial'
    when coalesce(sum(a.cantidad), 0) > 0
         and coalesce(sum(a.asignado), 0) >= coalesce(sum(a.cantidad), 0) then 'listo'
    when coalesce(sum(a.asignado), 0) > 0 then 'en_produccion'
    else 'pendiente'
  end as estado
from public.ventas v
left join public.v_lineas_asignadas a on a.venta_id = v.id
group by v.id, v.entregado, v.entrega_parcial;

comment on view public.v_estado_ventas is 'Estado derivado (producción) + entrega de cada venta';

-- Marcar / desmarcar la entrega (lo único que el usuario cambia a mano) --
-- Cualquier usuario con acceso puede hacerlo (es parte del flujo de venta).
create or replace function public.fn_marcar_entrega(p_venta uuid, p_modo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.fn_tiene_acceso() then
    raise exception 'Tu usuario no tiene acceso a esta operación.' using errcode = '42501';
  end if;
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

-- Pendiente de producir, con desglose por cliente -----------------------
-- Una fila por diseño+medida con pendiente > 0: totales, la venta más
-- antigua que espera y el detalle (quién pidió qué y hace cuántos días).
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
set search_path = ''
as $$
begin
  perform public.fn_exigir_acceso_actual();
  return query
  with pend as (
    select a.cuello_id, a.diseno_codigo, a.pieza, a.talla,
           a.venta_id, a.cliente, a.venta_fecha, a.cantidad, a.asignado, a.pendiente
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
        'cliente', coalesce(g.cliente, 'Sin cliente'),
        'fecha', g.venta_fecha,
        'pendiente', g.pendiente,
        'dias', (current_date - g.venta_fecha)
      ) order by g.venta_fecha, g.venta_id
    ) filter (where g.pendiente > 0), '[]'::jsonb)
  from pend g
  group by g.cuello_id, g.diseno_codigo, g.pieza, g.talla
  having sum(g.pendiente) > 0
  order by min(g.venta_fecha) filter (where g.pendiente > 0), g.diseno_codigo, g.talla;
end;
$$;

-- A qué ventas se asignó cada producción --------------------------------
-- Reparte cada lote de producción (ordenado por fecha) sobre la demanda de
-- ventas (ordenada por antigüedad): es el mismo FIFO visto "al revés".
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
set search_path = ''
as $$
declare
  v_limite int := least(greatest(coalesce(p_limite, 50), 1), 200);
begin
  perform public.fn_exigir_acceso_actual();
  return query
  with prod as (
    select pr.id, pr.fecha, pr.created_at, pr.diseno_codigo, pr.pieza, pr.talla,
           pr.cuello_id, pr.cantidad,
           coalesce(sum(pr.cantidad) over (
             partition by pr.cuello_id, pr.talla
             order by pr.fecha, pr.created_at, pr.id
             rows between unbounded preceding and 1 preceding
           ), 0) as antes
    from public.producciones pr
    where pr.cuello_id is not null
  ),
  demanda as (
    select l.cuello_id, l.talla, l.orden, l.id, v.cliente, v.fecha,
           coalesce(sum(l.cantidad) over (
             partition by l.cuello_id, l.talla
             order by v.fecha, v.created_at, l.orden, l.id
             rows between unbounded preceding and 1 preceding
           ), 0) as antes,
           l.cantidad
    from public.venta_lineas l
    join public.ventas v on v.id = l.venta_id
    where l.cuello_id is not null
  ),
  recientes as (
    select * from prod order by fecha desc, created_at desc limit v_limite
  ),
  cruce as (
    select
      p.id, p.fecha, p.diseno_codigo, p.pieza, p.talla, p.cantidad,
      d.cliente, d.fecha as venta_fecha,
      (least(p.antes + p.cantidad, d.antes + d.cantidad)
        - greatest(p.antes, d.antes)) as unidades
    from recientes p
    join demanda d
      on d.cuello_id = p.cuello_id and d.talla = p.talla
     and least(p.antes + p.cantidad, d.antes + d.cantidad)
         > greatest(p.antes, d.antes)
  )
  select
    p.id, p.fecha, p.created_at, p.cuello_id, p.diseno_codigo, p.pieza, p.talla, p.cantidad,
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'cliente', coalesce(c.cliente, 'Sin cliente'),
               'fecha', c.venta_fecha,
               'cantidad', c.unidades
             ) order by c.venta_fecha)
      from cruce c where c.id = p.id and c.unidades > 0
    ), '[]'::jsonb)
  from recientes p
  order by p.fecha desc, p.created_at desc;
end;
$$;

-- Total de cuellos pendientes de producir (KPI del dashboard).
create or replace function public.fn_total_pendiente()
returns int
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(a.pendiente), 0)::int from public.v_lineas_asignadas a;
$$;

-- Privilegios -----------------------------------------------------------
grant select on public.v_lineas_asignadas, public.v_estado_ventas to authenticated;
revoke all on public.v_lineas_asignadas, public.v_estado_ventas from anon;

revoke execute on function
  public.fn_marcar_entrega(uuid, text),
  public.fn_pendientes_produccion(),
  public.fn_produccion_asignada(int),
  public.fn_total_pendiente()
from anon, authenticated, public;

grant execute on function
  public.fn_marcar_entrega(uuid, text),
  public.fn_pendientes_produccion(),
  public.fn_produccion_asignada(int),
  public.fn_total_pendiente()
to authenticated;

-- Dashboard: agregar el total de cuellos pendientes de producir ---------
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
  perform public.fn_exigir_acceso_actual();
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

notify pgrst, 'reload schema';
