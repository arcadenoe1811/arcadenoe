-- 50 cuellos de ejemplo con diseño Jacquard (en vez de imagen) y todos
-- los datos técnicos llenos: hilos, posiciones del cuerpo (con el color de
-- letra marcado), medidas, colores por zona (nombre, tono, código de cono,
-- hilos), tubular y notas. El diseño solo usa los colores del cuerpo.
--
-- Generado y validado con las reglas de packages/shared (validarCuello,
-- validarColoresCuello, validarDiseno, coloresFueraDeLista).
-- Se puede ejecutar varias veces: salta los códigos que ya existen.
--   docker exec -i inventario-cuellos-db-1 psql -U postgres -d postgres < supabase/seed_disenos.sql

insert into public.tipos_cuello (nombre) values
  ('con nombre'),
  ('doble linea despues del tubular'),
  ('gaspeado'),
  ('liso'),
  ('tubular')
on conflict (nombre) do nothing;

-- 01. Venecia (clasico)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-01-venecia","tipo":"con nombre","nombre":"Venecia","notas":"Diseño \"clasico\". Colores del cuerpo: azul noche #12 (pos. 1), dorado #27 (pos. 4, letra), mostaza #28 (pos. 7). Tubular mostaza de 10 pasadas. Texto: VENECIA.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"VENECIA","fondo":"#1a1a2e","color_texto":"#f1c40f","desplazamiento":-2,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#c8a415"},{"tipo":"linea","pasadas":4,"color":"#f1c40f"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#c8a415"}],"medio":[]},"posicion_tubular":7,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul noche","codigo":"12","hex":"#1a1a2e","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-01-venecia');

-- 02. Aurora (franjas-dobles)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-02-aurora","tipo":"doble linea despues del tubular","nombre":"Aurora","notas":"Diseño \"franjas-dobles\". Colores del cuerpo: verde agua #53 (pos. 2), arena #24 (pos. 5, letra), carbón #5 (pos. 8). Tubular carbón de 10 pasadas. Texto: AURORA.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"AURORA","fondo":"#2a9d8f","color_texto":"#e9c46a","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#2a9d8f"},{"tipo":"linea","pasadas":2,"color":"#264653"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#2a9d8f"},{"tipo":"linea","pasadas":2,"color":"#264653"}],"medio":[]},"posicion_tubular":8,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde agua","codigo":"53","hex":"#2a9d8f","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"arena","codigo":"24","hex":"#e9c46a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-02-aurora');

-- 03. Atlas (linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-03-atlas","tipo":"con nombre","nombre":"Atlas","notas":"Diseño \"linea-media\". Colores del cuerpo: verde #52 (pos. 3), blanco #1 (pos. 6, letra), verde limón #56 (pos. 1). Tubular verde limón de 12 pasadas. Texto: ATLAS.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":true},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"ATLAS","fondo":"#2d6a4f","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#95d5b2"},{"tipo":"linea","pasadas":4,"color":"#95d5b2"},{"tipo":"linea","pasadas":4,"color":"#95d5b2"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#95d5b2"},{"tipo":"linea","pasadas":4,"color":"#2d6a4f"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#95d5b2","desplazamiento":0}]},"posicion_tubular":1,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde","codigo":"52","hex":"#2d6a4f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"verde limón","codigo":"56","hex":"#95d5b2","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-03-atlas');

-- 04. Andino (doble-linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-04-andino","tipo":"con nombre","nombre":"Andino","notas":"Diseño \"doble-linea-media\". Colores del cuerpo: celeste bebé #32 (pos. 4), azul #15 (pos. 7, letra), blanco #1 (pos. 2). Tubular blanco de 12 pasadas. Texto: ANDINO.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":true},{"posicion":2,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"ANDINO","fondo":"#a2d2ff","color_texto":"#1d3557","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#a2d2ff"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"medio":[{"tipo":"linea","pasadas":1,"color":"#ffffff","desplazamiento":3},{"tipo":"linea","pasadas":1,"color":"#ffffff","desplazamiento":-3}]},"posicion_tubular":2,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"celeste bebé","codigo":"32","hex":"#a2d2ff","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"azul","codigo":"15","hex":"#1d3557","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-04-andino');

-- 05. Brisa (texto-alto)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-05-brisa","tipo":"con nombre","nombre":"Brisa","notas":"Diseño \"texto-alto\". Colores del cuerpo: verde bosque #51 (pos. 5), ámbar #29 (pos. 8, letra), tierra #61 (pos. 3). Tubular ámbar de 14 pasadas. Texto: BRISA.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":true},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"BRISA","fondo":"#0c3b2e","color_texto":"#ffba00","desplazamiento":5,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#ffba00"},{"tipo":"linea","pasadas":3,"color":"#bb8a52"},{"tipo":"linea","pasadas":3,"color":"#ffba00"}],"arriba":[],"medio":[]},"posicion_tubular":8,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde bosque","codigo":"51","hex":"#0c3b2e","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"ámbar","codigo":"29","hex":"#ffba00","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"tierra","codigo":"61","hex":"#bb8a52","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-05-brisa');

