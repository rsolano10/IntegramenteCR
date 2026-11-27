-- Roles nuevos: «equipo» (equipo clínico, trabaja por tareas que le asigna
-- la clínica/coordinación) y «referidor» (profesional externo que refiere
-- personas al programa). Va en su propio archivo: un valor nuevo de enum no
-- se puede usar en la misma transacción en que se agrega.
alter type public.app_role add value if not exists 'equipo';
alter type public.app_role add value if not exists 'referidor';
