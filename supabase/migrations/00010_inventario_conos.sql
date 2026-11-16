-- =====================================================================
-- 00010 - Inventario de conos de hilo
--
-- * conos:            cada tipo de cono (color + material + titulo +
--                     proveedor). Lleva el stock actual en conos enteros.
-- * movimientos_cono: entradas, salidas y ajustes. Es la UNICA forma de
--                     cambiar el stock: un trigger lo actualiza al
--                     insertar el movimiento. Los movimientos no se editan
--                     ni se borran; un error se corrige con un ajuste.
--
-- Integracion con el disenador de cuellos/punos:
-- * color_catalogo_id enlaza el cono con catalogo_colores.
-- * codigo_color es el numero de color del cono (ej: "34"), el mismo que
--   se escribe en colores_cuello.codigo. Con eso (o con el hex) el
--   disenador puede saber si hay existencia de un color.
-- * movimientos_cono.pieza_id asocia una salida al cuello/puno producido.
-- =====================================================================

create type public.tipo_movimiento_cono as enum ('entrada', 'salida', 'ajuste');

-- Tabla: conos ----------------------------------------------------------
create table public.conos (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text not null,
  nombre_color       text not null,
  hex                text not null,
  color_catalogo_id  uuid references public.catalogo_colores (id) on delete set null,
  codigo_color       text,
  familia_color      text not null default 'neutros',
  material           text not null,
  titulo_hilo        text,
  proveedor          text,
  peso_por_cono_g    numeric(8, 1),
  costo_por_cono     numeric(12, 2),
  costo_por_kilo     numeric(12, 2) generated always as (
    case when peso_por_cono_g > 0 and costo_por_cono is not null
         then round(costo_por_cono * 1000 / peso_por_cono_g, 2) end
  ) stored,
  stock_actual       integer not null default 0,
  stock_minimo       integer not null default 0,
  estado             text generated always as (
    case when stock_actual = 0            then 'agotado'
         when stock_actual <= stock_minimo then 'bajo'
         else 'disponible' end
  ) stored,
  valor_stock        numeric(14, 2) generated always as (
    stock_actual * coalesce(costo_por_cono, 0)
  ) stored,
  imagen_url         text,
  notas              text,
  activo             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,

  constraint conos_codigo_key unique (codigo),
  constraint conos_codigo_formato
    check (codigo = upper(btrim(codigo)) and length(codigo) between 1 and 20),
  constraint conos_nombre_color_largo
    check (length(btrim(nombre_color)) between 1 and 60),
  constraint conos_hex_formato check (hex ~ '^#[0-9a-f]{6}$'),
  constraint conos_codigo_color_largo
    check (codigo_color is null or length(btrim(codigo_color)) between 1 and 20),
  constraint conos_familia_color_valida
    check (familia_color in ('rojos', 'naranjas', 'amarillos', 'verdes', 'azules',
                             'morados', 'rosas', 'marrones', 'neutros', 'metalicos')),
  constraint conos_material_formato
    check (material = lower(btrim(material)) and length(material) between 1 and 40),
  constraint conos_titulo_hilo_largo
    check (titulo_hilo is null or length(btrim(titulo_hilo)) between 1 and 20),
  constraint conos_proveedor_largo
    check (proveedor is null or length(btrim(proveedor)) between 1 and 80),
  constraint conos_peso_rango
    check (peso_por_cono_g is null or peso_por_cono_g between 1 and 99999),
  constraint conos_costo_rango
    check (costo_por_cono is null or costo_por_cono between 0 and 9999999),
  constraint conos_stock_no_negativo check (stock_actual >= 0),
  constraint conos_stock_minimo_rango check (stock_minimo between 0 and 99999),
  constraint conos_notas_largo check (notas is null or length(notas) <= 2000),
  constraint conos_imagen_url_http
    check (imagen_url is null or imagen_url ~* '^https?://')
);

comment on table  public.conos                   is 'Tipos de cono de hilo en inventario';
comment on column public.conos.codigo            is 'Codigo unico del cono (ej: CON-0001)';
comment on column public.conos.codigo_color      is 'Numero de color del cono (ej: 34); coincide con colores_cuello.codigo';
comment on column public.conos.color_catalogo_id is 'Color del catalogo que usa el disenador';
comment on column public.conos.peso_por_cono_g   is 'Peso de hilo por cono, en gramos';
comment on column public.conos.stock_actual      is 'Conos disponibles. Solo lo cambian los movimientos';
comment on column public.conos.estado            is 'disponible | bajo (<= stock minimo) | agotado';

