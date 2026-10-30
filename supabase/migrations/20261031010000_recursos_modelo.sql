-- Modelo común de recursos (business/integramente-recursos-spec.md §1).
-- Aplicar con `supabase db query --linked -f` (nunca db push en este
-- proyecto), después de 20261031000000_recursos_modulos_enum.sql.
--
-- Dos ideas centrales:
-- 1. Lo interno del equipo vive en media_resources_interno, que solo la
--    clínica puede leer (RLS). La familia lee media_resources directamente
--    y por actividades_sugeridas(); ninguna de las dos vías llega a lo
--    interno, no se trata solo de ocultarlo en la interfaz.
-- 2. Las reglas de seguridad de asignación son datos del recurso
--    (alergenos, exclusiones, supervisión requerida, rotación), así la regla
--    en TypeScript (src/lib/reglasRecursos.ts) y la de SQL leen lo mismo.

-- ─── Campos públicos (lo que ve la familia) ───
alter table public.media_resources
  add column if not exists sabias_que text,
  add column if not exists actividad text,
  add column if not exists dosis text,
  add column if not exists ten_en_cuenta text,
  add column if not exists para_cerrar text,
  add column if not exists ayuda text,
  add column if not exists adaptacion_por_etapa jsonb,
  add column if not exists poster_path text,
  add column if not exists drive_file_id text,
  add column if not exists permite_doble_tarea boolean not null default false,
  add column if not exists requiere_plan_individual boolean not null default false,
  add column if not exists requiere_supervision text
    check (requiere_supervision in ('autonomia_comprobada', 'guia_verbal', 'acompanamiento_presencial_continuo', 'ayuda_fisica_entrenada')),
  add column if not exists alergenos text[],
  add column if not exists exclusiones text[],
  add column if not exists grupo_rotacion text,
  add column if not exists estado_clinico text not null default 'aprobado'
    check (estado_clinico in ('aprobado', 'en_revision', 'bloqueado')),
  add column if not exists orden integer;

comment on column public.media_resources.actividad is 'Tu actividad / Cómo realizarla en texto: párrafos separados por línea en blanco, viñetas con "• " y pasos con "1. ".';
comment on column public.media_resources.adaptacion_por_etapa is 'Adaptación por etapa cognitiva: {preventivo, dcl, leve, moderada, avanzada}. La familia ve solo la de su etapa.';
comment on column public.media_resources.alergenos is 'pescado | frutos_secos | huevo | leche. No se asigna si el perfil registra esa alergia.';
comment on column public.media_resources.exclusiones is 'disfagia_sin_textura | desnutricion. No se asigna automáticamente si el perfil tiene ese dato cargado.';
comment on column public.media_resources.grupo_rotacion is 'Un mismo usuario no recibe dos recursos del mismo grupo en la misma semana.';
comment on column public.media_resources.estado_clinico is 'Solo "bloqueado" impide asignar; "en_revision" se sigue mostrando.';

-- ─── Lo interno del equipo ───
create table if not exists public.media_resources_interno (
  resource_id uuid primary key references public.media_resources (id) on delete cascade,
  objetivo text,
  objetivo_esperado text,
  areas_trabajo text[],
  fuente text,
  fuente_url text,
  progresion text,
  reglas text,
  etiquetas text[],
  video_notas text,
  revision text,
  pendientes text,
  updated_at timestamptz not null default now()
);

comment on table public.media_resources_interno is 'Notas internas del equipo por recurso (objetivo, fuente, progresión, reglas, pendientes). Solo la clínica: nunca llega a la familia.';

alter table public.media_resources_interno enable row level security;

drop policy if exists "media_resources_interno: profesional" on public.media_resources_interno;
create policy "media_resources_interno: profesional" on public.media_resources_interno
  for all using (public.is_profesional()) with check (public.is_profesional());

grant select, insert, update, delete on public.media_resources_interno to authenticated;

