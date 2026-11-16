-- La clínica aprobó la tanda B de la Fase 2 (COG-051 a COG-054) y sus bancos.
update public.media_resources set estado_clinico = 'aprobado'
where codigo between 'COG-051' and 'COG-054' and estado_clinico = 'en_revision';
