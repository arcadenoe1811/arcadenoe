-- =====================================================================
-- 00014 - Producción dirigida a una venta (atajo desde el desglose)
--
-- Hasta ahora toda la producción se repartía por FIFO (venta más antigua
-- primero). Esta migración permite además registrar producción EARMARKED a
-- una línea de venta concreta (botón "Producir" en el desglose por cliente):
-- esas unidades van a esa venta, saltándose el FIFO.
--
-- Modelo (sigue siendo todo DERIVADO, nada se desincroniza):
--   * producciones.venta_linea_id  -> si está, la producción es dirigida.
--   * Por línea: primero se cubre con lo dirigido a ella (tope: su cantidad);
--     el resto de la demanda se cubre con el "pool" FIFO de lo NO dirigido.
--   * Lo dirigido de más (por encima de lo que esa línea pedía) es
--     sobreproducción: no resta pendiente a nadie más (poco común: el
--     formulario propone exactamente lo pendiente del cliente).
-- =====================================================================

alter table public.producciones
  add column venta_linea_id uuid references public.venta_lineas (id) on delete set null;

comment on column public.producciones.venta_linea_id is
  'Si está, la producción se asignó a esta línea de venta (salta el FIFO)';

create index producciones_venta_linea_idx
  on public.producciones (venta_linea_id) where venta_linea_id is not null;

-- Asignación por línea: dirigido + FIFO del pool no dirigido ------------
-- Se recrea (cambian las columnas), así que primero cae la vista que
-- depende de ella; ambas se vuelven a crear aquí mismo.
drop view if exists public.v_estado_ventas;
drop view if exists public.v_lineas_asignadas;

create view public.v_lineas_asignadas
with (security_invoker = true) as
with lineas as (
  select
    l.id, l.venta_id, l.cuello_id, l.diseno_codigo, l.pieza, l.talla,
    l.cantidad, l.orden, v.fecha as venta_fecha, v.created_at as venta_created,
    v.cliente, v.notas as venta_notas
  from public.venta_lineas l
  join public.ventas v on v.id = l.venta_id
  where l.cuello_id is not null
),
dirigido as (
  select p.venta_linea_id as id, sum(p.cantidad) as dir
  from public.producciones p
  where p.venta_linea_id is not null
  group by p.venta_linea_id
),
pool as (
  -- producción NO dirigida, por diseño+medida (la que reparte el FIFO)
  select p.cuello_id, p.talla, sum(p.cantidad) as libre
  from public.producciones p
  where p.venta_linea_id is null and p.cuello_id is not null
  group by p.cuello_id, p.talla
),
base as (
  select
    ln.*,
    least(ln.cantidad, coalesce(d.dir, 0)) as dirigido,
    greatest(0, ln.cantidad - least(ln.cantidad, coalesce(d.dir, 0))) as restante
  from lineas ln
  left join dirigido d on d.id = ln.id
),
fifo as (
  select
    b.*,
    -- demanda (restante tras lo dirigido) de las ventas MÁS antiguas
    coalesce(sum(b.restante) over (
      partition by b.cuello_id, b.talla
      order by b.venta_fecha, b.venta_created, b.orden, b.id
      rows between unbounded preceding and 1 preceding
    ), 0) as restante_previo
  from base b
)
select
  f.id, f.venta_id, f.cuello_id, f.diseno_codigo, f.pieza, f.talla,
  f.cantidad, f.orden, f.venta_fecha, f.venta_created, f.cliente, f.venta_notas,
  (f.dirigido + least(f.restante, greatest(0, coalesce(pl.libre, 0) - f.restante_previo)))
    as asignado,
  (f.cantidad - (f.dirigido + least(f.restante, greatest(0, coalesce(pl.libre, 0) - f.restante_previo))))
    as pendiente
from fifo f
left join pool pl on pl.cuello_id = f.cuello_id and pl.talla = f.talla;

comment on view public.v_lineas_asignadas is
  'Unidades producidas (dirigido + FIFO) y pendientes por línea de venta';

-- Estado de cada venta (igual que antes; se recrea por el drop de arriba).
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

grant select on public.v_lineas_asignadas, public.v_estado_ventas to authenticated;
revoke all on public.v_lineas_asignadas, public.v_estado_ventas from anon;

-- Pendiente de producir, con desglose por cliente (+ nota de la venta) ---
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

-- A qué ventas se asignó cada producción (dirigida o FIFO) --------------
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

-- Registrar producción: ahora acepta venta_linea_id (dirigida) ----------
-- Si viene venta_linea_id, el diseño y la medida salen de esa línea (no se
-- piden) y la producción queda asignada a esa venta.
create or replace function public.fn_registrar_produccion(p_produccion jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id       uuid := gen_random_uuid();
  v_fecha    date;
  v_cantidad integer := (p_produccion ->> 'cantidad')::integer;
  v_linea_id uuid := nullif(p_produccion ->> 'venta_linea_id', '')::uuid;
  v_linea    public.venta_lineas;
  v_cuello   public.cuellos;
  v_cuello_id uuid;
  v_codigo   text;
  v_pieza    text;
  v_talla    text;
begin
  perform public.fn_exigir_acceso_actual();
  v_fecha := public.fn_validar_fecha_registro(nullif(p_produccion ->> 'fecha', '')::date);
  if v_cantidad is null or v_cantidad < 1 or v_cantidad > 99999 then
    raise exception 'La cantidad debe ser un entero mayor que cero.'
      using errcode = 'P0001', hint = 'cantidad';
  end if;

  if v_linea_id is not null then
    -- Dirigida: diseño y medida vienen de la línea de venta.
    select l.* into v_linea from public.venta_lineas l where l.id = v_linea_id;
    if not found then
      raise exception 'La línea de venta no existe.' using errcode = 'P0002';
    end if;
    v_cuello_id := v_linea.cuello_id;
    v_codigo    := v_linea.diseno_codigo;
    v_pieza     := v_linea.pieza;
    v_talla     := v_linea.talla;
  else
    -- General (FIFO): se elige el diseño y la medida.
    select c.* into v_cuello
    from public.cuellos c
    where c.id = nullif(p_produccion ->> 'cuello_id', '')::uuid;
    if not found then
      raise exception 'Elige el diseño producido.'
        using errcode = 'P0001', hint = 'cuello_id';
    end if;
    v_cuello_id := v_cuello.id;
    v_codigo    := v_cuello.codigo;
    v_pieza     := v_cuello.pieza;
    v_talla     := public.fn_normalizar_talla(p_produccion ->> 'talla');
  end if;

  insert into public.producciones (
    id, fecha, cuello_id, diseno_codigo, pieza, talla, cantidad, notas,
    venta_linea_id, usuario_id
  ) values (
    v_id, v_fecha, v_cuello_id, v_codigo, v_pieza, v_talla, v_cantidad,
    public.fn_texto_opcional(p_produccion ->> 'notas', 1000, 'notas'),
    v_linea_id, auth.uid()
  );
  return v_id;
end;
$$;

notify pgrst, 'reload schema';
