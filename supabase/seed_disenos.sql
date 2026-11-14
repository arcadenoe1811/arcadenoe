-- 40 piezas de ejemplo (cuellos y puños) con diseño Jacquard.
-- Muestran: diseño propio, herencia (siempre cuello <-> puño), mapa de
-- colores (padre e hijo con distinta cantidad), cambios del hijo (texto,
-- color, líneas), plantillas, una cadena puño -> cuello -> puño y cuellos
-- que usan un puño existente de otro producto (con nota).
--
-- GENERADO con scripts/generar_seed_disenos.mjs y validado con las reglas
-- de packages/shared. No editar a mano: cambia el script y regenera.
-- Se puede ejecutar varias veces: salta las piezas que ya existen.

insert into public.tipos_cuello (nombre) values
  ('con nombre'), ('doble linea despues del tubular'), ('gaspeado'), ('liso'), ('tubular')
on conflict (nombre) do nothing;

-- 01. cuello cous2t (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"cous2t","tipo":"con nombre","nombre":"Conusec mitad","notas":"Texto CONUSEC con tubular rojo de 20 pasadas.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17,16,15],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"CONUSEC","fondo":"#0e1a4a","color_texto":"#ffffff","desplazamiento":-1,"debajo":[{"tipo":"tubular","pasadas":20,"color":"#c62828"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'cous2t');

-- 02. cuello cpg (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"cpg","tipo":"con nombre","nombre":"CPG","notas":"Solo el nombre, sin líneas.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true}],"medidas":[16,15],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"CPG","fondo":"#8e0d42","color_texto":"#ffffff","desplazamiento":-7,"debajo":[],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"corinto","codigo":"16","hex":"#8e0d42","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'cpg');

-- 03. cuello maz4d3 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"maz4d3","tipo":"doble linea despues del tubular","nombre":"Doble línea después del tubular","notas":"Diseño base de líneas que usan varios puños de otros productos.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"medidas":[18,17,16,15],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#1f4fa3","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#c62828"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#c62828"}],"arriba":[{"tipo":"linea","pasadas":3,"color":"#c62828"},{"tipo":"linea","pasadas":3,"color":"#ffffff"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'maz4d3');

-- 04. cuello maz4t5 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"maz4t5","tipo":"tubular","nombre":"Maza tubular","notas":"Liso con tubular blanco.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false}],"medidas":[18,17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#0e1a4a","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#ffffff"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'maz4t5');

-- 05. cuello ven01 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"ven01","tipo":"con nombre","nombre":"Venecia","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"VENECIA","fondo":"#0e1a4a","color_texto":"#f1c40f","desplazamiento":-2,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#c8a415"},{"tipo":"linea","pasadas":4,"color":"#f1c40f"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#c8a415"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'ven01');

-- 06. cuello aur02 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"aur02","tipo":"doble linea despues del tubular","nombre":"Aurora","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[16,15,14],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"AURORA","fondo":"#2a9d8f","color_texto":"#ffd166","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#ffd166"},{"tipo":"linea","pasadas":2,"color":"#264653"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#ffd166"},{"tipo":"linea","pasadas":2,"color":"#264653"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"turquesa","codigo":"53","hex":"#2a9d8f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'aur02');

-- 07. cuello atl03 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"atl03","tipo":"con nombre","nombre":"Atlas","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"ATLAS","fondo":"#2d6a4f","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#95d5b2"},{"tipo":"linea","pasadas":4,"color":"#95d5b2"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#95d5b2"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#95d5b2","desplazamiento":0}]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"verde","codigo":"52","hex":"#2d6a4f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"verde limón","codigo":"56","hex":"#95d5b2","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'atl03');

-- 08. cuello fen04 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"fen04","tipo":"con nombre","nombre":"Fénix","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[17,16,15],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"FENIX","fondo":"#6d1a36","color_texto":"#f3e9d2","desplazamiento":-2,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#e76f51"},{"tipo":"linea","pasadas":4,"color":"#f3e9d2"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#e76f51"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"coral","codigo":"41","hex":"#e76f51","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'fen04');

-- 09. cuello con05 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"con05","tipo":"con nombre","nombre":"Cóndor","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"CONDOR","fondo":"#1a1a1a","color_texto":"#f1c40f","desplazamiento":-1,"debajo":[{"tipo":"tubular","pasadas":20,"color":"#9e9e9e"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris","codigo":"8","hex":"#9e9e9e","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'con05');

-- 10. cuello gal06 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"gal06","tipo":"con nombre","nombre":"Galaxia","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[16,15,14,13],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"GALAXIA","fondo":"#5b2a86","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#7ec8e3"},{"tipo":"linea","pasadas":4,"color":"#7ec8e3"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#7ec8e3"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#7ec8e3","desplazamiento":0}]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"morado","codigo":"60","hex":"#5b2a86","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'gal06');

-- 11. cuello ray07 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"ray07","tipo":"gaspeado","nombre":"Rayas","notas":"Rayas alternadas blanco y rojo.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"medidas":[18,17,16,15,14],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#1f4fa3","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#c62828"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#c62828"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#c62828"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#c62828"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'ray07');

-- 12. cuello lis08 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"lis08","tipo":"liso","nombre":"Liso azul","notas":"Liso base: varios puños lo usan con sus propios colores.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false}],"medidas":[18,17,16,15,14,13,12],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#1f4fa3","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#ffffff"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'lis08');