-- 06. Condor (texto-bajo)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-06-condor","tipo":"con nombre","nombre":"Condor","notas":"Diseño \"texto-bajo\". Colores del cuerpo: turquesa #35 (pos. 6), blanco #1 (pos. 1, letra), cian #36 (pos. 4). Tubular cian de 8 pasadas. Texto: CONDOR.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":true},{"posicion":4,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"CONDOR","fondo":"#0077b6","color_texto":"#ffffff","desplazamiento":-3,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#90e0ef"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#90e0ef"},{"tipo":"linea","pasadas":2,"color":"#0077b6"},{"tipo":"linea","pasadas":4,"color":"#90e0ef"}],"medio":[]},"posicion_tubular":4,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"turquesa","codigo":"35","hex":"#0077b6","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"cian","codigo":"36","hex":"#90e0ef","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-06-condor');

-- 07. Rayas azul petróleo y crema (rayas)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-07-rayas","tipo":"gaspeado","nombre":"Rayas azul petróleo y crema","notas":"Diseño \"rayas\". Colores del cuerpo: azul petróleo #17 (pos. 7), crema #9 (pos. 2), rojo #42 (pos. 5). Tubular crema de 10 pasadas. Sin texto.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":false},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#003049","color_texto":"#fdf0d5","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#fdf0d5"},{"tipo":"linea","pasadas":2,"color":"#c1121f"},{"tipo":"linea","pasadas":3,"color":"#fdf0d5"},{"tipo":"linea","pasadas":4,"color":"#c1121f"},{"tipo":"linea","pasadas":2,"color":"#fdf0d5"},{"tipo":"linea","pasadas":3,"color":"#c1121f"},{"tipo":"linea","pasadas":4,"color":"#fdf0d5"}],"arriba":[],"medio":[]},"posicion_tubular":2,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul petróleo","codigo":"17","hex":"#003049","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"9","hex":"#fdf0d5","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"42","hex":"#c1121f","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-07-rayas');

-- 08. Liso rojo vino y dorado (liso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-08-liso","tipo":"liso","nombre":"Liso rojo vino y dorado","notas":"Diseño \"liso\". Colores del cuerpo: rojo vino #43 (pos. 8), dorado #27 (pos. 3). Tubular dorado de 8 pasadas. Sin texto.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#6a040f","color_texto":"#ffba08","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#ffba08"}],"arriba":[],"medio":[]},"posicion_tubular":3,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"rojo vino","codigo":"43","hex":"#6a040f","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#ffba08","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-08-liso');

-- 09. Estrella (tubular-grueso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-09-estrella","tipo":"tubular","nombre":"Estrella","notas":"Diseño \"tubular-grueso\". Colores del cuerpo: gris oscuro #6 (pos. 1), rojo coral #41 (pos. 4, letra), humo #8 (pos. 7). Tubular rojo coral de 16 pasadas. Texto: ESTRELLA.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"ESTRELLA","fondo":"#2b2d42","color_texto":"#ef233c","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":16,"color":"#ef233c"},{"tipo":"linea","pasadas":2,"color":"#edf2f4"}],"arriba":[{"tipo":"linea","pasadas":6,"color":"#ef233c"}],"medio":[]},"posicion_tubular":4,"pasadas_tubular":16}',
  '[{"zona":"cuerpo","posicion":1,"color":"gris oscuro","codigo":"6","hex":"#2b2d42","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rojo coral","codigo":"41","hex":"#ef233c","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"humo","codigo":"8","hex":"#edf2f4","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-09-estrella');

-- 10. Fenix (marco)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-10-fenix","tipo":"con nombre","nombre":"Fenix","notas":"Diseño \"marco\". Colores del cuerpo: azul rey #16 (pos. 2), celeste #33 (pos. 5, letra), blanco #1 (pos. 8). Tubular blanco de 12 pasadas. Texto: FENIX.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"FENIX","fondo":"#023e8a","color_texto":"#caf0f8","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#caf0f8"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#caf0f8"},{"tipo":"linea","pasadas":4,"color":"#ffffff"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#caf0f8","desplazamiento":-2}]},"posicion_tubular":8,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul rey","codigo":"16","hex":"#023e8a","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"33","hex":"#caf0f8","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-10-fenix');

