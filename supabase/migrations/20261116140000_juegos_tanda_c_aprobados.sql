-- La clínica aprobó la tanda C de la Fase 2 (COG-055 y COG-056) y el banco de días.
update public.media_resources set estado_clinico = 'aprobado'
where codigo in ('COG-055', 'COG-056') and estado_clinico = 'en_revision';