-- 13. cuello sol09 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"sol09","tipo":"con nombre","nombre":"Solar","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[16,15,14],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"SOLAR","fondo":"#f4a261","color_texto":"#ffffff","desplazamiento":-1,"debajo":[{"tipo":"tubular","pasadas":20,"color":"#264653"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"naranja","codigo":"33","hex":"#f4a261","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'sol09');

-- 14. cuello zaf10 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"zaf10","tipo":"con nombre","nombre":"Zafiro","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"ZAFIRO","fondo":"#0e1a4a","color_texto":"#7ec8e3","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#7ec8e3"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#7ec8e3"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'zaf10');

-- 15. cuello inc11 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"inc11","tipo":"con nombre","nombre":"Inca","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"INCA","fondo":"#6f4e37","color_texto":"#ffd166","desplazamiento":-2,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#c62828"},{"tipo":"linea","pasadas":4,"color":"#ffd166"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#c62828"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"café","codigo":"70","hex":"#6f4e37","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'inc11');

-- 16. cuello luna12 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"luna12","tipo":"con nombre","nombre":"Luna","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true}],"medidas":[15,14,13],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"LUNA","fondo":"#264653","color_texto":"#f3e9d2","desplazamiento":-7,"debajo":[],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'luna12');

-- 17. cuello ros13 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"ros13","tipo":"doble linea despues del tubular","nombre":"Rosa","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"medidas":[16,15,14],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#e7a1b0","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#6d1a36"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#6d1a36"}],"arriba":[{"tipo":"linea","pasadas":3,"color":"#6d1a36"},{"tipo":"linea","pasadas":3,"color":"#ffffff"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"rosado","codigo":"62","hex":"#e7a1b0","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'ros13');

-- 18. cuello roma17 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"roma17","tipo":"con nombre","nombre":"Roma","notas":"Copiado de Venecia como PLANTILLA: si Venecia cambia, Roma no cambia.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[17,16,15],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"ROMA","fondo":"#6d1a36","color_texto":"#f3e9d2","desplazamiento":-2,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#c8a415"},{"tipo":"linea","pasadas":4,"color":"#f3e9d2"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#c8a415"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'roma17');

-- 19. cuello nor18 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"nor18","tipo":"con nombre","nombre":"Norte","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17,16],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"NORTE","fondo":"#1a1a1a","color_texto":"#7ec8e3","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"},{"tipo":"linea","pasadas":4,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#ffffff"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#ffffff","desplazamiento":0}]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'nor18');

-- 20. cuello bri19 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"bri19","tipo":"con nombre","nombre":"Brisa","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[16,15,14],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"BRISA","fondo":"#2a9d8f","color_texto":"#ffffff","desplazamiento":-7,"debajo":[],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"turquesa","codigo":"53","hex":"#2a9d8f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'bri19');

-- 21. cuello pac20 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"pac20","tipo":"con nombre","nombre":"Pacífico","notas":null,"cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"medidas":[18,17],"tallas":null,"imagen_url":null,"diseno":{"v":1,"texto":"PACIFICO","fondo":"#0e1a4a","color_texto":"#ffffff","desplazamiento":-1,"debajo":[{"tipo":"tubular","pasadas":20,"color":"#7ec8e3"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'pac20');

