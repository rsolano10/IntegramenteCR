-- Un familiar con varios pacientes (2026-11-28).
-- Hasta ahora, las funciones que la familia llama sin decir de qué paciente
-- se trata tomaban «el primer paciente» de la cuenta. Ahora reciben el
-- paciente activo (p_patient, opcional: sin él, el primero, como antes) y
-- verifican que la cuenta esté vinculada a ese paciente. La familia también
-- puede registrar a otro familiar (self_onboard ya no lo impide).

-- El paciente con el que trabaja la cuenta: el pedido (si está vinculado)
-- o el primero.
create or replace function public.paciente_activo(p_patient uuid default null)
returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v uuid;
begin
  if p_patient is not null then
    if not exists (select 1 from public.patient_links pl where pl.profile_id = auth.uid() and pl.patient_id = p_patient and pl.relation in ('familiar_admin', 'participante')) then
      raise exception 'Esta cuenta no está vinculada a ese paciente.' using errcode = '42501';
    end if;
    return p_patient;
  end if;
  select pl.patient_id into v from public.patient_links pl
    where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
    order by pl.created_at limit 1;
  return v;
end;
$$;
revoke execute on function public.paciente_activo(uuid) from public, anon;
grant execute on function public.paciente_activo(uuid) to authenticated;

-- Todos los pacientes de la cuenta (para elegir entre familiares).
create or replace function public.my_patients()
returns table (id uuid, nombre text, relation text, estado_cuenta text, plan_status text, vinculado_en timestamptz)
language sql stable security definer set search_path = public as $$
  select pt.id, pt.nombre, pl.relation::text, pr.estado_cuenta::text, pt.plan_status::text, pl.created_at
  from public.patient_links pl
  join public.patients pt on pt.id = pl.patient_id
  join public.profiles pr on pr.id = pl.profile_id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  order by pl.created_at;
$$;
revoke execute on function public.my_patients() from public, anon;
grant execute on function public.my_patients() to authenticated;

drop function if exists public.actividades_sugeridas();
CREATE OR REPLACE FUNCTION public.actividades_sugeridas(p_patient uuid DEFAULT NULL::uuid)
 RETURNS SETOF media_resources
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid;
  v_niveles text[];
  v_fisico text;
  v_supervision text;
  v_nut jsonb;
  v_grupos_semana text[];
begin
  v_patient_id := public.paciente_activo(p_patient);
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
$function$
;
grant execute on function public.actividades_sugeridas to authenticated;

