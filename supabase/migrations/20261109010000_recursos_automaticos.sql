-- Recursos automáticos (antes «recursos de bienvenida»): recursos que se
-- agregan solos al plan de una cuenta según un disparador.
--
--   cuenta_creada    al crear la cuenta (cuando termina el cuestionario y se
--                    crea el paciente): plan de bienvenida, como antes.
--   cuenta_aprobada  cuando la clínica aprueba la cuenta.
--   primera_semana   al publicar la primera semana de la clínica.
--   cada_semana      al publicar cualquier semana de la clínica.
--   inmediato        se aplica una vez, a pedido, a todas las cuentas con una
--                    semana en curso, y se desactiva solo.
--
-- Los días (dia_offset: 0 = el día en que se agrega o el primero de la
-- semana) se ajustan para caer siempre dentro de la semana del plan. Un
-- recurso que ya está en esa semana no se repite.

alter table public.recursos_bienvenida rename to recursos_automaticos;
alter table public.recursos_automaticos
  add column disparador text not null default 'cuenta_creada'
    check (disparador in ('cuenta_creada', 'cuenta_aprobada', 'primera_semana', 'cada_semana', 'inmediato')),
  add column aplicado_en timestamptz,
  add column aplicado_cuentas int;
alter policy "recursos_bienvenida: profesional all" on public.recursos_automaticos rename to "recursos_automaticos: profesional all";

-- Fecha (en Costa Rica) de un timestamp.
create or replace function public.fecha_cr(p timestamptz)
returns date language sql immutable as $$ select (p at time zone 'America/Costa_Rica')::date $$;

-- Último día de la semana de un plan: del día de publicación al domingo
-- siguiente (o de domingo a sábado si se publicó un domingo).
create or replace function public.fin_semana_plan(p_publish timestamptz)
returns date language sql immutable as $$
  select public.fecha_cr(p_publish) + (case when extract(dow from public.fecha_cr(p_publish)) = 0 then 6 else 7 - extract(dow from public.fecha_cr(p_publish))::int end)
$$;

-- Agrega al plan los recursos automáticos activos de un disparador (o uno
-- solo, si se pasa p_recurso). Devuelve cuántas tareas agregó.
create or replace function public.agregar_recursos_automaticos(p_plan uuid, p_disparador text, p_recurso uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_plan public.plans%rowtype;
  v_inicio date;
  v_fin date;
  v_base date;
  v_hoy date := public.fecha_cr(now());
  v_n int;
begin
  select * into v_plan from public.plans where id = p_plan;
  if not found then return 0; end if;
  v_inicio := public.fecha_cr(v_plan.publish_at);
  v_fin := public.fin_semana_plan(v_plan.publish_at);
  v_base := greatest(v_inicio, v_hoy);
  if v_base > v_fin then return 0; end if;

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, media_resource_id, sort_order, es_onboarding)
  select p_plan,
         public.dia_semana_cr((least(v_base + ra.dia_offset, v_fin))::timestamp at time zone 'America/Costa_Rica'),
         least(v_base + ra.dia_offset, v_fin) = v_hoy,
         ra.hora, mr.titulo, mr.tipo::public.task_tipo, 'pendiente', mr.duracion, mr.detalle, mr.precaucion,
         case when mr.pasos is null then null else to_jsonb(mr.pasos) end, mr.por_que, mr.id,
         1000 + row_number() over (order by ra.dia_offset, ra.orden),
         v_plan.origen = 'bienvenida'
  from public.recursos_automaticos ra
  join public.media_resources mr on mr.id = ra.media_resource_id
  where mr.activo
    and (case when p_recurso is not null then ra.id = p_recurso else ra.activo and ra.disparador = p_disparador end)
    and not exists (select 1 from public.plan_tasks x where x.plan_id = p_plan and x.media_resource_id = mr.id);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function public.agregar_recursos_automaticos(uuid, text, uuid) from public, anon, authenticated;

