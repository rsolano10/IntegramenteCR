-- integramente_flujos_interaccion_usuarios.md §3.1/§7.1 — detección de
-- posibles duplicados al autoregistrarse: antes de crear un paciente
-- nuevo, avisar si ya existe uno con nombre+edad similares vinculado a
-- otra familia, EN VEZ de fusionar automáticamente (el propio documento:
-- "fusionar mal a dos personas distintas es un error mucho más costoso
-- que dejarlo pendiente de revisión humana" — nunca autofusión, siempre
-- alerta para revisión manual del equipo clínico).
--
-- SECURITY DEFINER porque el llamador (familiar/paciente autoregistrándose)
-- no tiene — ni debería tener — permiso de lectura sobre pacientes de
-- otras familias (RLS "patients: linked read"); esta función expone
-- deliberadamente lo mínimo posible: solo si existe un posible match y su
-- nombre (para que la persona pueda confirmar "sí, es la misma"), nunca
-- datos clínicos, de contacto, ni de la familia ya vinculada.
create or replace function public.check_possible_duplicate(p_nombre text, p_edad text)
returns table (id uuid, nombre text)
language sql
security definer
stable
set search_path = public
as $$
  select pt.id, pt.nombre
  from public.patients pt
  where lower(btrim(pt.nombre)) = lower(btrim(p_nombre))
    and (p_edad is null or pt.edad is null or pt.edad = p_edad)
    and not exists (
      select 1 from public.patient_links pl where pl.patient_id = pt.id and pl.profile_id = auth.uid()
    )
  limit 3;
$$;

grant execute on function public.check_possible_duplicate(text, text) to authenticated;

-- Puntero informativo, nunca una fusión: si la persona confirma "sí, es la
-- misma" pero igual se crea su propio registro (self_onboard nunca otorga
-- acceso cruzado entre familias), se deja esta marca para que el equipo
-- clínico lo revise y decida manualmente en la ficha de pre-ingreso.
alter table public.patients add column posible_duplicado_de uuid references public.patients (id);

-- Nueva firma (4 parámetros, el último con default) — se elimina la
-- anterior de 3 parámetros explícitamente, porque Postgres trata distintas
-- cantidades de parámetros como sobrecargas separadas, no como la misma
-- función: sin el drop, quedarían las dos versiones coexistiendo.
drop function if exists public.self_onboard(text, text, jsonb);

create or replace function public.self_onboard(p_nombre text, p_edad text, p_answers jsonb, p_posible_duplicado_de uuid default null)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
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

  if exists (select 1 from public.patient_links where profile_id = auth.uid()) then
    raise exception 'Ya tenés un perfil creado.' using errcode = '42501';
  end if;

  -- El puntero de posible duplicado solo se acepta si esa función YA lo
  -- devolvió como candidato — evita que el cliente marque un patient_id
  -- arbitrario que nunca vio.
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

  return v_patient;
end;
$$;

grant execute on function public.self_onboard(text, text, jsonb, uuid) to authenticated;
