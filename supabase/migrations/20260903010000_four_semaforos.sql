-- Fase 10: reescritura del motor clínico para business/general_rules.md.
-- Decisión ya tomada con el usuario: se elimina el tier "overall" combinado
-- y patients.tier_override tal como existen hoy — los 4 semáforos nuevos
-- (nivel_cognitivo, nivel_fisico, nivel_funcional, nivel_nutricional) se
-- muestran SIEMPRE por separado, nunca combinados/promediados, con
-- override independiente por eje (no uno solo).
--
-- Los pacientes ya evaluados con el cuestionario viejo quedan forzados a
-- re-registrarse (Fase 11, schema_version) — clinical_profiles se vacía acá
-- a propósito: es 100% derivada (el trigger la repuebla en cuanto cada
-- paciente vuelva a completar onboarding_answers con el cuestionario
-- nuevo), y sus valores actuales fueron calculados con el motor viejo sobre
-- claves de respuesta que ya no existen — conservarlas sería mostrar datos
-- incorrectos, no una migración real.
truncate table public.clinical_profiles;

alter table public.clinical_profiles rename column movimiento to fisico;
alter table public.clinical_profiles drop column conductual;
alter table public.clinical_profiles drop column overall;

alter table public.patients drop column tier_override;
alter table public.patients add column tier_override_cognitivo public.tier;
alter table public.patients add column tier_override_fisico public.tier;
alter table public.patients add column tier_override_funcional public.tier;
alter table public.patients add column tier_override_nutricional public.tier;

-- Espejo fiel de src/lib/clinicalEngine.ts (computeProfiles) — mismas 62
-- pruebas unitarias corridas contra la versión TS antes de escribir esto.
-- Return columns changed (se quitó conductual/overall) — CREATE OR REPLACE
-- no puede cambiar el tipo de retorno de una función existente.
drop function if exists public.compute_clinical_tiers(jsonb);

create or replace function public.compute_clinical_tiers(a jsonb)
returns table (
  cognitivo public.tier,
  fisico public.tier,
  funcional public.tier,
  nutricional public.tier
)
language plpgsql
immutable
as $$
declare
  v_cognitivo public.tier;
  v_fisico public.tier;
  v_funcional public.tier;
  v_nutricional public.tier;
  v_avdi_ayuda_directa int := 0;
  v_avdi_recordatorios int := 0;
  v_avdb_necesita_ayuda boolean := false;
  v_senales_deglucion boolean;
  v_disfagia_sin_indicaciones boolean;
  v_indicacion_estable boolean;
  fname text;
