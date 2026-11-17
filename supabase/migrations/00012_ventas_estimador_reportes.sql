-- =====================================================================
-- 00012 - Ventas, estimador de costos, produccion y reportes
--
-- * cuellos.precio_base: precio de venta del diseno (igual para todas las
--                        tallas). Solo el admin lo cambia (las politicas de
--                        cuellos ya lo exigen). Cambiarlo no toca ventas
--                        pasadas: cada linea guarda su precio.
-- * configuracion:       fila unica con la tarifa de mano de obra por hora.
-- * estimaciones:        calculos guardados del estimador (y sus lineas).
--                        Guardan SOLO lo estimado, nunca tiempos reales.
-- * producciones:        cuellos/punos terminados. Con las ventas dan la
--                        existencia por diseno y talla (v_stock_cuellos).
-- * ventas:              venta con sus lineas (diseno, talla, cantidad,
--                        precio).
--
-- Seguridad:
-- * Estas tablas NO se escriben directo por la API: solo con las funciones
--   fn_registrar_venta / fn_guardar_estimacion / fn_registrar_produccion,
--   que validan cada dato y calculan los totales en la base (el navegador
--   no puede falsear un total ni registrar a nombre de otro usuario).
-- * Eliminar es solo del admin (politica RLS + trigger que responde 403).
-- * Todo es SQL estatico con parametros: no hay SQL dinamico.
--
-- Permisos:
--                      admin              operador
--   precio / tarifa    cambiar            solo ver
--   ventas             registrar, borrar  registrar
--   estimaciones       guardar, borrar    guardar
--   producciones       registrar, borrar  registrar
--   dashboard/reportes ver                ver
-- =====================================================================

-- Precio base del diseno ------------------------------------------------
alter table public.cuellos
  add column precio_base numeric(12, 2),
  add constraint cuellos_precio_base_rango
    check (precio_base is null or precio_base between 0 and 9999999);

comment on column public.cuellos.precio_base
  is 'Precio de venta del diseno (todas las tallas). null = sin precio';

-- Configuracion (fila unica) --------------------------------------------
create table public.configuracion (
  id           boolean primary key default true,
  tarifa_hora  numeric(12, 2) not null default 0,
  updated_at   timestamptz,

  constraint configuracion_fila_unica check (id),
  constraint configuracion_tarifa_rango check (tarifa_hora between 0 and 99999)
);

comment on table  public.configuracion             is 'Ajustes del negocio (una sola fila)';
comment on column public.configuracion.tarifa_hora is 'Mano de obra por hora, para el estimador';

insert into public.configuracion (id) values (true) on conflict do nothing;

create trigger configuracion_updated_at
  before update on public.configuracion
  for each row execute function public.fn_actualizar_updated_at();

-- Estimaciones ----------------------------------------------------------
create table public.estimaciones (
  id                uuid primary key default gen_random_uuid(),
  fecha             date not null default current_date,
  nombre            text,
  notas             text,
  tarifa_hora       numeric(12, 2) not null,
  costo_cono        numeric(12, 2) not null,
  total_unidades    integer not null,
  total_conos       numeric(14, 3) not null,
  total_minutos     numeric(14, 2) not null,
  costo_material    numeric(14, 2) not null,
  costo_mano_obra   numeric(14, 2) not null,
  costo_total       numeric(14, 2) not null,
  usuario_id        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),

  constraint estimaciones_nombre_largo check (nombre is null or length(nombre) <= 120),
  constraint estimaciones_notas_largo  check (notas is null or length(notas) <= 1000),
  constraint estimaciones_no_negativos check (
    tarifa_hora >= 0 and costo_cono >= 0 and total_unidades > 0 and total_conos >= 0
    and total_minutos >= 0 and costo_material >= 0 and costo_mano_obra >= 0 and costo_total >= 0
  )
);

comment on table public.estimaciones is 'Calculos guardados del estimador de costos (solo estimados)';

