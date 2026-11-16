-- «Necesito ayuda» del participante, de verdad.
-- Antes la pantalla decía «Ya le avisamos a tu familiar» sin enviar nada.
-- Ahora el pedido queda guardado: el familiar lo ve al abrir Hoy y la
-- clínica lo ve en la ficha del paciente. (Cuando WhatsApp tenga token,
-- este es el punto para mandar también el mensaje.)

create table public.pedidos_ayuda (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  creado_por uuid references public.profiles (id) on delete set null,
  nota text,
  created_at timestamptz not null default now(),
  visto_at timestamptz,
  visto_por uuid references public.profiles (id) on delete set null
);

create index pedidos_ayuda_patient_idx on public.pedidos_ayuda (patient_id, created_at desc);

alter table public.pedidos_ayuda enable row level security;

create policy "pedidos_ayuda: profesional read" on public.pedidos_ayuda
  for select using (public.is_profesional());

create policy "pedidos_ayuda: familia read" on public.pedidos_ayuda
  for select using (public.has_patient_link(patient_id, array['familiar_admin', 'participante']::public.patient_relation[]));

-- Crea (o reutiliza, si hay uno sin ver de los últimos 30 min) el pedido
-- del participante que llama.
create or replace function public.pedir_ayuda(p_nota text default null)
returns table (id uuid, created_at timestamptz, nuevo boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_patient_id uuid;
  v_existente public.pedidos_ayuda;
  v_nuevo public.pedidos_ayuda;
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation = 'participante'
  limit 1;
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
$$;

grant execute on function public.pedir_ayuda(text) to authenticated;

-- El familiar (o la clínica) marca el pedido como visto.
create or replace function public.marcar_pedido_ayuda_visto(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
begin
  select patient_id into v_patient_id from public.pedidos_ayuda where id = p_id;
  if v_patient_id is null then return; end if;
  if not (public.is_profesional() or public.has_patient_link(v_patient_id, array['familiar_admin']::public.patient_relation[])) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.pedidos_ayuda set visto_at = now(), visto_por = auth.uid() where id = p_id and visto_at is null;
end;
$$;

grant execute on function public.marcar_pedido_ayuda_visto(uuid) to authenticated;

-- Para la pantalla del participante: solo el nombre y el teléfono del
-- familiar a cargo, para el botón «Llamar a …».
create or replace function public.familiar_de_contacto(p_patient_id uuid)
returns table (nombre text, telefono text)
language sql
security definer
stable
set search_path = public
as $$
  select pr.nombre, pr.whatsapp_phone
  from public.patient_links pl
  join public.profiles pr on pr.id = pl.profile_id
  where pl.patient_id = p_patient_id and pl.relation = 'familiar_admin'
    and public.has_patient_link(p_patient_id)
  order by pl.created_at
  limit 1;
$$;

grant execute on function public.familiar_de_contacto(uuid) to authenticated;
