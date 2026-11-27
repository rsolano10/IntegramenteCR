-- Seguridad: el registro público solo crea cuentas de familia o de
-- participante. Antes, el rol salía de los metadatos que manda el cliente
-- (supabase.auth.signUp, con la clave pública), así que cualquiera podía
-- registrarse como «profesional» y ver todo. Los roles del equipo
-- (profesional, equipo, referidor) los asigna solo el servidor
-- (admin-accounts, con la clave de servicio), después de crear la cuenta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, nombre, especialidad, whatsapp_phone)
  values (
    new.id,
    case when v_rol in ('familiar', 'paciente') then v_rol::public.app_role else 'familiar'::public.app_role end,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    null,
    new.raw_user_meta_data ->> 'whatsapp_phone'
  );
  return new;
end;
$$;