drop function if exists public.elegir_programa(p_modalidad modalidad);
CREATE OR REPLACE FUNCTION public.elegir_programa(p_modalidad modalidad, p_patient uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid;
begin
  if p_modalidad not in ('autoguiado', 'orientado') then
    raise exception 'Programa inválido.' using errcode = '22023';
  end if;

  v_patient_id := public.paciente_activo(p_patient);

  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  -- Una vez asignado el plan, cambiar de programa pasa por la clínica.
  update public.patients
  set modalidad = p_modalidad, programa_elegido_en = now()
  where id = v_patient_id and plan_status = 'pendiente';

  if not found then
    raise exception 'Tu programa ya fue asignado. Para cambiarlo, escribile a tu clínica.' using errcode = '42501';
  end if;
end;
$function$
;
grant execute on function public.elegir_programa to authenticated;

drop function if exists public.enviar_alerta_riesgo(p_tipo text, p_automatica boolean);
CREATE OR REPLACE FUNCTION public.enviar_alerta_riesgo(p_tipo text, p_automatica boolean DEFAULT false, p_patient uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, vista_at timestamp with time zone, nueva boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
  v_patient_id uuid;
  v_existente public.alertas_riesgo;
  v_nueva public.alertas_riesgo;
begin
  v_patient_id := public.paciente_activo(p_patient);
  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  select * into v_existente
  from public.alertas_riesgo a
  where a.patient_id = v_patient_id and a.tipo = p_tipo and a.atendida_at is null and a.created_at > now() - interval '30 minutes'
  order by a.created_at desc
  limit 1;

  if v_existente.id is not null then
    return query select v_existente.id, v_existente.created_at, v_existente.vista_at, false;
    return;
  end if;

  insert into public.alertas_riesgo (patient_id, tipo, automatica, creado_por)
  values (v_patient_id, p_tipo, coalesce(p_automatica, false), auth.uid())
  returning * into v_nueva;

  return query select v_nueva.id, v_nueva.created_at, v_nueva.vista_at, true;
end;
$function$
;
grant execute on function public.enviar_alerta_riesgo to authenticated;

drop function if exists public.pedir_ayuda(p_nota text);
CREATE OR REPLACE FUNCTION public.pedir_ayuda(p_nota text DEFAULT NULL::text, p_patient uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, nuevo boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
  v_patient_id uuid;
  v_existente public.pedidos_ayuda;
  v_nuevo public.pedidos_ayuda;
begin
  v_patient_id := public.paciente_activo(p_patient);
  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  select * into v_existente
  from public.pedidos_ayuda p
  where p.patient_id = v_patient_id and p.visto_at is null and p.created_at > now() - interval '30 minutes'
  order by p.created_at desc
  limit 1;

  if v_existente.id is not null then
    return query select v_existente.id, v_existente.created_at, false;
    return;
  end if;

  insert into public.pedidos_ayuda (patient_id, creado_por, nota)
  values (v_patient_id, auth.uid(), nullif(trim(coalesce(p_nota, '')), ''))
  returning * into v_nuevo;

  return query select v_nuevo.id, v_nuevo.created_at, true;
end;
$function$
;
grant execute on function public.pedir_ayuda to authenticated;

drop function if exists public.reregister_onboarding(p_nombre text, p_edad text, p_answers jsonb, p_whatsapp_phone text);
CREATE OR REPLACE FUNCTION public.reregister_onboarding(p_nombre text, p_edad text, p_answers jsonb, p_whatsapp_phone text DEFAULT NULL::text, p_patient uuid DEFAULT NULL::uuid)
 RETURNS patients
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid;
  v_patient public.patients;
begin
  v_patient_id := public.paciente_activo(p_patient);

  if v_patient_id is null then
    raise exception 'No encontramos un perfil para volver a registrar.' using errcode = '42501';
  end if;

  update public.patients
  set nombre = coalesce(nullif(btrim(p_nombre), ''), nombre), edad = coalesce(nullif(btrim(p_edad), ''), edad)
  where id = v_patient_id
  returning * into v_patient;

  insert into public.onboarding_answers (patient_id, answers, schema_version, updated_at)
  values (v_patient_id, p_answers, 2, now())
  on conflict (patient_id) do update set answers = excluded.answers, schema_version = 2, updated_at = now();

  if p_whatsapp_phone is not null and length(btrim(p_whatsapp_phone)) > 0 then
    update public.profiles set whatsapp_phone = btrim(p_whatsapp_phone) where id = auth.uid();
  end if;

  return v_patient;
end;
$function$
;
grant execute on function public.reregister_onboarding to authenticated;

drop function if exists public.solicitar_semana_gratis();
CREATE OR REPLACE FUNCTION public.solicitar_semana_gratis(p_patient uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid;
begin
  v_patient_id := public.paciente_activo(p_patient);
  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  update public.patients
  set semana_gratis_solicitada_en = coalesce(semana_gratis_solicitada_en, now()),
      modalidad = case when programa_elegido_en is null and plan_status = 'pendiente' then 'autoguiado'::public.modalidad else modalidad end,
      programa_elegido_en = coalesce(programa_elegido_en, now())
  where id = v_patient_id;
end;
$function$
;
grant execute on function public.solicitar_semana_gratis to authenticated;

drop function if exists public.my_patient();
CREATE OR REPLACE FUNCTION public.my_patient(p_patient uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, nombre text, edad text, modalidad modalidad, plan_status plan_status, vista_completa boolean, welcome_message_pending boolean, needs_reregistration boolean, programa_elegido boolean, estado_cuenta estado_cuenta, demo_fin timestamp with time zone, rechazo_motivo text, tiene_plan_visible boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select pt.id, pt.nombre, pt.edad, pt.modalidad, pt.plan_status, pt.vista_completa, pt.welcome_message_pending,
         coalesce(oa.schema_version, 1) < 2, pt.programa_elegido_en is not null,
         pr.estado_cuenta, pt.demo_fin, pt.rechazo_motivo,
         exists (select 1 from public.plans p where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now())
  from public.patient_links pl
  join public.patients pt on pt.id = pl.patient_id
  join public.profiles pr on pr.id = pl.profile_id
  left join public.onboarding_answers oa on oa.patient_id = pt.id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
    and (p_patient is null or pt.id = p_patient)
  order by pl.created_at
  limit 1;
end;
$function$
;
grant execute on function public.my_patient to authenticated;

drop function if exists public.mi_referidor();
create or replace function public.mi_referidor(p_patient uuid default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nombre', p.nombre, 'especialidad', p.especialidad, 'institucion', p.institucion)
  from public.referidos r
  join public.profiles p on p.id = r.referidor_id
  where r.patient_id = public.paciente_activo(p_patient);
$$;
grant execute on function public.mi_referidor(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.aplicar_referido(p_codigo text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient uuid;
  v_ref public.profiles;
begin
  select pl.patient_id into v_patient from public.patient_links pl
    where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante') order by pl.created_at desc limit 1;
  if v_patient is null then return null; end if;
  select * into v_ref from public.profiles
    where lower(codigo_referido) = lower(btrim(p_codigo)) and role = 'referidor' and is_active limit 1;
  if v_ref.id is null then return null; end if;
  insert into public.referidos (patient_id, referidor_id, origen, creado_por)
  values (v_patient, v_ref.id, 'enlace', auth.uid()) on conflict (patient_id) do nothing;
  return v_ref.nombre;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.self_onboard(p_nombre text, p_edad text, p_answers jsonb, p_posible_duplicado_de uuid DEFAULT NULL::uuid, p_whatsapp_phone text DEFAULT NULL::text)
 RETURNS patients
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient public.patients;
  v_role public.app_role;
  v_relation public.patient_relation;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null or v_role not in ('familiar', 'paciente') then
    raise exception 'Solo una cuenta familiar o paciente puede crear un perfil.' using errcode = '42501';
  end if;
  v_relation := case when v_role = 'familiar' then 'familiar_admin' else 'participante' end;

  -- Una cuenta de participante es un solo paciente; una familia puede
  -- registrar a más de un familiar.
  if v_role = 'paciente' and exists (select 1 from public.patient_links where profile_id = auth.uid()) then
    raise exception 'Ya tenés un perfil creado.' using errcode = '42501';
  end if;

  if p_posible_duplicado_de is not null and not exists (
    select 1 from public.check_possible_duplicate(p_nombre, p_edad) d where d.id = p_posible_duplicado_de
  ) then
    p_posible_duplicado_de := null;
  end if;

  insert into public.patients (nombre, edad, modalidad, onboarding_complete, posible_duplicado_de)
  values (p_nombre, nullif(btrim(p_edad), ''), 'orientado', true, p_posible_duplicado_de)
  returning * into v_patient;

  insert into public.patient_links (patient_id, profile_id, relation)
  values (v_patient.id, auth.uid(), v_relation);

  insert into public.onboarding_answers (patient_id, answers, schema_version)
  values (v_patient.id, p_answers, 2);

  if p_whatsapp_phone is not null and length(btrim(p_whatsapp_phone)) > 0 then
    update public.profiles set whatsapp_phone = btrim(p_whatsapp_phone) where id = auth.uid();
  end if;

  return v_patient;
end;
$function$
;