-- Lo interno que ya existía en media_resources pasa a la tabla interna.
insert into public.media_resources_interno (resource_id, objetivo, progresion, reglas, areas_trabajo)
select id, objetivo, progresion, requisito, dominios
from public.media_resources
where objetivo is not null or progresion is not null or requisito is not null or dominios is not null
on conflict (resource_id) do update set
  objetivo = coalesce(excluded.objetivo, media_resources_interno.objetivo),
  progresion = coalesce(excluded.progresion, media_resources_interno.progresion),
  reglas = coalesce(excluded.reglas, media_resources_interno.reglas),
  areas_trabajo = coalesce(excluded.areas_trabajo, media_resources_interno.areas_trabajo);

update public.media_resources
set objetivo = null, progresion = null, requisito = null, dominios = null
where objetivo is not null or progresion is not null or requisito is not null or dominios is not null;

-- ─── Perfil de la persona para asignar recursos ───
-- Etapa cognitiva: se deriva de lo informado en el cuestionario; la clínica
-- puede fijarla. Ruta física: ya existe (clinical_profiles.fisico +
-- tier_override_fisico). Supervisión y nutrición: nuevos, cargados por la
-- clínica. Un dato ausente significa "sin dato", no "sin restricción".
alter table public.patients
  add column if not exists etapa_cognitiva_override text
    check (etapa_cognitiva_override in ('preventivo', 'dcl', 'leve', 'moderada', 'avanzada')),
  add column if not exists supervision text
    check (supervision in ('autonomia_comprobada', 'guia_verbal', 'acompanamiento_presencial_continuo', 'ayuda_fisica_entrenada')),
  add column if not exists nutricion jsonb not null default '{}'::jsonb;

comment on column public.patients.nutricion is 'Flags opcionales: alergias {pescado,frutos_secos,huevo,leche}, disfagia, textura_prescrita, restriccion_liquidos, potasio, sodio, renal, diabetes, anticoagulantes, celiaquia, desnutricion, gota. Ausente = sin dato.';

-- Dosis o porción autorizada para esta persona en esta tarea.
alter table public.plan_tasks add column if not exists indicacion_individual text;

-- ─── Etapa cognitiva (misma lógica que tenía actividades_sugeridas) ───
-- Derivada SOLO de lo que la familia informó (nunca se deduce un
-- diagnóstico, general_rules.md §7), salvo que la clínica la haya fijado.
create or replace function public.etapas_cognitivas(p_patient_id uuid)
returns text[]
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  a jsonb;
  v_override text;
begin
  select etapa_cognitiva_override into v_override from public.patients where id = p_patient_id;
  if v_override is not null then
    return array[v_override];
  end if;
  select oa.answers into a from public.onboarding_answers oa where oa.patient_id = p_patient_id;
  a := coalesce(a, '{}'::jsonb);
  return case
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
end;
$$;

revoke all on function public.etapas_cognitivas(uuid) from public, anon, authenticated;

-- ─── Perfil para recursos ───
-- La clínica recibe todo; la familia y el participante, solo la etapa (para
-- mostrar la adaptación que les corresponde). La familia nunca ve
-- semáforos ni la ruta física.
create or replace function public.perfil_recursos(p_patient_id uuid default null)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_patient_id uuid := p_patient_id;
  v_pro boolean := public.is_profesional();
  v_ruta text;
  p public.patients;
begin
  if v_patient_id is null then
    select pl.patient_id into v_patient_id
    from public.patient_links pl
    where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
    limit 1;
  elsif not v_pro and not exists (
    select 1 from public.patient_links pl where pl.profile_id = auth.uid() and pl.patient_id = v_patient_id
  ) then
    raise exception 'Sin acceso a este paciente.' using errcode = '42501';
  end if;
  if v_patient_id is null then
    return null;
  end if;

  if not v_pro then
    return jsonb_build_object('etapas', to_jsonb(public.etapas_cognitivas(v_patient_id)));
  end if;

  select * into p from public.patients where id = v_patient_id;
  select coalesce(p.tier_override_fisico::text, cp.fisico::text) into v_ruta
  from public.clinical_profiles cp where cp.patient_id = v_patient_id;
  return jsonb_build_object(
    'etapas', to_jsonb(public.etapas_cognitivas(v_patient_id)),
    'etapaOverride', p.etapa_cognitiva_override,
    'rutaOverride', p.tier_override_fisico::text,
    'ruta', coalesce(v_ruta, p.tier_override_fisico::text),
    'supervision', p.supervision,
    'nutricion', p.nutricion
  );
