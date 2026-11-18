-- =====================================================================
-- Datos de EJEMPLO para probar ventas, producción, estimador y reportes.
-- SOLO PARA DESARROLLO LOCAL. No forma parte del arranque automático.
--
-- Qué agrega (sobre los diseños y conos que ya existen):
--   * precio_base a los cuellos y puños que no lo tengan,
--   * estimaciones de costo para los diseños "estrella" (dan el margen),
--   * producciones y ventas repartidas entre el 1 de octubre y hoy,
--     con clientes y métodos de pago variados y un grupo de diseños que
--     se venden más (para que el "top" y el margen se vean claros).
--
-- Es idempotente: primero borra sus propios datos (ids en el rango
-- ...-0009-... / -000a- / -000b-, marca de "ejemplo") y los vuelve a
-- generar. NO toca los datos reales que ya hayas registrado.
--
-- Aplicar (docker-compose):
--   docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" \
--     psql -U supabase_admin -h localhost -d postgres -v ON_ERROR_STOP=1' \
--     < supabase/seed_ejemplo.sql
-- =====================================================================

-- Quita los datos de ejemplo de una corrida anterior (no los tuyos).
delete from public.ventas       where id::text like '00000000-0000-4000-9000-%';
delete from public.producciones where id::text like '00000000-0000-4000-b000-%';
delete from public.estimaciones where id::text like '00000000-0000-4000-a000-%';

do $$
declare
  c_admin   constant uuid := '00000000-0000-4000-8000-000000000001';
  c_hoy     constant date := current_date;
  c_desde   constant date := date '2026-10-01';
  c_rango   constant int  := greatest(1, c_hoy - date '2026-10-01');

  -- Diseños que más se venden/producen y que llevan estimación de costo.
  c_estrella constant text[] := array[
    'atl03', 'maz4t5', 'pdgo', 'bri19', 'ven01', 'xelaju', 'aur02',
    'cous2t', 'zaf10', 'nor18'
  ];

  v_clientes constant text[] := array[
    'Colegio San José', 'Almacén La Esperanza', 'Doña Marta', 'Uniformes GT',
    'Tienda El Punto', 'Boutique Xela', 'Pedido WhatsApp', 'Cliente de mostrador',
    'Escuela Las Flores', 'Sastrería Central', null, null
  ];
  v_metodos  constant text[] := array[
    'efectivo', 'efectivo', 'efectivo', 'transferencia', 'transferencia', 'otro'
  ];

  rec        record;
  v_id       uuid;
  v_linea    int;
  v_nlineas  int;
  v_medida   text;
  v_cant     int;
  v_precio   numeric;
  v_unid     int;
  v_total    numeric;
  v_orden    int;
  v_fecha    date;
  v_seed     bigint;
  v_cod      text;
  i          int;
