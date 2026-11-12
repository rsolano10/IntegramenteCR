-- Juegos del pueblo: «¿Cómo le resultó?» al cerrar el juego.
--
-- La familia (o la persona) dice cómo le resultó: fácil, justo o difícil.
-- Es lo que percibe, no un desempeño medido (no hay puntajes). La clínica lo
-- ve en Seguimiento y el planificador lo usa para sugerir subir o bajar el
-- nivel; nunca cambia solo.
alter table public.plan_tasks
  add column if not exists dificultad_percibida text
  check (dificultad_percibida in ('facil', 'justo', 'dificil'));

-- Igual que estado y comentario: la familia lo escribe al registrar.
grant update (dificultad_percibida) on public.plan_tasks to authenticated;

-- plantilla_tareas.nivel_interactivo null = «según el perfil» (el nivel se
-- elige por la etapa de cada paciente al usar la plantilla).
comment on column public.plantilla_tareas.nivel_interactivo is 'null = según el perfil del paciente';