-- 11. Galaxia (clasico)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-11-galaxia","tipo":"con nombre","nombre":"Galaxia","notas":"Diseño \"clasico\". Colores del cuerpo: negro #2 (pos. 3), naranja #31 (pos. 6, letra), gris #4 (pos. 1). Tubular gris de 11 pasadas. Texto: GALAXIA.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":true},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"GALAXIA","fondo":"#000000","color_texto":"#ff6d00","desplazamiento":-1,"debajo":[{"tipo":"tubular","pasadas":11,"color":"#7d8597"},{"tipo":"linea","pasadas":4,"color":"#ff6d00"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#7d8597"}],"medio":[]},"posicion_tubular":1,"pasadas_tubular":11}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#000000","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"naranja","codigo":"31","hex":"#ff6d00","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris","codigo":"4","hex":"#7d8597","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-11-galaxia');

-- 12. Halcon (franjas-dobles)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-12-halcon","tipo":"doble linea despues del tubular","nombre":"Halcon","notas":"Diseño \"franjas-dobles\". Colores del cuerpo: negro #2 (pos. 4), blanco #1 (pos. 7, letra), celeste #34 #34 (pos. 2). Tubular celeste #34 de 10 pasadas. Texto: HALCON.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":true},{"posicion":2,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"HALCON","fondo":"#1a1a1a","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#7ec8e3"},{"tipo":"linea","pasadas":2,"color":"#1a1a1a"},{"tipo":"linea","pasadas":3,"color":"#7ec8e3"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#7ec8e3"},{"tipo":"linea","pasadas":2,"color":"#1a1a1a"},{"tipo":"linea","pasadas":3,"color":"#7ec8e3"}],"medio":[]},"posicion_tubular":2,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste #34","codigo":"34","hex":"#7ec8e3","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-12-halcon');

-- 13. Inca (linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-13-inca","tipo":"con nombre","nombre":"Inca","notas":"Diseño \"linea-media\". Colores del cuerpo: crema #9 (pos. 5), oliva #55 (pos. 8, letra), café #63 (pos. 3). Tubular café de 12 pasadas. Texto: INCA.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":true},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"INCA","fondo":"#fefae0","color_texto":"#606c38","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#283618"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#fefae0"}],"medio":[{"tipo":"linea","pasadas":3,"color":"#283618","desplazamiento":0}]},"posicion_tubular":3,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"crema","codigo":"9","hex":"#fefae0","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"oliva","codigo":"55","hex":"#606c38","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"café","codigo":"63","hex":"#283618","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-13-inca');

-- 14. Jaguar (doble-linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-14-jaguar","tipo":"con nombre","nombre":"Jaguar","notas":"Diseño \"doble-linea-media\". Colores del cuerpo: marrón #62 (pos. 6), beige #23 (pos. 1, letra), canela #64 (pos. 4). Tubular canela de 12 pasadas. Texto: JAGUAR.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":true},{"posicion":4,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"JAGUAR","fondo":"#6f4518","color_texto":"#ffe8d6","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#b08968"},{"tipo":"linea","pasadas":2,"color":"#6f4518"},{"tipo":"linea","pasadas":2,"color":"#b08968"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#b08968"}],"medio":[{"tipo":"linea","pasadas":1,"color":"#b08968","desplazamiento":4},{"tipo":"linea","pasadas":1,"color":"#b08968","desplazamiento":-4}]},"posicion_tubular":4,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"marrón","codigo":"62","hex":"#6f4518","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"beige","codigo":"23","hex":"#ffe8d6","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"canela","codigo":"64","hex":"#b08968","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-14-jaguar');

-- 15. Kantu (texto-alto)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-15-kantu","tipo":"con nombre","nombre":"Kantu","notas":"Diseño \"texto-alto\". Colores del cuerpo: verde menta #58 (pos. 7), verde pino #54 (pos. 2, letra), dorado #27 (pos. 5). Tubular verde pino de 14 pasadas. Texto: KANTU.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":true},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"KANTU","fondo":"#d8f3dc","color_texto":"#1b4332","desplazamiento":6,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#1b4332"},{"tipo":"linea","pasadas":3,"color":"#e9c46a"},{"tipo":"linea","pasadas":3,"color":"#1b4332"}],"arriba":[],"medio":[]},"posicion_tubular":2,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde menta","codigo":"58","hex":"#d8f3dc","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"verde pino","codigo":"54","hex":"#1b4332","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"dorado","codigo":"27","hex":"#e9c46a","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-15-kantu');

-- 16. Luna (texto-bajo)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-16-luna","tipo":"con nombre","nombre":"Luna","notas":"Diseño \"texto-bajo\". Colores del cuerpo: azul marino #13 (pos. 8), naranja #31 (pos. 3, letra), gris perla #7 (pos. 6). Tubular gris perla de 8 pasadas. Texto: LUNA.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":true},{"posicion":6,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"LUNA","fondo":"#14213d","color_texto":"#fca311","desplazamiento":-4,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#e5e5e5"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#e5e5e5"},{"tipo":"linea","pasadas":2,"color":"#14213d"},{"tipo":"linea","pasadas":4,"color":"#e5e5e5"}],"medio":[]},"posicion_tubular":6,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"13","hex":"#14213d","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"naranja","codigo":"31","hex":"#fca311","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris perla","codigo":"7","hex":"#e5e5e5","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-16-luna');

-- 17. Rayas negro y amarillo (rayas)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-17-rayas","tipo":"gaspeado","nombre":"Rayas negro y amarillo","notas":"Diseño \"rayas\". Colores del cuerpo: negro #2 (pos. 1), amarillo #25 (pos. 4), gris #4 (pos. 7). Tubular amarillo de 10 pasadas. Sin texto.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":false},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#1a1a1a","color_texto":"#ffd60a","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#ffd60a"},{"tipo":"linea","pasadas":3,"color":"#9e9e9e"},{"tipo":"linea","pasadas":4,"color":"#ffd60a"},{"tipo":"linea","pasadas":2,"color":"#9e9e9e"},{"tipo":"linea","pasadas":3,"color":"#ffd60a"},{"tipo":"linea","pasadas":4,"color":"#9e9e9e"},{"tipo":"linea","pasadas":2,"color":"#ffd60a"},{"tipo":"linea","pasadas":3,"color":"#9e9e9e"}],"arriba":[],"medio":[]},"posicion_tubular":4,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"25","hex":"#ffd60a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris","codigo":"4","hex":"#9e9e9e","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-17-rayas');

-- 18. Liso mostaza y crema (liso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-18-liso","tipo":"liso","nombre":"Liso mostaza y crema","notas":"Diseño \"liso\". Colores del cuerpo: mostaza #28 (pos. 2), crema #9 (pos. 5). Tubular crema de 10 pasadas. Sin texto.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#bc6c25","color_texto":"#fefae0","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#fefae0"}],"arriba":[],"medio":[]},"posicion_tubular":5,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"mostaza","codigo":"28","hex":"#bc6c25","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"9","hex":"#fefae0","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-18-liso');

-- 19. Olimpo (tubular-grueso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-19-olimpo","tipo":"tubular","nombre":"Olimpo","notas":"Diseño \"tubular-grueso\". Colores del cuerpo: blanco #1 (pos. 3), rojo #40 (pos. 6, letra), azul #15 (pos. 1). Tubular rojo de 17 pasadas. Texto: OLIMPO.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":true},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"OLIMPO","fondo":"#ffffff","color_texto":"#c62828","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":17,"color":"#c62828"},{"tipo":"linea","pasadas":2,"color":"#1f4fa3"}],"arriba":[{"tipo":"linea","pasadas":6,"color":"#c62828"}],"medio":[]},"posicion_tubular":6,"pasadas_tubular":17}',
  '[{"zona":"cuerpo","posicion":1,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"azul","codigo":"15","hex":"#1f4fa3","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-19-olimpo');

