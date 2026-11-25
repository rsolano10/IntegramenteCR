-- WhatsApp: un solo control. Dar el permiso «whatsapp» también prende el
-- interruptor de recordatorios (antes solo lo apagaba al retirarlo).
create or replace function public.registrar_consentimientos(p_version text, p_items jsonb, p_user_agent text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol text;
  v_patient uuid;
  v_item jsonb;
  v_tipo text;
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  select role::text into v_rol from public.profiles where id = v_uid;
  if v_rol is null then raise exception 'Perfil inexistente.'; end if;
  if coalesce(p_version, '') = '' then raise exception 'Falta la versión.'; end if;
  select pl.patient_id into v_patient from public.patient_links pl
    where pl.profile_id = v_uid and pl.relation in ('familiar_admin', 'participante')
    order by pl.created_at limit 1;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_tipo := v_item->>'tipo';
    if v_tipo = 'rol_familiar' and v_rol <> 'familiar' then continue; end if;
    if v_tipo = 'confidencialidad' and v_rol <> 'profesional' then continue; end if;
    if coalesce(v_item->>'texto', '') = '' then raise exception 'Falta el texto del consentimiento %.', v_tipo; end if;
    insert into public.consentimientos (profile_id, patient_id, tipo, otorgado, version, texto, rol, user_agent)
    values (v_uid, v_patient, v_tipo, coalesce((v_item->>'otorgado')::boolean, false), p_version, v_item->>'texto', v_rol, left(p_user_agent, 300));
    -- WhatsApp: el permiso y el interruptor de recordatorios son una sola
    -- cosa para la persona (dar o retirar el permiso prende o apaga los avisos).
    if v_tipo = 'whatsapp' then
      update public.profiles set whatsapp_notifications_enabled = coalesce((v_item->>'otorgado')::boolean, false) where id = v_uid;
    end if;
  end loop;
end;
$$;
revoke execute on function public.registrar_consentimientos(text, jsonb, text) from public, anon;
grant execute on function public.registrar_consentimientos(text, jsonb, text) to authenticated;
