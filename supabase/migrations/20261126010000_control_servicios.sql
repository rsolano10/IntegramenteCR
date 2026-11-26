-- Control de servicios (Administración): encender o apagar lo que tiene
-- costo, desde un solo lugar. Una sola fila (id = 1). Las funciones del
-- servidor la leen en cada llamada; apagar algo corta el gasto de inmediato.
--
--   WhatsApp      todo, o por momento (mañana, tarde, noche anterior,
--                 aviso de semana nueva) y tope de mensajes por día
--   Correos       avisos a las familias (semana publicada, solicitud
--                 revisada). Los de acceso (confirmar cuenta, cambiar
--                 contraseña) y los avisos de riesgo al equipo no se apagan.
--   IA clínica    personalizar semana, panorama del caso, mensaje semanal
--   IA familias   resumen del registro de la familia
--   Voz           ElevenLabs o la voz del teléfono/computadora
--   Clara         la asistente (chat y voz)

create table if not exists public.control_servicios (
  id integer primary key default 1 check (id = 1),
  wa_activo boolean not null default true,
  wa_manana boolean not null default true,
  wa_tarde boolean not null default true,
  wa_noche boolean not null default true,
  wa_semana boolean not null default true,
  wa_tope_diario integer not null default 3 check (wa_tope_diario between 1 and 3),
  correos_activo boolean not null default true,
  ia_clinica boolean not null default true,
  ia_familia boolean not null default true,
  voz_proveedor text not null default 'elevenlabs' check (voz_proveedor in ('elevenlabs', 'dispositivo')),
  clara_activa boolean not null default true,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid
);
insert into public.control_servicios (id) values (1) on conflict (id) do nothing;
alter table public.control_servicios enable row level security;
drop policy if exists control_servicios_select on public.control_servicios;
create policy control_servicios_select on public.control_servicios for select to authenticated using (public.es_admin());
revoke insert, update, delete on public.control_servicios from anon, authenticated;

-- Lo que la app de las familias necesita saber (sin el resto de la fila).
create or replace function public.servicios_activos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('clara', c.clara_activa, 'voz', c.voz_proveedor, 'ia_clinica', c.ia_clinica)
  from public.control_servicios c where c.id = 1;
$$;
revoke execute on function public.servicios_activos() from public, anon;
grant execute on function public.servicios_activos() to authenticated;

-- Cambiar un ajuste (solo administración). p_valor: true/false, número o texto.
create or replace function public.actualizar_control_servicio(p_campo text, p_valor jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Solo la administración.' using errcode = '42501'; end if;
  if p_campo in ('wa_activo', 'wa_manana', 'wa_tarde', 'wa_noche', 'wa_semana', 'correos_activo', 'ia_clinica', 'ia_familia', 'clara_activa') then
    if jsonb_typeof(p_valor) <> 'boolean' then raise exception 'Valor inválido.'; end if;
    execute format('update public.control_servicios set %I = $1, actualizado_en = now(), actualizado_por = $2 where id = 1', p_campo) using (p_valor)::boolean, auth.uid();
  elsif p_campo = 'wa_tope_diario' then
    update public.control_servicios set wa_tope_diario = (p_valor)::int, actualizado_en = now(), actualizado_por = auth.uid() where id = 1;
  elsif p_campo = 'voz_proveedor' then
    update public.control_servicios set voz_proveedor = p_valor #>> '{}', actualizado_en = now(), actualizado_por = auth.uid() where id = 1;
  else
    raise exception 'Ajuste inexistente.';
  end if;
  insert into public.audit_log (entidad, accion, autor_id) values ('control_servicios', p_campo || '=' || (p_valor #>> '{}'), auth.uid());
end;
$$;
revoke execute on function public.actualizar_control_servicio(text, jsonb) from public, anon;
grant execute on function public.actualizar_control_servicio(text, jsonb) to authenticated;