create table public.estimacion_lineas (
  id                  uuid primary key default gen_random_uuid(),
  estimacion_id       uuid not null references public.estimaciones (id) on delete cascade,
  cuello_id           uuid references public.cuellos (id) on delete set null,
  diseno_codigo       text not null,
  pieza               text not null default 'cuello',
  talla               text not null,
  cantidad            integer not null,
  conos_por_unidad    numeric(8, 3) not null,
  minutos_por_unidad  numeric(8, 2) not null,
  orden               smallint not null default 0,

  constraint estimacion_lineas_talla_largo check (length(talla) between 1 and 12),
  constraint estimacion_lineas_rangos check (
    cantidad between 1 and 99999
    and conos_por_unidad between 0 and 999
    and minutos_por_unidad between 0 and 9999
  )
);

create index estimaciones_fecha_idx        on public.estimaciones (fecha desc, created_at desc);
create index estimacion_lineas_cabeza_idx  on public.estimacion_lineas (estimacion_id, orden);
create index estimacion_lineas_cuello_idx  on public.estimacion_lineas (cuello_id) where cuello_id is not null;

-- Producciones ----------------------------------------------------------
create table public.producciones (
  id             uuid primary key default gen_random_uuid(),
  fecha          date not null default current_date,
  cuello_id      uuid references public.cuellos (id) on delete set null,
  diseno_codigo  text not null,
  pieza          text not null default 'cuello',
  talla          text not null,
  cantidad       integer not null,
  notas          text,
  usuario_id     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint producciones_talla_largo    check (length(talla) between 1 and 12),
  constraint producciones_cantidad_rango check (cantidad between 1 and 99999),
  constraint producciones_notas_largo    check (notas is null or length(notas) <= 1000)
);

comment on table public.producciones is 'Cuellos y punos terminados (entran a la existencia)';

create index producciones_fecha_idx  on public.producciones (fecha desc, created_at desc);
create index producciones_cuello_idx on public.producciones (cuello_id, talla) where cuello_id is not null;

-- Ventas ----------------------------------------------------------------
create table public.ventas (
  id              uuid primary key default gen_random_uuid(),
  fecha           date not null default current_date,
  cliente         text,
  metodo_pago     text not null default 'efectivo',
  notas           text,
  total_unidades  integer not null,
  total           numeric(14, 2) not null,
  usuario_id      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint ventas_metodo_valido  check (metodo_pago in ('efectivo', 'transferencia', 'otro')),
  constraint ventas_cliente_largo  check (cliente is null or length(cliente) between 1 and 120),
  constraint ventas_notas_largo    check (notas is null or length(notas) <= 1000),
  constraint ventas_totales        check (total_unidades > 0 and total >= 0)
);

comment on table public.ventas is 'Ventas de cuellos y punos';

create table public.venta_lineas (
  id               uuid primary key default gen_random_uuid(),
  venta_id         uuid not null references public.ventas (id) on delete cascade,
  cuello_id        uuid references public.cuellos (id) on delete set null,
  diseno_codigo    text not null,
  pieza            text not null default 'cuello',
  talla            text not null,
  cantidad         integer not null,
  precio_unitario  numeric(12, 2) not null,
  subtotal         numeric(14, 2) generated always as (cantidad * precio_unitario) stored,
  orden            smallint not null default 0,

  constraint venta_lineas_talla_largo check (length(talla) between 1 and 12),
  constraint venta_lineas_rangos check (
    cantidad between 1 and 99999 and precio_unitario between 0 and 9999999
  )
);

comment on column public.venta_lineas.precio_unitario
  is 'Precio cobrado en ESTA venta (no cambia si luego cambia el precio base)';

create index ventas_fecha_idx        on public.ventas (fecha desc, created_at desc);
create index venta_lineas_venta_idx  on public.venta_lineas (venta_id, orden);
create index venta_lineas_cuello_idx on public.venta_lineas (cuello_id, talla) where cuello_id is not null;

