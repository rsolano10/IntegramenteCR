-- §15.4/§17: "Los límites de selección múltiple (EMO-01, patrón de sueño,
-- RUT-06, INT-03) se validan en UI y backend." El límite ya se aplica en UI
-- (toggleMultiAnswer, ver Fase 1); esto agrega la mitad que faltaba —
-- backend. Vive como trigger sobre onboarding_answers en vez de duplicarse
-- en self_onboard/reregister_onboarding/el upsert asistido: es el único
-- punto por el que TODA escritura de respuestas pasa, sin importar la ruta.
create or replace function public.validate_answer_caps()
returns trigger
language plpgsql
as $$
declare
  v_caps jsonb := '{"estado_emocional_actual":2,"patron_sueno":2,"actividades_predominantes":3,"temas_historia_significativa":3}'::jsonb;
  v_key text;
  v_cap int;
  v_len int;
begin
  for v_key, v_cap in select * from jsonb_each_text(v_caps) as t(key, value)
  loop
    if jsonb_typeof(new.answers -> v_key) = 'array' then
      v_len := jsonb_array_length(new.answers -> v_key);
      if v_len > v_cap::int then
        raise exception 'La pregunta "%" acepta como máximo % opciones (se enviaron %).', v_key, v_cap, v_len
          using errcode = '23514';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

create trigger validate_answer_caps_trigger
  before insert or update on public.onboarding_answers
  for each row execute function public.validate_answer_caps();
