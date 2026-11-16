-- La clínica aprobó los juegos del pueblo (Fase 1 y Tanda A de la Fase 2) y
-- sus bancos de contenido (16 de noviembre de 2026).
update public.media_resources
set estado_clinico = 'aprobado'
where codigo between 'COG-037' and 'COG-050'
  and estado_clinico = 'en_revision';
