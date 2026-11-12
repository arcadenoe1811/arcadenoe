-- =====================================================================
-- 00002 - Solo el usuario autenticado accede a los datos
-- =====================================================================
-- Con inicio de sesion, el rol anon (la llave publica) ya no puede leer
-- ni escribir. Todo pasa por el rol authenticated.

drop policy if exists acceso_total_cuellos          on public.cuellos;
drop policy if exists acceso_total_colores_cuello   on public.colores_cuello;
drop policy if exists acceso_total_catalogo_colores on public.catalogo_colores;

create policy usuario_autenticado_cuellos
  on public.cuellos for all to authenticated using (true) with check (true);
create policy usuario_autenticado_colores_cuello
  on public.colores_cuello for all to authenticated using (true) with check (true);
create policy usuario_autenticado_catalogo_colores
  on public.catalogo_colores for all to authenticated using (true) with check (true);

revoke select, insert, update, delete
  on public.cuellos, public.colores_cuello, public.catalogo_colores
  from anon;
revoke execute on function public.fn_buscar_cuellos(text)         from anon, public;
revoke execute on function public.fn_guardar_cuello(jsonb, jsonb) from anon, public;
