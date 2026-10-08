-- "Más actividades para hacer juntos" (pestaña Mi semana de la familia).
-- Antes la familia veía el catálogo COMPLETO de la biblioteca, incluidas
-- actividades de movimiento que el perfil físico del paciente desaconseja.
-- Esto devuelve solo las compatibles con su perfil:
--
-- * Nivel cognitivo — derivado SOLO de lo que la familia informó (nunca se
--   deduce un diagnóstico, general_rules.md §7): diagnóstico DCL → dcl;
--   demencia con etapa conocida → esa etapa; demencia sin etapa → leve o
--   moderada; sin diagnóstico y sin cambios → preventivo; cambios leves →
--   preventivo o dcl; cualquier otra cosa → dcl o leve (conservador).
-- * Seguridad motora (prioridad absoluta en el módulo Movimiento, manual de
--   contenidos) — el eje físico del perfil, con el override de la clínica
--   si existe. Un recurso de Movimiento sin niveles_motores declarados solo
--   se sugiere a perfiles físicos en verde.
--
-- security definer: el participante no puede leer onboarding_answers ni
-- clinical_profiles directamente, y la familia nunca ve los semáforos —
-- solo el resultado filtrado.

create or replace function public.actividades_sugeridas()
returns setof public.media_resources
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_patient_id uuid;
  a jsonb;
  v_niveles text[];
  v_fisico text;
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
  if v_patient_id is null then
    return;
  end if;

  select oa.answers into a from public.onboarding_answers oa where oa.patient_id = v_patient_id;
  a := coalesce(a, '{}'::jsonb);

  v_niveles := case
    when a ->> 'diagnostico_cognitivo_informado' = 'dcl' then array['dcl']
    when a ->> 'diagnostico_cognitivo_informado' = 'demencia' then
      case
        when a ->> 'etapa_demencia_informada' in ('leve', 'moderada', 'avanzada') then array[a ->> 'etapa_demencia_informada']
        else array['leve', 'moderada']
      end
    when a ->> 'cambio_cognitivo_sin_diagnostico' = 'sin_cambios' then array['preventivo']
    when a ->> 'cambio_cognitivo_sin_diagnostico' = 'leves' then array['preventivo', 'dcl']
    else array['dcl', 'leve']
  end;

  select coalesce(pt.tier_override_fisico::text, cp.fisico::text, 'amarillo') into v_fisico
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  where pt.id = v_patient_id;

  return query
  select r.*
  from public.media_resources r
  where r.activo
    and (r.niveles_cognitivos is null or r.niveles_cognitivos && v_niveles)
    and (
      case
        when r.niveles_motores is not null then v_fisico = any (r.niveles_motores)
        when r.modulo = 'movimiento' then v_fisico = 'verde'
        else true
      end
    )
  order by r.modulo, r.titulo;
end;
$$;

grant execute on function public.actividades_sugeridas() to authenticated;