-- Existencia de cuellos: producido - vendido, por diseno y talla --------
create view public.v_stock_cuellos
with (security_invoker = true) as
select
  t.cuello_id,
  t.talla,
  sum(t.producido)::integer                    as producido,
  sum(t.vendido)::integer                      as vendido,
  (sum(t.producido) - sum(t.vendido))::integer as disponible
from (
  select p.cuello_id, p.talla, p.cantidad as producido, 0 as vendido
  from public.producciones p
  where p.cuello_id is not null
  union all
  select l.cuello_id, l.talla, 0, l.cantidad
  from public.venta_lineas l
  where l.cuello_id is not null
) t
group by t.cuello_id, t.talla;

comment on view public.v_stock_cuellos is 'Existencia de cuellos/punos por diseno y talla';

-- Costo estimado por unidad de cada diseno (de las estimaciones guardadas,
-- promedio ponderado por cantidad). Sirve para el margen de los reportes.
create view public.v_costo_estimado_diseno
with (security_invoker = true) as
select
  l.cuello_id,
  round(
    sum(l.cantidad * (l.conos_por_unidad * e.costo_cono
                      + l.minutos_por_unidad / 60.0 * e.tarifa_hora))
    / sum(l.cantidad), 2
  ) as costo_unitario
from public.estimacion_lineas l
join public.estimaciones e on e.id = l.estimacion_id
where l.cuello_id is not null
group by l.cuello_id;

-- Validaciones compartidas ----------------------------------------------
create or replace function public.fn_exigir_acceso_actual()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.fn_tiene_acceso() then
    raise exception 'Tu usuario no tiene acceso a esta operación.'
      using errcode = '42501';
  end if;
end;
$$;

-- Fecha de un registro: obligatoria, no futura (un dia de margen por la
-- zona horaria del navegador) y no absurda.
create or replace function public.fn_validar_fecha_registro(p_fecha date)
returns date
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_fecha is null or p_fecha > current_date + 1 or p_fecha < date '2000-01-01' then
    raise exception 'La fecha no es válida (no puede ser futura).'
      using errcode = 'P0001', hint = 'fecha';
  end if;
  return p_fecha;
end;
$$;

