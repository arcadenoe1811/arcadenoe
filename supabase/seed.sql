-- Datos de ejemplo para desarrollo local (se cargan con: npx supabase db reset)

insert into public.catalogo_colores (nombre, hex) values
  ('blanco',      '#ffffff'),
  ('negro',       '#1a1a1a'),
  ('azul',        '#1f4fa3'),
  ('celeste #34', '#7ec8e3'),
  ('rojo',        '#c62828'),
  ('gris',        '#9e9e9e')
on conflict (nombre) do nothing;

-- Las piezas de ejemplo (cuellos y puños) están en seed_disenos.sql.