begin
  -- §8.1 nivel_cognitivo (COG-01 a COG-06). COG-07/respuesta_demanda_cognitiva
  -- queda fuera a propósito: el documento fuente lo dice dos veces ("no
  -- determina el color por sí sola"), pese a que su propia tabla de
  -- clasificación lo lista una vez como criterio amarillo — se sigue la
  -- instrucción explícita repetida sobre la tabla.
  if (a ->> 'memoria_reciente_funcional' = 'recordatorio_constante')
    or (a ->> 'atencion_funcional' = 'periodos_muy_cortos')
    or (a ->> 'comprension_consignas' = 'otra_guia_completa')
    or (a ->> 'organizacion_decisiones' = 'otra_decide')
    or (a ->> 'comunicacion_expresiva' in ('palabras_gestos', 'muchas_dificultades'))
  then
    v_cognitivo := 'rojo';
  elsif (a ->> 'memoria_reciente_funcional' = 'olvida_frecuente')
    or (a ->> 'atencion_funcional' = 'necesita_retomar')
    or (a ->> 'comprension_consignas' in ('uno_dos_pasos', 'una_instruccion_demostracion'))
    or (a ->> 'organizacion_decisiones' = 'necesita_opciones')
    or (a ->> 'comunicacion_expresiva' = 'frases_cortas')
  then
    v_cognitivo := 'amarillo';
  else
    v_cognitivo := 'verde';
  end if;

  -- §9.11 nivel_fisico.
  if (a ->> 'levantarse_silla' in ('ayuda_fisica', 'no_logra'))
    or (a ->> 'equilibrio_de_pie' in ('necesita_sostenido', 'no_puede_pie'))
    or (a ->> 'movilidad_dentro_casa' in ('silla_ruedas', 'cama'))
    or (a ->> 'caidas_ultimos_6_meses' = 'varias_veces')
    or (a ->> 'movilidad_extremidades' = 'muy_limitados')
  then
    v_fisico := 'rojo';
  elsif (a ->> 'movilidad_dentro_casa' in ('baston', 'andadera'))
    or (a ->> 'levantarse_silla' in ('supervision', 'apoyandose'))
    or (a ->> 'equilibrio_de_pie' in ('estable_apoyo_cerca', 'pierde_a_veces'))
    or (a ->> 'caidas_ultimos_6_meses' in ('casi_cae', 'una_vez'))
    or (a ->> 'intensidad_sintomas_movimiento' = 'leves_ocasionales')
    or (a ->> 'disposicion_movimiento' = 'temor_caerse')
    or (jsonb_typeof(a -> 'movimientos_restringidos') = 'array' and jsonb_array_length(a -> 'movimientos_restringidos') > 0)
  then
    v_fisico := 'amarillo';
  else
    v_fisico := 'verde';
  end if;

  -- §8.4 nivel_funcional (AVDI/AVDB).
  foreach fname in array array['avdi_finanzas', 'avdi_compras_organizacion', 'avdi_preparacion_alimentos', 'avdi_telefono', 'avdi_agenda_responsabilidades']
  loop
    if a ->> fname in ('ayuda_directa', 'otra_persona') then
      v_avdi_ayuda_directa := v_avdi_ayuda_directa + 1;
    elsif a ->> fname = 'recordatorios_supervision' then
      v_avdi_recordatorios := v_avdi_recordatorios + 1;
    end if;
  end loop;
  foreach fname in array array['avdb_bano_aseo', 'avdb_vestido', 'avdb_alimentacion', 'avdb_uso_bano']
  loop
    if a ->> fname in ('ayuda_parcial', 'otra_persona') then
      v_avdb_necesita_ayuda := true;
    end if;
  end loop;

  if v_avdi_ayuda_directa >= 2 or v_avdb_necesita_ayuda or (a ->> 'organizacion_decisiones' = 'otra_decide') then
    v_funcional := 'rojo';
  elsif v_avdi_recordatorios >= 1 or v_avdi_ayuda_directa = 1 then
    v_funcional := 'amarillo';
  else
    v_funcional := 'verde';
  end if;

  -- §10.6 nivel_nutricional.
  v_senales_deglucion := (
    select coalesce(bool_or(elem in ('tose', 'atraganta', 'alimento_no_pasa', 'voz_cambia', 'guarda_comida')), false)
    from jsonb_array_elements_text(coalesce(a -> 'dificultades_alimentacion', '[]'::jsonb)) as elem
  );
  v_disfagia_sin_indicaciones := v_senales_deglucion and (a ->> 'valoracion_deglucion' is distinct from 'si_indicaciones');

  if v_disfagia_sin_indicaciones
    or (a ->> 'perdida_peso_no_intencional' = 'si_evidente')
    or (a ->> 'cambio_apetito' = 'disminuido_importante')
    or (a ->> 'regularidad_alimentacion' = 'come_poco_rechaza')
    or (a ->> 'apoyo_durante_alimentacion' in ('ayuda_fisica_parcial', 'otra_alimenta'))
    or exists (
      select 1 from jsonb_array_elements_text(coalesce(a -> 'indicaciones_alimentarias', '[]'::jsonb)) as elem
      where elem in ('renal', 'restriccion_liquidos')
    )
  then
    v_nutricional := 'rojo';
  else
    v_indicacion_estable := exists (
      select 1 from jsonb_array_elements_text(coalesce(a -> 'indicaciones_alimentarias', '[]'::jsonb)) as elem
      where elem in ('diabetes', 'baja_sal', 'colesterol', 'sin_gluten', 'textura_modificada', 'otra')
    );
    if (a ->> 'regularidad_alimentacion' = 'salta_comidas')
      or (a ->> 'apoyo_durante_alimentacion' in ('recordatorios', 'otra_prepara'))
      or (a ->> 'patron_hidratacion' = 'toma_poco')
      or v_indicacion_estable
      or exists (
        select 1 from jsonb_array_elements_text(coalesce(a -> 'dificultades_alimentacion', '[]'::jsonb)) as elem
        where elem = 'masticar'
      )
      or (a ->> 'variedad_alimentaria' in ('variedad_limitada', 'siempre_lo_mismo'))
    then
      v_nutricional := 'amarillo';
    else
      v_nutricional := 'verde';
    end if;
  end if;

  return query select v_cognitivo, v_fisico, v_funcional, v_nutricional;
end;
$$;

create or replace function public.recompute_clinical_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.compute_clinical_tiers(new.answers);
  insert into public.clinical_profiles (patient_id, cognitivo, fisico, funcional, nutricional, computed_at)
  values (new.patient_id, r.cognitivo, r.fisico, r.funcional, r.nutricional, now())
  on conflict (patient_id) do update set
    cognitivo = excluded.cognitivo,
    fisico = excluded.fisico,
    funcional = excluded.funcional,
    nutricional = excluded.nutricional,
    computed_at = now();
  return new;
end;
$$;

-- list_patients(): devuelve los 4 ejes por separado (nunca combinados) más
-- el override independiente por eje, con la misma visibilidad ya existente
-- (solo visible si el llamador tiene link profesional_asignado con ESE
-- paciente). New return columns change the function's identity, same as
-- previous migrations that touched this function.
drop function if exists public.list_patients();

create or replace function public.list_patients()
returns table (
  id uuid,
  nombre text,
  edad text,
  modalidad public.modalidad,
  plan_status public.plan_status,
  onboarding_complete boolean,
  created_at timestamptz,
  cognitivo public.tier,
  fisico public.tier,
  funcional public.tier,
  nutricional public.tier,
  links jsonb,
  needs_review boolean,
  needs_assignment boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  select
    pt.id,
    pt.nombre,
    pt.edad,
    pt.modalidad,
    pt.plan_status,
    pt.onboarding_complete,
    pt.created_at,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_cognitivo, cp.cognitivo) else null end as cognitivo,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_fisico, cp.fisico) else null end as fisico,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_funcional, cp.funcional) else null end as funcional,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_nutricional, cp.nutricional) else null end as nutricional,
    coalesce((
      select jsonb_agg(jsonb_build_object('profile_id', pl.profile_id, 'nombre', pr.nombre, 'role', pr.role, 'relation', pl.relation) order by pl.relation)
      from public.patient_links pl
      join public.profiles pr on pr.id = pl.profile_id
      where pl.patient_id = pt.id
    ), '[]'::jsonb) as links,
    coalesce(cur_tasks.total > 0 and cur_tasks.open_count = 0 and cur_plan.reviewed_at is null, false) as needs_review,
    coalesce(
      cur_tasks.total > 0 and cur_tasks.open_count = 0
      and not exists (
        select 1 from public.plans fp where fp.patient_id = pt.id and fp.status = 'published' and fp.publish_at > now()
      ),
      false
    ) as needs_assignment
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  left join lateral (
    select p.id as plan_id, p.reviewed_at
    from public.plans p
    where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now()
    order by p.publish_at desc
    limit 1
  ) cur_plan on true
  left join lateral (
    select count(*) as total, count(*) filter (where pta.estado in ('pendiente', 'futuro')) as open_count
    from public.plan_tasks pta
    where pta.plan_id = cur_plan.plan_id
  ) cur_tasks on true
  order by pt.created_at desc;
end;
$$;

grant execute on function public.list_patients() to authenticated;