-- 20. Pacifico (marco)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-20-pacifico","tipo":"con nombre","nombre":"Pacifico","notas":"Diseño \"marco\". Colores del cuerpo: morado #71 (pos. 4), lila #74 (pos. 7, letra), violeta #72 (pos. 2). Tubular violeta de 12 pasadas. Texto: PACIFICO.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":true},{"posicion":2,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"PACIFICO","fondo":"#5a189a","color_texto":"#e0aaff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#9d4edd"},{"tipo":"linea","pasadas":2,"color":"#e0aaff"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#e0aaff"},{"tipo":"linea","pasadas":4,"color":"#9d4edd"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#e0aaff","desplazamiento":2}]},"posicion_tubular":2,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"morado","codigo":"71","hex":"#5a189a","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"lila","codigo":"74","hex":"#e0aaff","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"violeta","codigo":"72","hex":"#9d4edd","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-20-pacifico');

-- 21. Quantum (clasico)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-21-quantum","tipo":"con nombre","nombre":"Quantum","notas":"Diseño \"clasico\". Colores del cuerpo: rojo #40 (pos. 5), blanco #1 (pos. 8, letra), negro #2 (pos. 3). Tubular negro de 12 pasadas. Texto: QUANTUM.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":true},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"QUANTUM","fondo":"#c62828","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#1a1a1a"},{"tipo":"linea","pasadas":4,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#1a1a1a"}],"medio":[]},"posicion_tubular":3,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-21-quantum');

-- 22. Rayo (franjas-dobles)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-22-rayo","tipo":"doble linea despues del tubular","nombre":"Rayo","notas":"Diseño \"franjas-dobles\". Colores del cuerpo: púrpura #73 (pos. 6), dorado #27 (pos. 1, letra), blanco #1 (pos. 4). Tubular blanco de 10 pasadas. Texto: RAYO.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":true},{"posicion":4,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"RAYO","fondo":"#3c096c","color_texto":"#ffb703","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#3c096c"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#3c096c"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"medio":[]},"posicion_tubular":4,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"púrpura","codigo":"73","hex":"#3c096c","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#ffb703","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-22-rayo');

-- 23. Solar (linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-23-solar","tipo":"con nombre","nombre":"Solar","notas":"Diseño \"linea-media\". Colores del cuerpo: guinda #44 (pos. 7), blanco #1 (pos. 2, letra), oro #26 (pos. 5). Tubular oro de 12 pasadas. Texto: SOLAR.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":true},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"SOLAR","fondo":"#7b1e3a","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffd700"},{"tipo":"linea","pasadas":4,"color":"#ffd700"},{"tipo":"linea","pasadas":4,"color":"#ffd700"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#ffd700"},{"tipo":"linea","pasadas":4,"color":"#7b1e3a"}],"medio":[{"tipo":"linea","pasadas":4,"color":"#ffd700","desplazamiento":0}]},"posicion_tubular":5,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"guinda","codigo":"44","hex":"#7b1e3a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"oro","codigo":"26","hex":"#ffd700","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-23-solar');

-- 24. Titan (doble-linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-24-titan","tipo":"con nombre","nombre":"Titan","notas":"Diseño \"doble-linea-media\". Colores del cuerpo: vino #45 (pos. 8), rosa #48 (pos. 3, letra), fucsia #47 (pos. 6). Tubular fucsia de 12 pasadas. Texto: TITAN.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":true},{"posicion":6,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"TITAN","fondo":"#590d22","color_texto":"#ffccd5","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#c9184a"},{"tipo":"linea","pasadas":2,"color":"#590d22"},{"tipo":"linea","pasadas":2,"color":"#c9184a"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#c9184a"}],"medio":[{"tipo":"linea","pasadas":1,"color":"#c9184a","desplazamiento":3},{"tipo":"linea","pasadas":1,"color":"#c9184a","desplazamiento":-3}]},"posicion_tubular":6,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"45","hex":"#590d22","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rosa","codigo":"48","hex":"#ffccd5","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"fucsia","codigo":"47","hex":"#c9184a","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-24-titan');

-- 25. Urbano (texto-alto)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-25-urbano","tipo":"con nombre","nombre":"Urbano","notas":"Diseño \"texto-alto\". Colores del cuerpo: gris acero #5 (pos. 1), blanco #1 (pos. 4, letra), celeste #33 (pos. 7). Tubular blanco de 14 pasadas. Texto: URBANO.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"URBANO","fondo":"#495057","color_texto":"#f8f9fa","desplazamiento":7,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#f8f9fa"},{"tipo":"linea","pasadas":3,"color":"#4cc9f0"},{"tipo":"linea","pasadas":3,"color":"#f8f9fa"}],"arriba":[],"medio":[]},"posicion_tubular":4,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"gris acero","codigo":"5","hex":"#495057","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#f8f9fa","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"33","hex":"#4cc9f0","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-25-urbano');

-- 26. Valle (texto-bajo)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-26-valle","tipo":"con nombre","nombre":"Valle","notas":"Diseño \"texto-bajo\". Colores del cuerpo: azul noche #12 (pos. 2), dorado #27 (pos. 5, letra), mostaza #28 (pos. 8). Tubular mostaza de 8 pasadas. Texto: VALLE.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"VALLE","fondo":"#1a1a2e","color_texto":"#f1c40f","desplazamiento":-5,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#c8a415"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#c8a415"},{"tipo":"linea","pasadas":2,"color":"#1a1a2e"},{"tipo":"linea","pasadas":4,"color":"#c8a415"}],"medio":[]},"posicion_tubular":8,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul noche","codigo":"12","hex":"#1a1a2e","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#f1c40f","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"mostaza","codigo":"28","hex":"#c8a415","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-26-valle');

-- 27. Rayas verde agua y arena (rayas)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-27-rayas","tipo":"gaspeado","nombre":"Rayas verde agua y arena","notas":"Diseño \"rayas\". Colores del cuerpo: verde agua #53 (pos. 3), arena #24 (pos. 6), carbón #5 (pos. 1). Tubular arena de 10 pasadas. Sin texto.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":false},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#2a9d8f","color_texto":"#e9c46a","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#e9c46a"},{"tipo":"linea","pasadas":4,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#e9c46a"},{"tipo":"linea","pasadas":3,"color":"#264653"},{"tipo":"linea","pasadas":4,"color":"#e9c46a"},{"tipo":"linea","pasadas":2,"color":"#264653"},{"tipo":"linea","pasadas":3,"color":"#e9c46a"},{"tipo":"linea","pasadas":4,"color":"#264653"},{"tipo":"linea","pasadas":2,"color":"#e9c46a"}],"arriba":[],"medio":[]},"posicion_tubular":6,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde agua","codigo":"53","hex":"#2a9d8f","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"arena","codigo":"24","hex":"#e9c46a","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"carbón","codigo":"5","hex":"#264653","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-27-rayas');

-- 28. Liso verde y blanco (liso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-28-liso","tipo":"liso","nombre":"Liso verde y blanco","notas":"Diseño \"liso\". Colores del cuerpo: verde #52 (pos. 4), blanco #1 (pos. 7). Tubular blanco de 12 pasadas. Sin texto.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#2d6a4f","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#ffffff"}],"arriba":[],"medio":[]},"posicion_tubular":7,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde","codigo":"52","hex":"#2d6a4f","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-28-liso');

