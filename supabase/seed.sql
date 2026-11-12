-- Datos de ejemplo para desarrollo local (se cargan con: npx supabase db reset)

insert into public.catalogo_colores (nombre, hex) values
  ('blanco',      '#ffffff'),
  ('negro',       '#1a1a1a'),
  ('azul',        '#1f4fa3'),
  ('celeste #34', '#7ec8e3'),
  ('rojo',        '#c62828'),
  ('gris',        '#9e9e9e')
on conflict (nombre) do nothing;

select public.fn_guardar_cuello(
  '{"codigo":"maza4","tipo":"liso","cantidad_hilos":3,"posicion_cuerpo":4,"medidas":[18,17,16,15,14],"notas":"Cuello liso azul, cuerpo completo"}',
  '[{"zona":"cuerpo","color":"azul","cantidad_hilos":3,"orden":1}]'
);

select public.fn_guardar_cuello(
  '{"codigo":"maz4t5","nombre":"Maza tubular","tipo":"tubular","cantidad_hilos":3,"posicion_cuerpo":4,"posicion_tubular":5,"pasadas_tubular":12,"medidas":[18,17,16],"notas":"tubular blanco(4) azul(4) conusec. Cuerpo gaspeado: 1 negro, 1 celeste #34"}',
  '[{"zona":"tubular","color":"blanco","cantidad_hilos":4,"orden":1},
    {"zona":"tubular","color":"azul","cantidad_hilos":4,"orden":2},
    {"zona":"cuerpo","color":"negro","cantidad_hilos":1,"orden":1},
    {"zona":"cuerpo","color":"celeste #34","cantidad_hilos":1,"orden":2}]'
);

select public.fn_guardar_cuello(
  '{"codigo":"cous","tipo":"gaspeado","cantidad_hilos":2,"medidas":[16,15,14],"notas":"Gaspeado alternado rojo y blanco"}',
  '[{"zona":"cuerpo","color":"rojo","cantidad_hilos":1,"orden":1},
    {"zona":"cuerpo","color":"blanco","cantidad_hilos":1,"orden":2}]'
);
