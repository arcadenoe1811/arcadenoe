-- =====================================================================
-- 00009 - Puno que usa un cuello
--
-- Un cuello puede usar un puno que YA existe (por ejemplo el cuello
-- cous2t usa el puno maz4d3) en vez de tener un puno propio. Varios
-- cuellos pueden compartir el mismo puno.
--
-- * puno_id:   puno que usa este cuello (null = su puno es el del mismo
--              codigo, si existe).
-- * puno_nota: aclaracion del vinculo, ej: "Mismo diseno que el puno
--              maz4d3, tejido con los colores de cous2t".
-- =====================================================================

alter table public.cuellos
  add column puno_id   uuid references public.cuellos (id) on delete set null,
  add column puno_nota text,
  add constraint cuellos_puno_nota_largo
    check (puno_nota is null or length(puno_nota) <= 500);

comment on column public.cuellos.puno_id   is 'Puno (existente) que usa este cuello';
comment on column public.cuellos.puno_nota is 'Aclaracion del puno que usa (ej: mismo diseno, otros colores)';

create index cuellos_puno_id_idx on public.cuellos (puno_id) where puno_id is not null;

-- Solo un cuello puede usar un puno, y lo que se vincula debe ser un puno.
create or replace function public.fn_validar_puno_del_cuello()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pieza text;
begin
  if new.puno_id is null then
    return new;
  end if;
  if new.pieza <> 'cuello' then
    raise exception 'Solo un cuello puede usar un puño.' using errcode = '23514';
  end if;
  select c.pieza into v_pieza from public.cuellos c where c.id = new.puno_id;
  if v_pieza is distinct from 'puno' then
    raise exception 'El puño elegido no es un puño.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger cuellos_validar_puno
  before insert or update of puno_id, pieza on public.cuellos
  for each row
  execute function public.fn_validar_puno_del_cuello();

notify pgrst, 'reload schema';
