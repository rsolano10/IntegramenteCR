-- WhatsApp es el único canal de comunicación con la clínica (decisión de
-- negocio, 2026-10-13). La app deja de tener chat familia ↔ clínica:
--   · las familias y participantes ya no pueden escribir en `mensajes`;
--   · el aviso de riesgo y el comentario de la semana dejan de copiarse a
--     la conversación (el aviso vive en alertas_riesgo; el comentario en
--     plans.feedback_mensaje, que la familia ve en el resumen de la semana);
--   · la clínica obtiene el WhatsApp de la familia para escribirle.
-- El historial de `mensajes` se conserva (lo sigue leyendo seguimiento-ia).
-- `assign_initial_plan` sigue guardando el mensaje de bienvenida: es el
-- aviso de una sola vía que muestra WelcomeMessageModal, no un chat.

drop policy if exists "mensajes: familiar insert" on public.mensajes;
drop policy if exists "mensajes: participante insert" on public.mensajes;

create or replace function public.enviar_alerta_riesgo(p_tipo text, p_automatica boolean default false)
returns table (id uuid, created_at timestamptz, vista_at timestamptz, nueva boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_patient_id uuid;
  v_existente public.alertas_riesgo;
  v_nueva public.alertas_riesgo;
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
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
$$;

create or replace function public.review_week(p_plan_id uuid, p_feedback text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_feedback text := nullif(btrim(coalesce(p_feedback, '')), '');
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede revisar una semana.' using errcode = '42501';
  end if;

  select patient_id into v_patient_id from public.plans where id = p_plan_id;
  if v_patient_id is null then
    raise exception 'Plan no encontrado.' using errcode = '22023';
  end if;

  update public.plans
  set reviewed_at = now(), feedback_mensaje = v_feedback
  where id = p_plan_id;
end;
$$;

-- Contactos de WhatsApp de las cuentas vinculadas a un paciente, para que
-- la clínica le escriba a la familia desde la ficha o desde un aviso.
create or replace function public.contactos_paciente(p_patient_id uuid)
returns table (profile_id uuid, nombre text, relation public.patient_relation, whatsapp_phone text)
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
  select pr.id, pr.nombre, pl.relation, pr.whatsapp_phone
  from public.patient_links pl
  join public.profiles pr on pr.id = pl.profile_id
  where pl.patient_id = p_patient_id
    and pl.relation in ('familiar_admin', 'participante')
    and pr.is_active
  order by (pl.relation = 'familiar_admin') desc, pr.nombre;
end;
$$;

grant execute on function public.contactos_paciente(uuid) to authenticated;