create index conos_familia_idx       on public.conos (familia_color) where activo;
create index conos_material_idx      on public.conos (material) where activo;
create index conos_codigo_color_idx  on public.conos (codigo_color) where codigo_color is not null;
create index conos_catalogo_idx      on public.conos (color_catalogo_id) where color_catalogo_id is not null;

create trigger conos_updated_at
  before update on public.conos
  for each row execute function public.fn_actualizar_updated_at();

-- El stock no se escribe a mano: un insert/update directo (profundidad de
-- trigger 1) conserva el valor; solo el trigger de movimientos lo cambia.
create or replace function public.fn_proteger_stock_cono()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if pg_trigger_depth() = 1 then
    if tg_op = 'INSERT' then
      new.stock_actual := 0;
    else
      new.stock_actual := old.stock_actual;
    end if;
  end if;
  return new;
end;
$$;

create trigger conos_proteger_stock
  before insert or update of stock_actual on public.conos
  for each row execute function public.fn_proteger_stock_cono();

-- Tabla: movimientos_cono -----------------------------------------------
create table public.movimientos_cono (
  id                uuid primary key default gen_random_uuid(),
  cono_id           uuid not null references public.conos (id) on delete restrict,
  tipo              public.tipo_movimiento_cono not null,
  cantidad          integer not null,
  fecha             date not null default current_date,
  referencia        text,
  pieza_id          uuid references public.cuellos (id) on delete set null,
  lote              text,
  proveedor         text,
  costo_unitario    numeric(12, 2),
  stock_resultante  integer,
  notas             text,
  usuario_id        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),

  -- Entradas y salidas: cantidad positiva. Ajuste: diferencia con signo.
  constraint movimientos_cono_cantidad_valida
    check (cantidad <> 0 and cantidad between -99999 and 99999
           and (tipo = 'ajuste' or cantidad > 0)),
  constraint movimientos_cono_solo_entrada
    check (tipo = 'entrada' or (lote is null and proveedor is null and costo_unitario is null)),
  constraint movimientos_cono_pieza_solo_salida
    check (pieza_id is null or tipo = 'salida'),
  constraint movimientos_cono_costo_rango
    check (costo_unitario is null or costo_unitario between 0 and 9999999),
  constraint movimientos_cono_referencia_largo
    check (referencia is null or length(referencia) <= 120),
  constraint movimientos_cono_lote_largo
    check (lote is null or length(lote) <= 60),
  constraint movimientos_cono_proveedor_largo
    check (proveedor is null or length(proveedor) <= 80),
  constraint movimientos_cono_notas_largo
    check (notas is null or length(notas) <= 1000)
);

comment on table  public.movimientos_cono                  is 'Entradas, salidas y ajustes de stock de conos';
comment on column public.movimientos_cono.cantidad         is 'Conos (positivo); en ajustes, diferencia con signo';
comment on column public.movimientos_cono.pieza_id         is 'Cuello/puno producido con esta salida';
comment on column public.movimientos_cono.stock_resultante is 'Stock del cono despues de este movimiento';

create index movimientos_cono_cono_idx  on public.movimientos_cono (cono_id, fecha desc, created_at desc);
create index movimientos_cono_fecha_idx on public.movimientos_cono (created_at desc);
create index movimientos_cono_pieza_idx on public.movimientos_cono (pieza_id) where pieza_id is not null;

-- Aplica el movimiento al stock (con bloqueo de la fila del cono, para que
-- dos salidas simultaneas no dejen el stock negativo). En entradas con
-- costo, ese costo pasa a ser el costo actual del cono.
create or replace function public.fn_aplicar_movimiento_cono()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_stock integer;
  v_delta integer := case when new.tipo = 'salida' then -new.cantidad else new.cantidad end;
begin
  select stock_actual into v_stock
  from public.conos
  where id = new.cono_id
  for update;

  if not found then
    raise exception 'Cono no encontrado' using errcode = 'P0002';
  end if;

  if v_stock + v_delta < 0 then
    raise exception 'No hay suficiente stock: hay % conos y se quieren sacar %.',
      v_stock, abs(v_delta)
      using errcode = '23514';
  end if;

  update public.conos set
    stock_actual   = v_stock + v_delta,
    costo_por_cono = case when new.tipo = 'entrada' and new.costo_unitario is not null
                          then new.costo_unitario else costo_por_cono end
  where id = new.cono_id;

  new.stock_resultante := v_stock + v_delta;
  return new;