-- 29. Yaku (tubular-grueso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-29-yaku","tipo":"tubular","nombre":"Yaku","notas":"Diseño \"tubular-grueso\". Colores del cuerpo: celeste bebé #32 (pos. 5), azul #15 (pos. 8, letra), blanco #1 (pos. 3). Tubular azul de 18 pasadas. Texto: YAKU.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":true},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"YAKU","fondo":"#a2d2ff","color_texto":"#1d3557","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":18,"color":"#1d3557"},{"tipo":"linea","pasadas":2,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":6,"color":"#1d3557"}],"medio":[]},"posicion_tubular":8,"pasadas_tubular":18}',
  '[{"zona":"cuerpo","posicion":1,"color":"celeste bebé","codigo":"32","hex":"#a2d2ff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"azul","codigo":"15","hex":"#1d3557","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-29-yaku');

-- 30. Zafiro (marco)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-30-zafiro","tipo":"con nombre","nombre":"Zafiro","notas":"Diseño \"marco\". Colores del cuerpo: verde bosque #51 (pos. 6), ámbar #29 (pos. 1, letra), tierra #61 (pos. 4). Tubular tierra de 12 pasadas. Texto: ZAFIRO.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":true},{"posicion":4,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"ZAFIRO","fondo":"#0c3b2e","color_texto":"#ffba00","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#bb8a52"},{"tipo":"linea","pasadas":2,"color":"#ffba00"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#ffba00"},{"tipo":"linea","pasadas":4,"color":"#bb8a52"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#ffba00","desplazamiento":-2}]},"posicion_tubular":4,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde bosque","codigo":"51","hex":"#0c3b2e","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"ámbar","codigo":"29","hex":"#ffba00","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"tierra","codigo":"61","hex":"#bb8a52","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-30-zafiro');

-- 31. Promo 2026 (clasico)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-31-promo-2026","tipo":"con nombre","nombre":"Promo 2026","notas":"Diseño \"clasico\". Colores del cuerpo: turquesa #35 (pos. 7), blanco #1 (pos. 2, letra), cian #36 (pos. 5). Tubular cian de 13 pasadas. Texto: PROMO 2026.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":true},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"PROMO 2026","fondo":"#0077b6","color_texto":"#ffffff","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":13,"color":"#90e0ef"},{"tipo":"linea","pasadas":4,"color":"#ffffff"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#90e0ef"}],"medio":[]},"posicion_tubular":5,"pasadas_tubular":13}',
  '[{"zona":"cuerpo","posicion":1,"color":"turquesa","codigo":"35","hex":"#0077b6","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"cian","codigo":"36","hex":"#90e0ef","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-31-promo-2026');

