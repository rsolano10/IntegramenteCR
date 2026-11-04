-- Historial de estados de una cuenta con el nombre de quien hizo cada
-- cambio. profiles solo deja leer el propio perfil, así que el panel de
-- seguimiento no podía resolver el nombre del responsable con un embed.
create or replace function public.historial_cuenta(p_profile_id uuid)
returns table (id bigint, de public.estado_cuenta, a public.estado_cuenta, motivo text, created_at timestamptz, responsable text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  return query
  select h.id, h.de, h.a, h.motivo, h.created_at, r.nombre
  from public.cuenta_estado_historial h left join public.profiles r on r.id = h.responsable_id
  where h.profile_id = p_profile_id
  order by h.created_at desc, h.id desc;
end;
$$;
grant execute on function public.historial_cuenta(uuid) to authenticated;