-- 22. puno maz4d3 (hereda de cuello maz4d3)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"maz4d3","tipo":"doble linea despues del tubular","nombre":"Doble línea después del tubular","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'maz4d3')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'maz4d3');

-- 23. puno maz4t5 (hereda de cuello maz4t5)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"maz4t5","tipo":"tubular","nombre":"Maza tubular","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'maz4t5')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'maz4t5');

-- 24. puno ven01 (hereda de cuello ven01)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"ven01","tipo":"con nombre","nombre":"Venecia","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'ven01')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'ven01');

-- 25. puno aur02 (hereda de cuello aur02)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"aur02","tipo":"doble linea despues del tubular","nombre":"Aurora","notas":"Mismo diseño, texto corto AUR porque el puño es más pequeño.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg"],"medidas":null,"imagen_url":null,"overrides":{"texto":"AUR"},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'aur02')),
  '[{"zona":"cuerpo","posicion":1,"color":"turquesa","codigo":"53","hex":"#2a9d8f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'aur02');

-- 26. puno atl03 (hereda de cuello atl03)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"atl03","tipo":"con nombre","nombre":"Atlas","notas":"Tiene un 4.º color: letras amarillas en vez de blancas.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false},{"posicion":8,"letra":true}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{"color_texto":"#ffd166"},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'atl03')),
  '[{"zona":"cuerpo","posicion":1,"color":"verde","codigo":"52","hex":"#2d6a4f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"verde limón","codigo":"56","hex":"#95d5b2","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":4,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'atl03');

-- 27. puno fen04 (hereda de cuello fen04)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"fen04","tipo":"con nombre","nombre":"Fénix","notas":"Texto abreviado FNX.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg","pee"],"medidas":null,"imagen_url":null,"overrides":{"texto":"FNX"},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'fen04')),
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"coral","codigo":"41","hex":"#e76f51","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'fen04');

-- 28. puno con05 (hereda de cuello con05)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"con05","tipo":"con nombre","nombre":"Cóndor","notas":"Solo 2 colores: el tubular gris del cuello sale dorado.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true}],"tallas":["pee","pex"],"medidas":null,"imagen_url":null,"overrides":{"mapa_colores":{"3":2}},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'con05')),
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'con05');

-- 29. puno gal06 (hereda de cuello gal06)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"gal06","tipo":"con nombre","nombre":"Galaxia","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pp","pg"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'gal06')),
  '[{"zona":"cuerpo","posicion":1,"color":"morado","codigo":"60","hex":"#5b2a86","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'gal06');

-- 30. puno ray07 (hereda de cuello ray07)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"ray07","tipo":"gaspeado","nombre":"Rayas","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'ray07')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'ray07');

-- 31. puno lis08 (hereda de cuello lis08)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"lis08","tipo":"liso","nombre":"Liso azul","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false}],"tallas":["pp","pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'lis08')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul","codigo":"30","hex":"#1f4fa3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'lis08');

-- 32. puno zaf10 (hereda de cuello zaf10)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"zaf10","tipo":"con nombre","nombre":"Zafiro","notas":"Colores cruzados: letras blancas y líneas celestes (al revés que el cuello).","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{"mapa_colores":{"2":3,"3":2}},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'zaf10')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'zaf10');

-- 33. puno nor18 (hereda de cuello nor18)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"nor18","tipo":"con nombre","nombre":"Norte","notas":"Texto corto NOR.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg","pee","pex"],"medidas":null,"imagen_url":null,"overrides":{"texto":"NOR"},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'nor18')),
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'nor18');

-- 34. puno luna12 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"luna12","tipo":"liso","nombre":"Luna (puño)","notas":"Mismo código que el cuello Luna, pero diseño propio (no hereda).","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false}],"tallas":["pp","pg"],"medidas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#264653","color_texto":"#f3e9d2","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#f3e9d2"}],"arriba":[],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'luna12');

-- 35. puno ros13 (hereda de cuello ros13)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"ros13","tipo":"doble linea despues del tubular","nombre":"Rosa","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"tallas":["pg"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'ros13')),
  '[{"zona":"cuerpo","posicion":1,"color":"rosado","codigo":"62","hex":"#e7a1b0","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'ros13');