-- 32. Colegio 2027 (franjas-dobles)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-32-colegio-2027","tipo":"doble linea despues del tubular","nombre":"Colegio 2027","notas":"Diseño \"franjas-dobles\". Colores del cuerpo: azul petróleo #17 (pos. 8), crema #9 (pos. 3, letra), rojo #42 (pos. 6). Tubular rojo de 10 pasadas. Texto: COLEGIO 2027.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":true},{"posicion":6,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"COLEGIO 2027","fondo":"#003049","color_texto":"#fdf0d5","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#c1121f"},{"tipo":"linea","pasadas":2,"color":"#003049"},{"tipo":"linea","pasadas":3,"color":"#c1121f"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#c1121f"},{"tipo":"linea","pasadas":2,"color":"#003049"},{"tipo":"linea","pasadas":3,"color":"#c1121f"}],"medio":[]},"posicion_tubular":6,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul petróleo","codigo":"17","hex":"#003049","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"9","hex":"#fdf0d5","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"rojo","codigo":"42","hex":"#c1121f","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-32-colegio-2027');

-- 33. Club 10 (linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-33-club-10","tipo":"con nombre","nombre":"Club 10","notas":"Diseño \"linea-media\". Colores del cuerpo: rojo vino #43 (pos. 1), dorado #27 (pos. 4, letra), negro #2 (pos. 7). Tubular negro de 12 pasadas. Texto: CLUB 10.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"CLUB 10","fondo":"#6a040f","color_texto":"#ffba08","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#1a1a1a"},{"tipo":"linea","pasadas":4,"color":"#1a1a1a"},{"tipo":"linea","pasadas":4,"color":"#1a1a1a"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#1a1a1a"},{"tipo":"linea","pasadas":4,"color":"#6a040f"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#1a1a1a","desplazamiento":0}]},"posicion_tubular":7,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"rojo vino","codigo":"43","hex":"#6a040f","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#ffba08","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-33-club-10');

-- 34. Team Rojo (doble-linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-34-team-rojo","tipo":"con nombre","nombre":"Team Rojo","notas":"Diseño \"doble-linea-media\". Colores del cuerpo: gris oscuro #6 (pos. 2), rojo coral #41 (pos. 5, letra), humo #8 (pos. 8). Tubular humo de 12 pasadas. Texto: TEAM ROJO.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"TEAM ROJO","fondo":"#2b2d42","color_texto":"#ef233c","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#edf2f4"},{"tipo":"linea","pasadas":2,"color":"#2b2d42"},{"tipo":"linea","pasadas":2,"color":"#edf2f4"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#edf2f4"}],"medio":[{"tipo":"linea","pasadas":1,"color":"#edf2f4","desplazamiento":4},{"tipo":"linea","pasadas":1,"color":"#edf2f4","desplazamiento":-4}]},"posicion_tubular":8,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"gris oscuro","codigo":"6","hex":"#2b2d42","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rojo coral","codigo":"41","hex":"#ef233c","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"humo","codigo":"8","hex":"#edf2f4","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-34-team-rojo');

-- 35. San Jose (texto-alto)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-35-san-jose","tipo":"con nombre","nombre":"San Jose","notas":"Diseño \"texto-alto\". Colores del cuerpo: azul rey #16 (pos. 3), celeste #33 (pos. 6, letra), blanco #1 (pos. 1). Tubular celeste de 14 pasadas. Texto: SAN JOSE.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":true},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"SAN JOSE","fondo":"#023e8a","color_texto":"#caf0f8","desplazamiento":8,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#caf0f8"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#caf0f8"}],"arriba":[],"medio":[]},"posicion_tubular":6,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul rey","codigo":"16","hex":"#023e8a","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"celeste","codigo":"33","hex":"#caf0f8","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-35-san-jose');

-- 36. Santa Rosa (texto-bajo)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-36-santa-rosa","tipo":"con nombre","nombre":"Santa Rosa","notas":"Diseño \"texto-bajo\". Colores del cuerpo: negro #2 (pos. 4), naranja #31 (pos. 7, letra), gris #4 (pos. 2). Tubular gris de 8 pasadas. Texto: SANTA ROSA.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":true},{"posicion":2,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"SANTA ROSA","fondo":"#000000","color_texto":"#ff6d00","desplazamiento":-6,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#7d8597"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#7d8597"},{"tipo":"linea","pasadas":2,"color":"#000000"},{"tipo":"linea","pasadas":4,"color":"#7d8597"}],"medio":[]},"posicion_tubular":2,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#000000","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"naranja","codigo":"31","hex":"#ff6d00","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris","codigo":"4","hex":"#7d8597","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-36-santa-rosa');

-- 37. Rayas negro y blanco (rayas)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-37-rayas","tipo":"gaspeado","nombre":"Rayas negro y blanco","notas":"Diseño \"rayas\". Colores del cuerpo: negro #2 (pos. 5), blanco #1 (pos. 8), celeste #34 #34 (pos. 3). Tubular blanco de 10 pasadas. Sin texto.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":false},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#1a1a1a","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#7ec8e3"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":4,"color":"#7ec8e3"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#7ec8e3"},{"tipo":"linea","pasadas":4,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#7ec8e3"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":4,"color":"#7ec8e3"}],"arriba":[],"medio":[]},"posicion_tubular":8,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste #34","codigo":"34","hex":"#7ec8e3","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-37-rayas');

-- 38. Liso crema y oliva (liso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-38-liso","tipo":"liso","nombre":"Liso crema y oliva","notas":"Diseño \"liso\". Colores del cuerpo: crema #9 (pos. 6), oliva #55 (pos. 1). Tubular oliva de 14 pasadas. Sin texto.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#fefae0","color_texto":"#606c38","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#606c38"}],"arriba":[],"medio":[]},"posicion_tubular":1,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"crema","codigo":"9","hex":"#fefae0","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"oliva","codigo":"55","hex":"#606c38","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-38-liso');

-- 39. Norte (tubular-grueso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-39-norte","tipo":"tubular","nombre":"Norte","notas":"Diseño \"tubular-grueso\". Colores del cuerpo: marrón #62 (pos. 7), beige #23 (pos. 2, letra), canela #64 (pos. 5). Tubular beige de 19 pasadas. Texto: NORTE.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":true},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"NORTE","fondo":"#6f4518","color_texto":"#ffe8d6","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":19,"color":"#ffe8d6"},{"tipo":"linea","pasadas":2,"color":"#b08968"}],"arriba":[{"tipo":"linea","pasadas":6,"color":"#ffe8d6"}],"medio":[]},"posicion_tubular":2,"pasadas_tubular":19}',
  '[{"zona":"cuerpo","posicion":1,"color":"marrón","codigo":"62","hex":"#6f4518","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"beige","codigo":"23","hex":"#ffe8d6","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"canela","codigo":"64","hex":"#b08968","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-39-norte');

