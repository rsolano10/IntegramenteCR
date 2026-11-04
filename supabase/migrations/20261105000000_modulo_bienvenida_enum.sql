-- Fase 3.3: módulo propio para los recursos de bienvenida (video de
-- bienvenida, presentación del equipo, tutorial de la app). Va en una
-- migración aparte: un valor nuevo de enum no se puede usar en la misma
-- transacción en que se agrega.
alter type public.resource_modulo add value if not exists 'bienvenida';