-- Talla: texto corto en mayusculas ("m", " 16 " -> "M", "16").
create or replace function public.fn_normalizar_talla(p_talla text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_talla text := upper(regexp_replace(btrim(coalesce(p_talla, '')), '\s+', ' ', 'g'));
begin
  if length(v_talla) < 1 or length(v_talla) > 12 then
    raise exception 'Escribe la talla (máximo 12 caracteres).'
      using errcode = 'P0001', hint = 'talla';
  end if;
  return v_talla;
end;
$$;

-- Texto opcional recortado; null si queda vacio.
create or replace function public.fn_texto_opcional(p_texto text, p_maximo integer, p_campo text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_texto text := nullif(btrim(coalesce(p_texto, '')), '');
begin
  if v_texto is not null and length(v_texto) > p_maximo then
    raise exception 'El texto es demasiado largo (máximo % caracteres).', p_maximo
      using errcode = 'P0001', hint = p_campo;
  end if;
  return v_texto;
end;
$$;

-- Rango de fechas de dashboard y reportes: maximo 3 anos.
create or replace function public.fn_validar_rango(p_desde date, p_hasta date)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_desde is null or p_hasta is null or p_desde > p_hasta
     or p_hasta - p_desde > 1100 or p_desde < date '2000-01-01' then
    raise exception 'El rango de fechas no es válido (máximo 3 años).'
      using errcode = 'P0001', hint = 'fecha';
  end if;
end;
$$;

-- Agrupacion de las series: la pedida (day | week | month) o, si no se
-- pide, segun el largo del rango. Devuelve SIEMPRE uno de esos tres
-- valores: nunca texto libre del cliente.
create or replace function public.fn_grano(p_desde date, p_hasta date, p_grano text default null)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_grano in ('day', 'week', 'month') then p_grano
    when p_hasta - p_desde <= 31  then 'day'
    when p_hasta - p_desde <= 182 then 'week'
    else 'month'
  end;
$$;

-- Registrar venta -------------------------------------------------------
-- p_venta:  { fecha, cliente, metodo_pago, notas }
-- p_lineas: [{ cuello_id, talla, cantidad, precio_unitario }]
-- Los totales se calculan aqui. SECURITY DEFINER: la tabla no acepta
-- inserts directos; por eso se verifica el acceso al entrar.
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
  perform public.fn_exigir_acceso_actual();

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

-- Guardar estimacion ----------------------------------------------------
-- p_estimacion: { nombre, notas, tarifa_hora, costo_cono }
-- p_lineas:     [{ cuello_id, talla, cantidad, conos_por_unidad, minutos_por_unidad }]
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
  perform public.fn_exigir_acceso_actual();

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

-- Registrar produccion --------------------------------------------------
-- p_produccion: { fecha, cuello_id, talla, cantidad, notas }
create or replace function public.fn_registrar_produccion(p_produccion jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id       uuid := gen_random_uuid();
  v_fecha    date;
  v_cuello   public.cuellos;
  v_cantidad integer := (p_produccion ->> 'cantidad')::integer;
begin
  perform public.fn_exigir_acceso_actual();

  v_fecha := public.fn_validar_fecha_registro(nullif(p_produccion ->> 'fecha', '')::date);
  select c.* into v_cuello
  from public.cuellos c
  where c.id = nullif(p_produccion ->> 'cuello_id', '')::uuid;
  if not found then
    raise exception 'Elige el diseño producido.'
      using errcode = 'P0001', hint = 'cuello_id';
  end if;
  if v_cantidad is null or v_cantidad < 1 or v_cantidad > 99999 then
    raise exception 'La cantidad debe ser un entero mayor que cero.'
      using errcode = 'P0001', hint = 'cantidad';
  end if;

  insert into public.producciones (
    id, fecha, cuello_id, diseno_codigo, pieza, talla, cantidad, notas, usuario_id
  ) values (
    v_id, v_fecha, v_cuello.id, v_cuello.codigo, v_cuello.pieza,
    public.fn_normalizar_talla(p_produccion ->> 'talla'), v_cantidad,
    public.fn_texto_opcional(p_produccion ->> 'notas', 1000, 'notas'), auth.uid()
  );
  return v_id;
end;
$$;

-- Dashboard -------------------------------------------------------------
-- Todas las cifras del tablero para un rango de fechas, ya agregadas (la
-- API devuelve como mucho 1000 filas: no se puede sumar en el navegador).
-- SECURITY INVOKER: RLS sigue aplicando a cada tabla.
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

-- Actividad reciente: ultimos movimientos, ventas y producciones con el
-- nombre de quien los registro. SECURITY DEFINER porque un operador no
-- puede leer los perfiles de otros usuarios; solo se expone el nombre.
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
  perform public.fn_exigir_acceso_actual();
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

-- Resumen de un periodo (reporte general; se llama dos veces para
-- comparar con el periodo anterior) --------------------------------------
create or replace function public.fn_resumen_periodo(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_res jsonb;
begin
  perform public.fn_exigir_acceso_actual();
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

-- Reporte de inventario -------------------------------------------------
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
  perform public.fn_exigir_acceso_actual();
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

-- Reporte de produccion -------------------------------------------------
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
  perform public.fn_exigir_acceso_actual();
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

-- Reporte de ventas -----------------------------------------------------
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
  perform public.fn_exigir_acceso_actual();
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

-- Autorizacion (RLS) ----------------------------------------------------
alter table public.configuracion     enable row level security;
alter table public.estimaciones      enable row level security;
alter table public.estimacion_lineas enable row level security;
alter table public.producciones      enable row level security;
alter table public.ventas            enable row level security;
alter table public.venta_lineas      enable row level security;

create policy lectura_configuracion on public.configuracion
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_edita_configuracion on public.configuracion
  for update to authenticated
  using ((select public.fn_es_admin())) with check ((select public.fn_es_admin()));

create policy lectura_estimaciones on public.estimaciones
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_elimina_estimaciones on public.estimaciones
  for delete to authenticated using ((select public.fn_es_admin()));
create policy lectura_estimacion_lineas on public.estimacion_lineas
  for select to authenticated using ((select public.fn_tiene_acceso()));

create policy lectura_producciones on public.producciones
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_elimina_producciones on public.producciones
  for delete to authenticated using ((select public.fn_es_admin()));

create policy lectura_ventas on public.ventas
  for select to authenticated using ((select public.fn_tiene_acceso()));
create policy admin_elimina_ventas on public.ventas
  for delete to authenticated using ((select public.fn_es_admin()));
create policy lectura_venta_lineas on public.venta_lineas
  for select to authenticated using ((select public.fn_tiene_acceso()));

-- 403 explicito (ver 00011): sin esto un DELETE/UPDATE sin permiso
-- "funciona" sin afectar filas.
create trigger configuracion_solo_admin
  before update on public.configuracion
  for each statement execute function public.fn_exigir_admin();
create trigger estimaciones_eliminar_solo_admin
  before delete on public.estimaciones
  for each statement execute function public.fn_exigir_admin();
create trigger producciones_eliminar_solo_admin
  before delete on public.producciones
  for each statement execute function public.fn_exigir_admin();
create trigger ventas_eliminar_solo_admin
  before delete on public.ventas
  for each statement execute function public.fn_exigir_admin();

-- Privilegios -----------------------------------------------------------
-- Las tablas se leen por la API pero NO se insertan ni se editan directo.
revoke all on
  public.configuracion, public.estimaciones, public.estimacion_lineas,
  public.producciones, public.ventas, public.venta_lineas,
  public.v_stock_cuellos, public.v_costo_estimado_diseno
from anon, authenticated, public;

grant select on
  public.configuracion, public.estimaciones, public.estimacion_lineas,
  public.producciones, public.ventas, public.venta_lineas,
  public.v_stock_cuellos, public.v_costo_estimado_diseno
to authenticated;
grant update (tarifa_hora) on public.configuracion to authenticated;
grant delete on public.estimaciones, public.producciones, public.ventas to authenticated;

revoke execute on function
  public.fn_exigir_acceso_actual(),
  public.fn_validar_fecha_registro(date),
  public.fn_normalizar_talla(text),
  public.fn_texto_opcional(text, integer, text),
  public.fn_validar_rango(date, date),
  public.fn_grano(date, date, text),
  public.fn_registrar_venta(jsonb, jsonb),
  public.fn_guardar_estimacion(jsonb, jsonb),
  public.fn_registrar_produccion(jsonb),
  public.fn_dashboard(date, date),
  public.fn_actividad_reciente(integer),
  public.fn_resumen_periodo(date, date),
  public.fn_reporte_inventario(date, date, text),
  public.fn_reporte_produccion(date, date, text),
  public.fn_reporte_ventas(date, date, text)
from anon, authenticated, public;

grant execute on function
  public.fn_exigir_acceso_actual(),
  public.fn_validar_fecha_registro(date),
  public.fn_normalizar_talla(text),
  public.fn_texto_opcional(text, integer, text),
  public.fn_validar_rango(date, date),
  public.fn_grano(date, date, text),
  public.fn_registrar_venta(jsonb, jsonb),
  public.fn_guardar_estimacion(jsonb, jsonb),
  public.fn_registrar_produccion(jsonb),
  public.fn_dashboard(date, date),
  public.fn_actividad_reciente(integer),
  public.fn_resumen_periodo(date, date),
  public.fn_reporte_inventario(date, date, text),
  public.fn_reporte_produccion(date, date, text),
  public.fn_reporte_ventas(date, date, text)
to authenticated;

notify pgrst, 'reload schema';