-- 40. Ñusta (marco)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-40-nusta","tipo":"con nombre","nombre":"Ñusta","notas":"Diseño \"marco\". Colores del cuerpo: verde menta #58 (pos. 8), verde pino #54 (pos. 3, letra), dorado #27 (pos. 6). Tubular dorado de 12 pasadas. Texto: ÑUSTA.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":true},{"posicion":6,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"ÑUSTA","fondo":"#d8f3dc","color_texto":"#1b4332","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#e9c46a"},{"tipo":"linea","pasadas":2,"color":"#1b4332"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#1b4332"},{"tipo":"linea","pasadas":4,"color":"#e9c46a"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#1b4332","desplazamiento":2}]},"posicion_tubular":6,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"verde menta","codigo":"58","hex":"#d8f3dc","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"verde pino","codigo":"54","hex":"#1b4332","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"dorado","codigo":"27","hex":"#e9c46a","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-40-nusta');

-- 41. Cañete (clasico)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-41-canete","tipo":"con nombre","nombre":"Cañete","notas":"Diseño \"clasico\". Colores del cuerpo: azul marino #13 (pos. 1), naranja #31 (pos. 4, letra), gris perla #7 (pos. 7). Tubular gris perla de 14 pasadas. Texto: CAÑETE.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"CAÑETE","fondo":"#14213d","color_texto":"#fca311","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#e5e5e5"},{"tipo":"linea","pasadas":4,"color":"#fca311"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#e5e5e5"}],"medio":[]},"posicion_tubular":7,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"azul marino","codigo":"13","hex":"#14213d","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"naranja","codigo":"31","hex":"#fca311","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris perla","codigo":"7","hex":"#e5e5e5","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-41-canete');

-- 42. Arca De Noe (franjas-dobles)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-42-arca-de-noe","tipo":"doble linea despues del tubular","nombre":"Arca De Noe","notas":"Diseño \"franjas-dobles\". Colores del cuerpo: negro #2 (pos. 2), amarillo #25 (pos. 5, letra), gris #4 (pos. 8). Tubular gris de 10 pasadas. Texto: ARCA DE NOE.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"ARCA DE NOE","fondo":"#1a1a1a","color_texto":"#ffd60a","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#9e9e9e"},{"tipo":"linea","pasadas":2,"color":"#1a1a1a"},{"tipo":"linea","pasadas":2,"color":"#9e9e9e"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#9e9e9e"},{"tipo":"linea","pasadas":2,"color":"#1a1a1a"},{"tipo":"linea","pasadas":2,"color":"#9e9e9e"}],"medio":[]},"posicion_tubular":8,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"amarillo","codigo":"25","hex":"#ffd60a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"gris","codigo":"4","hex":"#9e9e9e","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-42-arca-de-noe');

-- 43. Machu (linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-43-machu","tipo":"con nombre","nombre":"Machu","notas":"Diseño \"linea-media\". Colores del cuerpo: mostaza #28 (pos. 3), crema #9 (pos. 6, letra), verde musgo #57 (pos. 1). Tubular verde musgo de 12 pasadas. Texto: MACHU.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":3,"letra":false},{"posicion":6,"letra":true},{"posicion":1,"letra":false}],"medidas":[20,19,18,17],"imagen_url":null,"diseno":{"v":1,"texto":"MACHU","fondo":"#bc6c25","color_texto":"#fefae0","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#283618"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#283618"},{"tipo":"linea","pasadas":4,"color":"#bc6c25"}],"medio":[{"tipo":"linea","pasadas":3,"color":"#283618","desplazamiento":0}]},"posicion_tubular":1,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"mostaza","codigo":"28","hex":"#bc6c25","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"crema","codigo":"9","hex":"#fefae0","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"verde musgo","codigo":"57","hex":"#283618","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-43-machu');

-- 44. Titicaca (doble-linea-media)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-44-titicaca","tipo":"con nombre","nombre":"Titicaca","notas":"Diseño \"doble-linea-media\". Colores del cuerpo: blanco #1 (pos. 4), rojo #40 (pos. 7, letra), azul #15 (pos. 2). Tubular azul de 12 pasadas. Texto: TITICACA.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":4,"letra":false},{"posicion":7,"letra":true},{"posicion":2,"letra":false}],"medidas":[14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"TITICACA","fondo":"#ffffff","color_texto":"#c62828","desplazamiento":1,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#1f4fa3"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#1f4fa3"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#1f4fa3"}],"medio":[{"tipo":"linea","pasadas":1,"color":"#1f4fa3","desplazamiento":3},{"tipo":"linea","pasadas":1,"color":"#1f4fa3","desplazamiento":-3}]},"posicion_tubular":2,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":3,"color":"azul","codigo":"15","hex":"#1f4fa3","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-44-titicaca');

-- 45. Puma (texto-alto)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-45-puma","tipo":"con nombre","nombre":"Puma","notas":"Diseño \"texto-alto\". Colores del cuerpo: morado #71 (pos. 5), lila #74 (pos. 8, letra), violeta #72 (pos. 3). Tubular lila de 14 pasadas. Texto: PUMA.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":5,"letra":false},{"posicion":8,"letra":true},{"posicion":3,"letra":false}],"medidas":[18,17,16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"PUMA","fondo":"#5a189a","color_texto":"#e0aaff","desplazamiento":9,"debajo":[{"tipo":"tubular","pasadas":14,"color":"#e0aaff"},{"tipo":"linea","pasadas":3,"color":"#9d4edd"},{"tipo":"linea","pasadas":3,"color":"#e0aaff"}],"arriba":[],"medio":[]},"posicion_tubular":8,"pasadas_tubular":14}',
  '[{"zona":"cuerpo","posicion":1,"color":"morado","codigo":"71","hex":"#5a189a","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"lila","codigo":"74","hex":"#e0aaff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"violeta","codigo":"72","hex":"#9d4edd","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-45-puma');

-- 46. Illari (texto-bajo)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-46-illari","tipo":"con nombre","nombre":"Illari","notas":"Diseño \"texto-bajo\". Colores del cuerpo: rojo #40 (pos. 6), blanco #1 (pos. 1, letra), negro #2 (pos. 4). Tubular negro de 8 pasadas. Texto: ILLARI.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":6,"letra":false},{"posicion":1,"letra":true},{"posicion":4,"letra":false}],"medidas":[17,16,15],"imagen_url":null,"diseno":{"v":1,"texto":"ILLARI","fondo":"#c62828","color_texto":"#ffffff","desplazamiento":-7,"debajo":[{"tipo":"tubular","pasadas":8,"color":"#1a1a1a"}],"arriba":[{"tipo":"linea","pasadas":4,"color":"#1a1a1a"},{"tipo":"linea","pasadas":2,"color":"#c62828"},{"tipo":"linea","pasadas":4,"color":"#1a1a1a"}],"medio":[]},"posicion_tubular":4,"pasadas_tubular":8}',
  '[{"zona":"cuerpo","posicion":1,"color":"rojo","codigo":"40","hex":"#c62828","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"negro","codigo":"2","hex":"#1a1a1a","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-46-illari');