begin
  -- 1) PRECIO BASE ------------------------------------------------------
  -- Cuellos: Q 35–60. Puños: Q 18–30. Solo donde falta (no pisa lo tuyo).
  update public.cuellos set precio_base =
    case when pieza = 'cuello'
         then 35 + (abs(hashtext(codigo)) % 6) * 5
         else 18 + (abs(hashtext(codigo)) % 5) * 3 end
  where activo and precio_base is null;

  -- 2) ESTIMACIONES -----------------------------------------------------
  -- Una por cada diseño estrella: dan el costo estimado que usan el margen
  -- del reporte de ventas y el resumen ejecutivo.
  i := 0;
  foreach v_cod in array c_estrella loop
    v_id := ('00000000-0000-4000-a000-' || lpad(to_hex(i), 12, '0'))::uuid;
    select c.id, c.codigo, c.medidas into rec
    from public.cuellos c
    where c.pieza = 'cuello' and c.activo and c.codigo = v_cod;
    i := i + 1;
    continue when rec.id is null;

    insert into public.estimaciones (
      id, fecha, nombre, tarifa_hora, costo_cono, total_unidades, total_conos,
      total_minutos, costo_material, costo_mano_obra, costo_total, usuario_id
    ) values (v_id, c_desde + (i * 3), 'Costeo ' || rec.codigo, 20, 90, 1, 0, 0, 0, 0, 0, c_admin);

    v_unid := 0;
    declare
      v_tconos numeric := 0; v_tmin numeric := 0; v_mat numeric; v_mano numeric;
      v_cpu numeric; v_mpu numeric;
    begin
      for v_orden in 0 .. 1 + (i % 2) loop
        v_medida := (rec.medidas)[1 + (v_orden % array_length(rec.medidas, 1))]::text;
        v_cant   := 8 + (abs(hashtext('ec' || i || v_orden)) % 10);
        v_cpu    := 0.15 + (abs(hashtext('cc' || i || v_orden)) % 20) / 100.0;  -- 0.15–0.34 conos
        v_mpu    := 18 + (abs(hashtext('mm' || i || v_orden)) % 15);           -- 18–32 min
        insert into public.estimacion_lineas (
          estimacion_id, cuello_id, diseno_codigo, pieza, talla, cantidad,
          conos_por_unidad, minutos_por_unidad, orden
        ) values (v_id, rec.id, rec.codigo, 'cuello', v_medida, v_cant, v_cpu, v_mpu, v_orden);
        v_unid   := v_unid + v_cant;
        v_tconos := v_tconos + v_cant * v_cpu;
        v_tmin   := v_tmin + v_cant * v_mpu;
      end loop;
      v_mat  := round(v_tconos * 90, 2);
      v_mano := round(v_tmin / 60.0 * 20, 2);
      update public.estimaciones set
        total_unidades = v_unid, total_conos = v_tconos, total_minutos = v_tmin,
        costo_material = v_mat, costo_mano_obra = v_mano, costo_total = v_mat + v_mano
      where id = v_id;
    end;
  end loop;

  -- 3) PRODUCCIONES -----------------------------------------------------
  -- Más densidad en las últimas semanas. Sesgadas a los diseños estrella.
  for i in 0..44 loop
    v_id   := ('00000000-0000-4000-b000-' || lpad(to_hex(i), 12, '0'))::uuid;
    v_seed := abs(hashtext('prod' || i));
    v_fecha := c_hoy - ((v_seed % c_rango) * (v_seed % c_rango) / c_rango)::int;

    if v_seed % 3 > 0 then
      v_cod := c_estrella[1 + (v_seed % array_length(c_estrella, 1))];
      select c.id, c.codigo, c.pieza, c.medidas, c.tallas into rec
      from public.cuellos c
      where c.pieza = 'cuello' and c.activo and c.codigo = v_cod;
    else
      select c.id, c.codigo, c.pieza, c.medidas, c.tallas into rec
      from public.cuellos c
      where c.activo and c.precio_base is not null
      order by md5('prd' || i || c.codigo) limit 1;
    end if;
    continue when rec.id is null;

    if rec.pieza = 'puno' then
      v_medida := upper((rec.tallas)[1 + (v_seed % array_length(rec.tallas, 1))]);
    else
      v_medida := (rec.medidas)[1 + (v_seed % array_length(rec.medidas, 1))]::text;
    end if;
    v_cant := 2 + (v_seed % 7);

    insert into public.producciones (
      id, fecha, cuello_id, diseno_codigo, pieza, talla, cantidad, usuario_id
    ) values (v_id, v_fecha, rec.id, rec.codigo, rec.pieza, v_medida, v_cant, c_admin);
  end loop;

  -- 4) VENTAS -----------------------------------------------------------
  for i in 0..41 loop
    v_id    := ('00000000-0000-4000-9000-' || lpad(to_hex(i), 12, '0'))::uuid;
    v_seed  := abs(hashtext('venta' || i));
    v_fecha := c_hoy - (v_seed % c_rango)::int;

    insert into public.ventas (id, fecha, cliente, metodo_pago, total_unidades, total, usuario_id)
    values (
      v_id, v_fecha,
      v_clientes[1 + (v_seed % array_length(v_clientes, 1))],
      v_metodos[1 + ((v_seed / 7) % array_length(v_metodos, 1))],
      1, 0, c_admin
    );

    v_nlineas := 1 + (v_seed % 3);
    v_unid := 0; v_total := 0;
    for v_linea in 0 .. v_nlineas - 1 loop
      -- 2 de cada 3 líneas son de un diseño estrella (tienen costo estimado).
      if (v_seed / (v_linea + 1)) % 3 > 0 then
        v_cod := c_estrella[1 + ((v_seed + v_linea) % array_length(c_estrella, 1))];
        select c.id, c.codigo, c.pieza, c.medidas, c.tallas, c.precio_base into rec
        from public.cuellos c
        where c.pieza = 'cuello' and c.activo and c.codigo = v_cod;
      else
        select c.id, c.codigo, c.pieza, c.medidas, c.tallas, c.precio_base into rec
        from public.cuellos c
        where c.activo and c.precio_base is not null
        order by md5('any' || i || v_linea || c.codigo) limit 1;
      end if;
      continue when rec.id is null;

      if rec.pieza = 'puno' then
        v_medida := upper((rec.tallas)[1 + (v_seed % array_length(rec.tallas, 1))]);
      else
        v_medida := (rec.medidas)[1 + (v_seed % array_length(rec.medidas, 1))]::text;
      end if;
      v_cant   := 1 + (abs(hashtext('vc' || i || v_linea)) % 6);
      -- Precio base, con un descuento ocasional de Q 5.
      v_precio := rec.precio_base - case when (v_seed / (v_linea + 2)) % 5 = 0 then 5 else 0 end;

      insert into public.venta_lineas (
        venta_id, cuello_id, diseno_codigo, pieza, talla, cantidad, precio_unitario, orden
      ) values (v_id, rec.id, rec.codigo, rec.pieza, v_medida, v_cant, v_precio, v_linea);

      v_unid  := v_unid + v_cant;
      v_total := v_total + v_cant * v_precio;
    end loop;

    if v_unid = 0 then
      delete from public.ventas where id = v_id;  -- (no debería pasar)
    else
      update public.ventas set total_unidades = v_unid, total = v_total where id = v_id;
    end if;
  end loop;
end $$;

-- Resumen de lo que quedó cargado.
select 'ventas de ejemplo'       as dato, count(*) from public.ventas       where id::text like '00000000-0000-4000-9000-%'
union all
select 'producciones de ejemplo', count(*) from public.producciones where id::text like '00000000-0000-4000-b000-%'
union all
select 'estimaciones de ejemplo', count(*) from public.estimaciones where id::text like '00000000-0000-4000-a000-%';

-- ---------------------------------------------------------------------
-- Para BORRAR solo los datos de ejemplo (descomenta y ejecuta):
--
-- delete from public.ventas       where id::text like '00000000-0000-4000-9000-%';
-- delete from public.producciones where id::text like '00000000-0000-4000-b000-%';
-- delete from public.estimaciones where id::text like '00000000-0000-4000-a000-%';
-- (las líneas se borran en cascada; los precio_base quedan)
-- ---------------------------------------------------------------------