end;
$$;

grant execute on function public.perfil_recursos(uuid) to authenticated;

-- La clínica carga etapa (override), ruta física (override del eje físico),
-- supervisión y flags de nutrición. Por
-- RPC porque el cliente solo puede actualizar nombre y edad de patients
-- (20260910010000_fix_patients_self_update.sql).
create or replace function public.actualizar_perfil_recursos(
  p_patient_id uuid,
  p_etapa_override text,
  p_ruta_override text,
  p_supervision text,
  p_nutricion jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede editar el perfil para recursos.' using errcode = '42501';
  end if;
  update public.patients
  set etapa_cognitiva_override = nullif(p_etapa_override, ''),
      tier_override_fisico = nullif(p_ruta_override, '')::public.tier,
      supervision = nullif(p_supervision, ''),
      nutricion = coalesce(p_nutricion, '{}'::jsonb)
  where id = p_patient_id;
  if not found then
    raise exception 'Paciente no encontrado.' using errcode = '22023';
  end if;
end;
$$;

grant execute on function public.actualizar_perfil_recursos(uuid, text, text, text, jsonb) to authenticated;

-- ─── Sugerencias para la familia, con las reglas de seguridad ───
-- Mismas reglas que src/lib/reglasRecursos.ts (ahí están los tests).
create or replace function public.actividades_sugeridas()
returns setof public.media_resources
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_niveles text[];
  v_fisico text;
  v_supervision text;
  v_nut jsonb;
  v_grupos_semana text[];
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
  if v_patient_id is null then
    return;
  end if;

  v_niveles := public.etapas_cognitivas(v_patient_id);

  select coalesce(pt.tier_override_fisico::text, cp.fisico::text, 'amarillo'), pt.supervision, coalesce(pt.nutricion, '{}'::jsonb)
  into v_fisico, v_supervision, v_nut
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  where pt.id = v_patient_id;

  -- Grupos de rotación que ya tiene el plan publicado más reciente.
  select coalesce(array_agg(distinct r.grupo_rotacion) filter (where r.grupo_rotacion is not null), '{}')
  into v_grupos_semana
  from public.plan_tasks t
  join public.media_resources r on r.id = t.media_resource_id
  where t.plan_id = (
    select id from public.plans where patient_id = v_patient_id and status = 'published' order by publish_at desc limit 1
  );

  return query
  select r.*
  from public.media_resources r
  where r.activo
    and r.estado_clinico <> 'bloqueado'
    and (r.niveles_cognitivos is null or r.niveles_cognitivos && v_niveles)
    and (
      case
        when r.niveles_motores is not null then v_fisico = any (r.niveles_motores)
        when r.modulo in ('movimiento', 'gerontogimnasia') then v_fisico = 'verde'
        else true
      end
    )
    -- Gerontogimnasia en demencia avanzada: requiere pauta individual del
    -- equipo, nunca se sugiere sola (salvo la introducción, que no es ejercicio).
    and not (r.modulo = 'gerontogimnasia' and v_niveles = array['avanzada'] and r.codigo is distinct from 'GER-010')
    and (r.requiere_supervision is null or r.requiere_supervision = v_supervision)
    -- Nutrición: exclusiones solo si el dato está cargado.
    and not exists (select 1 from unnest(coalesce(r.alergenos, '{}')) al where (v_nut -> 'alergias' ->> al)::boolean is true)
    and not ('disfagia_sin_textura' = any (coalesce(r.exclusiones, '{}'))
             and (v_nut ->> 'disfagia')::boolean is true and coalesce(v_nut ->> 'textura_prescrita', '') = '')
    and not ('desnutricion' = any (coalesce(r.exclusiones, '{}')) and (v_nut ->> 'desnutricion')::boolean is true)
    and (r.grupo_rotacion is null or not (r.grupo_rotacion = any (v_grupos_semana)))
  order by r.modulo, coalesce(r.orden, 1000), r.titulo;
end;
$$;

grant execute on function public.actividades_sugeridas() to authenticated;