end;
$$;

create trigger movimientos_cono_aplicar
  before insert on public.movimientos_cono
  for each row execute function public.fn_aplicar_movimiento_cono();

-- Guardar cono ----------------------------------------------------------
-- Crea (sin id) o actualiza (con id) un cono. Al crear, el codigo vacio se
-- genera (CON-0001, CON-0002...) y el stock inicial se registra como una
-- entrada, todo en una sola transaccion.
create or replace function public.fn_guardar_cono(
  p_cono jsonb,
  p_stock_inicial integer default 0
)
returns public.conos
language plpgsql
set search_path = public
as $$
declare
  v_id     uuid := nullif(p_cono ->> 'id', '')::uuid;
  v_datos  public.conos;
  v_codigo text;
  v_cono   public.conos;
begin
  v_datos  := jsonb_populate_record(null::public.conos, p_cono - 'stock_actual');
  v_codigo := nullif(upper(btrim(coalesce(v_datos.codigo, ''))), '');

  if v_id is null then
    if v_codigo is null then
      select 'CON-' || lpad((coalesce(max(substring(codigo from '^CON-(\d+)$')::int), 0) + 1)::text, 4, '0')
        into v_codigo
      from public.conos;
    end if;

    insert into public.conos (
      codigo, nombre_color, hex, color_catalogo_id, codigo_color, familia_color,
      material, titulo_hilo, proveedor, peso_por_cono_g, costo_por_cono,
      stock_minimo, imagen_url, notas, activo
    ) values (
      v_codigo, v_datos.nombre_color, v_datos.hex, v_datos.color_catalogo_id,
      v_datos.codigo_color, coalesce(v_datos.familia_color, 'neutros'),
      v_datos.material, v_datos.titulo_hilo, v_datos.proveedor,
      v_datos.peso_por_cono_g, v_datos.costo_por_cono,
      coalesce(v_datos.stock_minimo, 0), v_datos.imagen_url, v_datos.notas,
      coalesce(v_datos.activo, true)
    )
    returning * into v_cono;

    if coalesce(p_stock_inicial, 0) > 0 then
      insert into public.movimientos_cono (cono_id, tipo, cantidad, referencia, proveedor, costo_unitario)
      values (v_cono.id, 'entrada', p_stock_inicial, 'Stock inicial',
              v_cono.proveedor, v_cono.costo_por_cono);
      select * into v_cono from public.conos where id = v_cono.id;
    end if;
  else
    update public.conos set
      codigo            = coalesce(v_codigo, conos.codigo),
      nombre_color      = v_datos.nombre_color,
      hex               = v_datos.hex,
      color_catalogo_id = v_datos.color_catalogo_id,
      codigo_color      = v_datos.codigo_color,
      familia_color     = coalesce(v_datos.familia_color, conos.familia_color),
      material          = v_datos.material,
      titulo_hilo       = v_datos.titulo_hilo,
      proveedor         = v_datos.proveedor,
      peso_por_cono_g   = v_datos.peso_por_cono_g,
      costo_por_cono    = v_datos.costo_por_cono,
      stock_minimo      = coalesce(v_datos.stock_minimo, conos.stock_minimo),
      imagen_url        = v_datos.imagen_url,
      notas             = v_datos.notas,
      activo            = coalesce(v_datos.activo, conos.activo)
    where conos.id = v_id
    returning * into v_cono;

    if not found then
      raise exception 'Cono no encontrado' using errcode = 'P0002';
    end if;
  end if;

  return v_cono;
end;
$$;

-- Seguridad: solo usuarios autenticados -------------------------------
alter table public.conos            enable row level security;
alter table public.movimientos_cono enable row level security;

create policy usuario_autenticado_conos
  on public.conos for all to authenticated using (true) with check (true);

-- Movimientos: se leen y se registran; no se editan ni se borran.
create policy usuario_autenticado_leer_movimientos
  on public.movimientos_cono for select to authenticated using (true);
create policy usuario_autenticado_registrar_movimientos
  on public.movimientos_cono for insert to authenticated with check (true);

revoke all on public.conos, public.movimientos_cono from anon;
revoke update, delete on public.movimientos_cono from authenticated;
revoke execute on function public.fn_guardar_cono(jsonb, integer) from anon, public;
grant  execute on function public.fn_guardar_cono(jsonb, integer) to authenticated;

notify pgrst, 'reload schema';
