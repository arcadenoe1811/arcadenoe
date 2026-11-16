-- =====================================================================
-- Datos de ejemplo del inventario de conos (desarrollo local).
-- Se cargan con `npx supabase db reset` o, con docker-compose, al crear
-- la base. Se puede volver a ejecutar: no duplica nada.
--
-- * Agrega colores al catalogo (los que ya existan se respetan).
-- * Registra ~40 conos de distintos materiales y proveedores.
-- * Carga el stock como en la app: compras (con lote y costo), salidas a
--   produccion asociadas a cuellos/punos existentes y algun ajuste, en
--   orden cronologico durante los ultimos ~2 meses.
-- =====================================================================

-- Colores del catalogo -------------------------------------------------
insert into public.catalogo_colores (nombre, hex) values
  ('amarillo oro',     '#f2b705'),
  ('amarillo canario', '#ffe11a'),
  ('mostaza',          '#c99a06'),
  ('naranja',          '#ef6c00'),
  ('terracota',        '#b5532f'),
  ('vino',             '#7b1e2b'),
  ('guinda',           '#5c0f1f'),
  ('rosa palo',        '#e8b4b8'),
  ('fucsia',           '#c2185b'),
  ('lila',             '#a58cc4'),
  ('morado',           '#5b2a86'),
  ('verde bandera',    '#0b7a3b'),
  ('verde oliva',      '#6b7b2a'),
  ('verde botella',    '#0f4d32'),
  ('verde menta',      '#98d8b5'),
  ('verde limón',      '#9ccc3c'),
  ('turquesa',         '#1aa6a6'),
  ('azul marino',      '#14213d'),
  ('azul petróleo',    '#1f4e5f'),
  ('celeste bebé',     '#bfe3f2'),
  ('beige',            '#d8c7a3'),
  ('crema',            '#f3ead3'),
  ('café',             '#5d4037'),
  ('camel',            '#b8834a'),
  ('gris oxford',      '#3c3f44'),
  ('gris perla',       '#c9c9c9'),
  ('plata lurex',      '#c0c0c0'),
  ('dorado lurex',     '#c9a227')
on conflict (nombre) do nothing;

-- Conos ----------------------------------------------------------------
-- compra1 / compra2: conos de cada compra (hace ~58 y ~18 dias).
-- salidas: conos de cada salida a produccion. ajuste: conteo fisico (+/-).
create temporary table _conos_demo (
  codigo        text,
  nombre_color  text,
  hex           text,
  catalogo      text,
  codigo_color  text,
  familia       text,
  material      text,
  titulo        text,
  proveedor     text,
  peso_g        numeric,
  costo         numeric,
  minimo        integer,
  compra1       integer,
  compra2       integer,
  salidas       integer[],
  ajuste        integer,
  activo        boolean
);