-- Plan en curso de un paciente: el último publicado cuya semana no terminó.
create or replace function public.plan_en_curso(p_patient_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select p.id from public.plans p
  where p.patient_id = p_patient_id and p.status = 'published' and p.publish_at <= now()
    and public.fin_semana_plan(p.publish_at) >= public.fecha_cr(now())
  order by p.publish_at desc limit 1
$$;

-- Al crear la cuenta (vínculo con el paciente): plan de bienvenida.
create or replace function public.asignar_recursos_bienvenida(p_patient_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_plan uuid;
begin
  if exists (select 1 from public.plans where patient_id = p_patient_id) then return null; end if;
  if not exists (select 1 from public.recursos_automaticos ra join public.media_resources mr on mr.id = ra.media_resource_id
                 where ra.activo and ra.disparador = 'cuenta_creada' and mr.activo) then return null; end if;
  insert into public.plans (patient_id, status, created_by, publish_at, origen)
  values (p_patient_id, 'published', null, now(), 'bienvenida') returning id into v_plan;
  perform public.agregar_recursos_automaticos(v_plan, 'cuenta_creada');
  return v_plan;
end;
$$;

-- Al aprobar la cuenta: a la semana en curso o, si no hay, a una de bienvenida.
create or replace function public.recursos_al_aprobar(p_patient_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_plan uuid;
begin
  if not exists (select 1 from public.recursos_automaticos ra join public.media_resources mr on mr.id = ra.media_resource_id
                 where ra.activo and ra.disparador = 'cuenta_aprobada' and mr.activo) then return; end if;
  v_plan := public.plan_en_curso(p_patient_id);
  if v_plan is null then
    insert into public.plans (patient_id, status, created_by, publish_at, origen)
    values (p_patient_id, 'published', null, now(), 'bienvenida') returning id into v_plan;
  end if;
  perform public.agregar_recursos_automaticos(v_plan, 'cuenta_aprobada');
end;
$$;

create or replace function public.aprobar_cuenta(p_patient_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_dias int;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  select dias_demo into v_dias from public.config_clinica where id = 1;
  update public.patients
  set aprobada_en = now(), aprobada_por = auth.uid(), rechazada_en = null, rechazo_motivo = null,
      requiere_contacto = false, requiere_contacto_nota = null,
      demo_inicio = coalesce(demo_inicio, now()), demo_fin = coalesce(demo_fin, now() + make_interval(days => coalesce(v_dias, 7)))
  where id = p_patient_id and aprobada_en is null;
  if not found then raise exception 'La cuenta ya estaba aprobada o no existe.' using errcode = '22023'; end if;
  perform public.recursos_al_aprobar(p_patient_id);
  perform public.sincronizar_estados_paciente(p_patient_id, 'Aprobada por la clínica', auth.uid());
end;
$$;

-- Al publicar una semana de la clínica: primera semana y cada semana.
create or replace function public.trg_recursos_por_semana()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.origen <> 'clinica' or new.status <> 'published' then return new; end if;
  if not exists (select 1 from public.plans p where p.patient_id = new.patient_id and p.origen = 'clinica' and p.id <> new.id) then
    perform public.agregar_recursos_automaticos(new.id, 'primera_semana');
  end if;
  perform public.agregar_recursos_automaticos(new.id, 'cada_semana');
  return new;
end;
$$;
create trigger plans_recursos_automaticos after insert on public.plans
  for each row execute function public.trg_recursos_por_semana();

-- Aplicación inmediata: a todas las cuentas con una semana en curso (no
-- rechazadas), una sola vez; después el recurso queda desactivado.
create or replace function public.aplicar_recurso_inmediato(p_recurso uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_total int := 0; v_n int; r record;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if not exists (select 1 from public.recursos_automaticos where id = p_recurso and disparador = 'inmediato' and activo) then
    raise exception 'Ese recurso no está activo para aplicación inmediata.' using errcode = '22023';
  end if;
  for r in
    select pt.id as patient_id, public.plan_en_curso(pt.id) as plan_id
    from public.patients pt
    where pt.rechazada_en is null
  loop
    if r.plan_id is null then continue; end if;
    v_n := public.agregar_recursos_automaticos(r.plan_id, 'inmediato', p_recurso);
    if v_n > 0 then v_total := v_total + 1; end if;
  end loop;
  update public.recursos_automaticos set activo = false, aplicado_en = now(), aplicado_cuentas = v_total where id = p_recurso;
  return v_total;
end;
$$;
grant execute on function public.aplicar_recurso_inmediato(uuid) to authenticated;
