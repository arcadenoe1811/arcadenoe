-- =====================================================================
-- 00008 - La herencia siempre cruza de pieza
--
-- Un hijo hereda de una pieza del OTRO tipo: cuello -> puno o
-- puno -> cuello. Nunca cuello -> cuello ni puno -> puno. Evita errores
-- del usuario al vincular (ej: heredar el diseno de otro cuello en vez de
-- armar el puno).
-- =====================================================================

create or replace function public.fn_validar_padre()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_actual uuid := new.padre_id;
  v_pasos  int  := 0;
  v_pieza  text;
begin
  if new.padre_id is not null then
    select c.pieza into v_pieza from public.cuellos c where c.id = new.padre_id;
    if v_pieza = new.pieza then
      raise exception 'Solo se hereda entre piezas distintas: un % hereda de un %, no de otro %.',
        case new.pieza when 'puno' then 'puño' else 'cuello' end,
        case new.pieza when 'puno' then 'cuello' else 'puño' end,
        case new.pieza when 'puno' then 'puño' else 'cuello' end
        using errcode = '23514';
    end if;
  end if;

  -- Si cambia la pieza, sus hijos tampoco pueden quedar del mismo tipo.
  if tg_op = 'UPDATE' and new.pieza is distinct from old.pieza and exists (
    select 1 from public.cuellos h where h.padre_id = new.id and h.pieza = new.pieza
  ) then
    raise exception 'No se puede cambiar la pieza: tiene hijos del mismo tipo (la herencia debe cruzar de pieza).'
      using errcode = '23514';
  end if;

  while v_actual is not null loop
    if v_actual = new.id then
      raise exception 'Un diseño no puede heredar de sí mismo ni de sus hijos.'
        using errcode = '23514';
    end if;
    v_pasos := v_pasos + 1;
    if v_pasos > 20 then
      raise exception 'La cadena de herencia es demasiado larga.' using errcode = '23514';
    end if;
    select c.padre_id into v_actual from public.cuellos c where c.id = v_actual;
  end loop;
  return new;
end;
$$;

drop trigger if exists cuellos_validar_padre on public.cuellos;
create trigger cuellos_validar_padre
  before insert or update of padre_id, pieza on public.cuellos
  for each row
  execute function public.fn_validar_padre();