insert into _conos_demo values
  ('CON-0001', 'Blanco óptico',    '#ffffff', 'blanco',           '1',  'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 6, 30, 24, '{8,6,7,5}', 0,  true),
  ('CON-0002', 'Negro',            '#1a1a1a', 'negro',            '2',  'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 6, 30, 20, '{9,8,6,4}', -1, true),
  ('CON-0003', 'Azul rey',         '#1f4fa3', 'azul',             '12', 'azules',    'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 4, 12,  0, '{4,3,2}',   0,  true),
  ('CON-0004', 'Celeste',          '#7ec8e3', 'celeste #34',      '34', 'azules',    'algodón',   '2/28', 'Textiles Andinos',      900, 110, 4, 10,  0, '{3,2}',     0,  true),
  ('CON-0005', 'Rojo',             '#c62828', 'rojo',             '20', 'rojos',     'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 4, 12,  4, '{4,3,3,2}', 0,  true),
  ('CON-0006', 'Gris jaspe',       '#9e9e9e', 'gris',             '8',  'neutros',   'mezcla',    '2/28', 'Textiles Andinos',      900,  95, 3,  6,  0, '{2,1}',     0,  true),
  ('CON-0007', 'Dorado conusec',   '#caa902', 'dorado conusec',   null, 'metalicos', 'lurex',     '1/15', 'Metálicos SA',          500, 140, 2,  4,  0, '{2,2}',     0,  true),
  ('CON-0008', 'Azul marino',      '#14213d', 'azul marino',      '15', 'azules',    'poliéster', '2/32', 'Hilos del Norte',      1000,  80, 4, 16,  0, '{3,2}',     0,  true),
  ('CON-0009', 'Gris rata',        '#838383', 'gris rata',        '9',  'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 4, 14,  0, '{3,4}',     0,  true),
  ('CON-0010', 'Amarillo oro',     '#f2b705', 'amarillo oro',     '30', 'amarillos', 'acrílico',  '2/32', 'Hilos del Norte',      1000,  92, 3,  8,  0, '{2,1}',     0,  true),
  ('CON-0011', 'Mostaza',          '#c99a06', 'mostaza',          '31', 'amarillos', 'algodón',   '2/28', 'Textiles Andinos',      900, 112, 3,  6,  0, '{2,2}',     0,  true),
  ('CON-0012', 'Naranja',          '#ef6c00', 'naranja',          '40', 'naranjas',  'acrílico',  '2/32', 'Hilandería San José',  1000,  88, 3,  8,  0, '{3}',       0,  true),
  ('CON-0013', 'Terracota',        '#b5532f', 'terracota',        '41', 'naranjas',  'mezcla',    '2/28', 'Fibras del Sur',        950,  98, 2,  5,  0, '{}',        0,  true),
  ('CON-0014', 'Vino',             '#7b1e2b', 'vino',             '22', 'rojos',     'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 4, 12, 10, '{5,4,3}',   0,  true),
  ('CON-0015', 'Guinda',           '#5c0f1f', 'guinda',           '23', 'rojos',     'algodón',   '2/28', 'Textiles Andinos',      900, 115, 2,  4,  0, '{2,2}',     0,  true),
  ('CON-0016', 'Rosa palo',        '#e8b4b8', 'rosa palo',        '50', 'rosas',     'acrílico',  '2/32', 'Hilandería San José',  1000,  88, 2,  6,  0, '{1}',       0,  true),
  ('CON-0017', 'Fucsia',           '#c2185b', 'fucsia',           '51', 'rosas',     'poliéster', '2/32', 'Hilandería San José',  1000,  82, 2,  4,  0, '{1,1}',     0,  true),
  ('CON-0018', 'Lila',             '#a58cc4', 'lila',             '60', 'morados',   'acrílico',  '2/32', 'Hilandería San José',  1000,  88, 2,  5,  0, '{}',        0,  true),
  ('CON-0019', 'Morado',           '#5b2a86', 'morado',           '61', 'morados',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 2,  6,  0, '{2}',       0,  true),
  ('CON-0020', 'Verde bandera',    '#0b7a3b', 'verde bandera',    '70', 'verdes',    'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 4, 14,  0, '{4,3}',     0,  true),
  ('CON-0021', 'Verde oliva',      '#6b7b2a', 'verde oliva',      '71', 'verdes',    'mezcla',    '2/28', 'Fibras del Sur',        950,  98, 2,  5,  0, '{1}',       0,  true),
  ('CON-0022', 'Verde botella',    '#0f4d32', 'verde botella',    '72', 'verdes',    'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 3,  8,  0, '{3,2,3}',   0,  true),
  ('CON-0023', 'Verde menta',      '#98d8b5', 'verde menta',      '73', 'verdes',    'algodón',   '2/28', 'Textiles Andinos',      900, 110, 2,  4,  0, '{}',        0,  true),
  ('CON-0024', 'Turquesa',         '#1aa6a6', 'turquesa',         '74', 'azules',    'poliéster', '2/32', 'Hilandería San José',  1000,  82, 2,  5,  0, '{2}',       0,  true),
  ('CON-0025', 'Azul petróleo',    '#1f4e5f', 'azul petróleo',    '16', 'azules',    'acrílico',  '2/32', 'Hilos del Norte',      1000,  90, 3,  8,  0, '{2}',       0,  true),
  ('CON-0026', 'Celeste bebé',     '#bfe3f2', 'celeste bebé',     '35', 'azules',    'algodón',   '2/28', 'Textiles Andinos',      900, 110, 3,  6,  0, '{3,1}',     0,  true),
  ('CON-0027', 'Beige',            '#d8c7a3', 'beige',            '80', 'neutros',   'algodón',   '2/28', 'Textiles Andinos',      900, 108, 3,  8,  0, '{2}',       0,  true),
  ('CON-0028', 'Crema',            '#f3ead3', 'crema',            '81', 'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 4, 12,  0, '{3,3}',     0,  true),
  ('CON-0029', 'Café',             '#5d4037', 'café',             '85', 'marrones',  'acrílico',  '2/32', 'Hilos del Norte',      1000,  88, 3,  8,  0, '{2,2}',     0,  true),
  ('CON-0030', 'Camel',            '#b8834a', 'camel',            '86', 'marrones',  'mezcla',    '2/28', 'Fibras del Sur',        950,  98, 2,  5,  0, '{1}',       0,  true),
  ('CON-0031', 'Gris oxford',      '#3c3f44', 'gris oxford',      '10', 'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 4, 14,  0, '{4,3}',     0,  true),
  ('CON-0032', 'Gris perla',       '#c9c9c9', 'gris perla',       '11', 'neutros',   'acrílico',  '2/32', 'Hilos del Norte',      1000,  85, 3,  6,  0, '{2,1}',     0,  true),
  ('CON-0033', 'Plata lurex',      '#c0c0c0', 'plata lurex',      null, 'metalicos', 'lurex',     '1/15', 'Metálicos SA',          500, 135, 2,  6,  0, '{1,1}',     0,  true),
  ('CON-0034', 'Dorado lurex',     '#c9a227', 'dorado lurex',     null, 'metalicos', 'lurex',     '1/15', 'Metálicos SA',          500, 140, 2,  5,  0, '{2}',       0,  true),
  ('CON-0035', 'Blanco algodón',   '#fafafa', 'blanco',           '1',  'neutros',   'algodón',   '2/28', 'Textiles Andinos',      900, 105, 4, 10,  0, '{3,2}',     0,  true),
  ('CON-0036', 'Negro algodón',    '#161616', 'negro',            '2',  'neutros',   'algodón',   '2/28', 'Textiles Andinos',      900, 105, 4, 10,  0, '{2,2,2}',   -1, true),
  ('CON-0037', 'Rojo intenso',     '#d32f2f', 'rojo',             '20', 'rojos',     'poliéster', '2/32', 'Hilandería San José',  1000,  80, 2,  4,  0, '{}',        0,  true),
  ('CON-0038', 'Azul rey algodón', '#1e4c9e', 'azul',             '12', 'azules',    'algodón',   '2/28', 'Textiles Andinos',      900, 112, 3,  6,  0, '{2}',       0,  true),
  ('CON-0039', 'Amarillo canario', '#ffe11a', 'amarillo canario', '32', 'amarillos', 'acrílico',  '2/32', 'Hilandería San José',  1000,  88, 2,  0,  0, '{}',        0,  true),
  ('CON-0040', 'Verde limón',      '#9ccc3c', 'verde limón',      '75', 'verdes',    'acrílico',  '2/32', 'Hilandería San José',  1000,  88, 2,  0,  0, '{}',        0,  false);

insert into public.conos (
  codigo, nombre_color, hex, color_catalogo_id, codigo_color, familia_color,
  material, titulo_hilo, proveedor, peso_por_cono_g, costo_por_cono, stock_minimo, activo
)
select d.codigo, d.nombre_color, d.hex, cc.id, d.codigo_color, d.familia,
       d.material, d.titulo, d.proveedor, d.peso_g, d.costo, d.minimo, d.activo
from _conos_demo d
left join public.catalogo_colores cc on cc.nombre = d.catalogo
on conflict (codigo) do nothing;

-- Movimientos (solo para conos que aun no tienen ninguno) ----------------
with base as (
  select d.*, c.id as cono_id,
         row_number() over (order by d.codigo)::int as n
  from _conos_demo d
  join public.conos c on c.codigo = d.codigo
  where not exists (select 1 from public.movimientos_cono m where m.cono_id = c.id)
),
piezas as (
  select id, row_number() over (order by codigo)::int - 1 as k,
         count(*) over ()::int as total
  from public.cuellos
  where activo
),
movs as (
  -- Primera compra
  select b.cono_id, b.n, 1 as orden, 'entrada'::public.tipo_movimiento_cono as tipo,
         b.compra1 as cantidad, current_date - 58 as fecha,
         'Compra F-' || (1200 + b.n) as referencia,
         upper(left(b.proveedor, 2)) || '-' || to_char(current_date - 58, 'YYMM') || lpad(b.n::text, 2, '0') as lote,
         b.proveedor, b.costo as costo_unitario, null::uuid as pieza_id
  from base b
  where b.compra1 > 0

  union all
  -- Reposicion (costo un 4% mas alto)
  select b.cono_id, b.n, 3, 'entrada', b.compra2, current_date - 18,
         'Compra F-' || (1300 + b.n),
         upper(left(b.proveedor, 2)) || '-' || to_char(current_date - 18, 'YYMM') || lpad(b.n::text, 2, '0'),
         b.proveedor, round(b.costo * 1.04, 2), null
  from base b
  where b.compra2 > 0

  union all
  -- Salidas a produccion, repartidas en el tiempo y asociadas a piezas
  select b.cono_id, b.n, 2, 'salida', s.cantidad,
         current_date - 50 + ((s.i - 1) * 12 + b.n % 5)::int,
         'Producción', null, null, null,
         (select p.id from piezas p where p.k = (b.n * 3 + s.i::int) % p.total)
  from base b
  cross join lateral unnest(b.salidas) with ordinality as s (cantidad, i)

  union all
  -- Conteo fisico
  select b.cono_id, b.n, 4, 'ajuste', b.ajuste, current_date - 2,
         'Conteo físico', null, null, null, null
  from base b
  where b.ajuste <> 0
)
insert into public.movimientos_cono (
  cono_id, tipo, cantidad, fecha, referencia, lote, proveedor, costo_unitario,
  pieza_id, created_at
)
select cono_id, tipo, cantidad, fecha, referencia, lote, proveedor, costo_unitario,
       pieza_id, fecha + time '08:00' + make_interval(mins => n * 7 + orden)
from movs
order by fecha, orden, n;

drop table _conos_demo;