-- 47. Rayas púrpura y dorado (rayas)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-47-rayas","tipo":"gaspeado","nombre":"Rayas púrpura y dorado","notas":"Diseño \"rayas\". Colores del cuerpo: púrpura #73 (pos. 7), dorado #27 (pos. 2), blanco #1 (pos. 5). Tubular dorado de 10 pasadas. Sin texto.","cantidad_hilos":3,"posiciones_cuerpo":[{"posicion":7,"letra":false},{"posicion":2,"letra":false},{"posicion":5,"letra":false}],"medidas":[19,18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#3c096c","color_texto":"#ffb703","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":10,"color":"#ffb703"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":4,"color":"#ffb703"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#ffb703"},{"tipo":"linea","pasadas":4,"color":"#ffffff"},{"tipo":"linea","pasadas":2,"color":"#ffb703"},{"tipo":"linea","pasadas":3,"color":"#ffffff"},{"tipo":"linea","pasadas":4,"color":"#ffb703"},{"tipo":"linea","pasadas":2,"color":"#ffffff"},{"tipo":"linea","pasadas":3,"color":"#ffb703"}],"arriba":[],"medio":[]},"posicion_tubular":2,"pasadas_tubular":10}',
  '[{"zona":"cuerpo","posicion":1,"color":"púrpura","codigo":"73","hex":"#3c096c","cantidad_hilos":3,"orden":1},{"zona":"cuerpo","posicion":2,"color":"dorado","codigo":"27","hex":"#ffb703","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":3,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":2,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-47-rayas');

-- 48. Liso guinda y blanco (liso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-48-liso","tipo":"liso","nombre":"Liso guinda y blanco","notas":"Diseño \"liso\". Colores del cuerpo: guinda #44 (pos. 8), blanco #1 (pos. 3). Tubular blanco de 16 pasadas. Sin texto.","cantidad_hilos":4,"posiciones_cuerpo":[{"posicion":8,"letra":false},{"posicion":3,"letra":false}],"medidas":[15,14,13,12],"imagen_url":null,"diseno":{"v":1,"texto":"","fondo":"#7b1e3a","color_texto":"#ffffff","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":16,"color":"#ffffff"}],"arriba":[],"medio":[]},"posicion_tubular":3,"pasadas_tubular":16}',
  '[{"zona":"cuerpo","posicion":1,"color":"guinda","codigo":"44","hex":"#7b1e3a","cantidad_hilos":4,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#ffffff","cantidad_hilos":3,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-48-liso');

-- 49. Inti (tubular-grueso)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-49-inti","tipo":"tubular","nombre":"Inti","notas":"Diseño \"tubular-grueso\". Colores del cuerpo: vino #45 (pos. 1), rosa #48 (pos. 4, letra), fucsia #47 (pos. 7). Tubular rosa de 20 pasadas. Texto: INTI.","cantidad_hilos":1,"posiciones_cuerpo":[{"posicion":1,"letra":false},{"posicion":4,"letra":true},{"posicion":7,"letra":false}],"medidas":[18,17,16],"imagen_url":null,"diseno":{"v":1,"texto":"INTI","fondo":"#590d22","color_texto":"#ffccd5","desplazamiento":2,"debajo":[{"tipo":"tubular","pasadas":20,"color":"#ffccd5"},{"tipo":"linea","pasadas":2,"color":"#c9184a"}],"arriba":[{"tipo":"linea","pasadas":6,"color":"#ffccd5"}],"medio":[]},"posicion_tubular":4,"pasadas_tubular":20}',
  '[{"zona":"cuerpo","posicion":1,"color":"vino","codigo":"45","hex":"#590d22","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":2,"color":"rosa","codigo":"48","hex":"#ffccd5","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"fucsia","codigo":"47","hex":"#c9184a","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-49-inti');

-- 50. Amaru (marco)
select public.fn_guardar_cuello(
  '{"codigo":"dsn-50-amaru","tipo":"con nombre","nombre":"Amaru","notas":"Diseño \"marco\". Colores del cuerpo: gris acero #5 (pos. 2), blanco #1 (pos. 5, letra), celeste #33 (pos. 8). Tubular celeste de 12 pasadas. Texto: AMARU.","cantidad_hilos":2,"posiciones_cuerpo":[{"posicion":2,"letra":false},{"posicion":5,"letra":true},{"posicion":8,"letra":false}],"medidas":[16,15,14],"imagen_url":null,"diseno":{"v":1,"texto":"AMARU","fondo":"#495057","color_texto":"#f8f9fa","desplazamiento":0,"debajo":[{"tipo":"tubular","pasadas":12,"color":"#4cc9f0"},{"tipo":"linea","pasadas":2,"color":"#f8f9fa"}],"arriba":[{"tipo":"linea","pasadas":2,"color":"#f8f9fa"},{"tipo":"linea","pasadas":4,"color":"#4cc9f0"}],"medio":[{"tipo":"linea","pasadas":2,"color":"#f8f9fa","desplazamiento":-2}]},"posicion_tubular":8,"pasadas_tubular":12}',
  '[{"zona":"cuerpo","posicion":1,"color":"gris acero","codigo":"5","hex":"#495057","cantidad_hilos":2,"orden":1},{"zona":"cuerpo","posicion":2,"color":"blanco","codigo":"1","hex":"#f8f9fa","cantidad_hilos":1,"orden":1},{"zona":"cuerpo","posicion":3,"color":"celeste","codigo":"33","hex":"#4cc9f0","cantidad_hilos":1,"orden":1}]'
)
where not exists (select 1 from public.cuellos where codigo = 'dsn-50-amaru');