-- 36. puno roma17 (hereda de cuello roma17)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"roma17","tipo":"con nombre","nombre":"Roma","notas":"Igual a su cuello.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":true},{"posicion":6,"letra":false}],"tallas":["pg","pee"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'roma17')),
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"44","hex":"#6d1a36","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"4","hex":"#f3e9d2","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'roma17');

-- 37. puno zig15 (diseño propio)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"zig15","tipo":"tubular","nombre":"Zigzag","notas":"Diseño nacido como puño; el cuello zig15 lo hereda.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"tallas":["pp","pg","pee"],"medidas":null,"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#264653","color_texto":"#e76f51","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#e76f51"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#e76f51"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#e76f51"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#e76f51"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"medio":[]},"overrides":{}}'::jsonb,
  '[{"zona":"cuerpo","posicion":1,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"coral","codigo":"41","hex":"#e76f51","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'zig15');

-- 38. cuello zig15 (hereda de puno zig15)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"zig15","tipo":"tubular","nombre":"Zigzag","notas":"Cuello que hereda de su puño.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"medidas":[16,15,14],"tallas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'puno' and codigo = 'zig15')),
  '[{"zona":"cuerpo","posicion":1,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"coral","codigo":"41","hex":"#e76f51","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'zig15');

-- 39. cuello zig16 (hereda de puno zig15)
select public.fn_guardar_cuello(
  '{"pieza":"cuello","codigo":"zig16","tipo":"tubular","nombre":"Zigzag nocturno","notas":"Hereda del puño zig15 con otros colores.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"medidas":[18,17],"tallas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'puno' and codigo = 'zig15')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'cuello' and codigo = 'zig16');

-- 40. puno zig16 (hereda de cuello zig16)
select public.fn_guardar_cuello(
  '{"pieza":"puno","codigo":"zig16","tipo":"tubular","nombre":"Zigzag nocturno","notas":"Cadena de 3: puño zig15 → cuello zig16 → este puño. Cambia el puño zig15 y se ve aquí.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":4,"letra":false},{"posicion":6,"letra":false}],"tallas":["pee","pex"],"medidas":null,"imagen_url":null,"overrides":{},"diseno":null}'::jsonb || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = 'cuello' and codigo = 'zig16')),
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"3","hex":"#0e1a4a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"29","hex":"#ffd166","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'::jsonb
)
where not exists (select 1 from public.cuellos where pieza = 'puno' and codigo = 'zig16');

-- ===== Cuellos que usan un puño existente =====

-- cuello cous2t usa el puño maz4d3
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'maz4d3'),
  puno_nota = 'Mismo diseño que el puño maz4d3, tejido con los colores de cous2t (azul marino, blanco, rojo).'
where pieza = 'cuello' and codigo = 'cous2t' and puno_id is null;

-- cuello cpg usa el puño maz4d3
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'maz4d3'),
  puno_nota = 'Mismo diseño que el puño maz4d3 con los colores de cpg. Solo hay 2 colores: lo rojo del puño va en blanco.'
where pieza = 'cuello' and codigo = 'cpg' and puno_id is null;

-- cuello sol09 usa el puño ray07
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'ray07'),
  puno_nota = 'Las rayas del puño ray07 con los colores de Solar (naranja, blanco, carbón).'
where pieza = 'cuello' and codigo = 'sol09' and puno_id is null;

-- cuello inc11 usa el puño lis08
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'lis08'),
  puno_nota = 'Puño liso de lis08 en café y amarillo; a veces se pide con el tubular rojo.'
where pieza = 'cuello' and codigo = 'inc11' and puno_id is null;

-- cuello bri19 usa el puño maz4d3
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'maz4d3'),
  puno_nota = 'Mismo diseño que el puño maz4d3, tejido con los colores de bri19 (turquesa, blanco, carbón).'
where pieza = 'cuello' and codigo = 'bri19' and puno_id is null;

-- cuello pac20 usa el puño zaf10
update public.cuellos set
  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = 'zaf10'),
  puno_nota = 'Usa el puño de Zafiro tal cual (mismos colores): no lleva el nombre PACIFICO.'
where pieza = 'cuello' and codigo = 'pac20' and puno_id is null;
