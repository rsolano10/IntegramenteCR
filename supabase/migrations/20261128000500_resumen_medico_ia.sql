-- Resumen para el médico: «En pocas palabras» al principio. Lo genera la
-- función resumen-medico-ia (Gemini, con el permiso «ia_equipo» de la
-- familia; si no, uno automático) y se guarda hasta que cambien los datos
-- (huella). resumen_datos lo incluye, así también lo ve el médico por enlace.
create table if not exists public.resumen_medico_ia (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  huella text not null,
  contenido jsonb not null,
  fuente text not null check (fuente in ('llm', 'automatico')),
  generado_en timestamptz not null default now()
);
alter table public.resumen_medico_ia enable row level security;
revoke all on public.resumen_medico_ia from anon, authenticated;

create or replace function public.resumen_datos(p_patient uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  with pt as (select * from public.patients where id = p_patient),
  planes as (
    select p.* from public.plans p
    where p.patient_id = p_patient and p.status = 'published' and p.publish_at <= now()
    order by p.publish_at desc limit 8
  ),
  tareas as (
    select t.*, pl.publish_at, mr.modulo::text as modulo
    from public.plan_tasks t join planes pl on pl.id = t.plan_id
    left join public.media_resources mr on mr.id = t.media_resource_id
    where not coalesce(t.es_onboarding, false)
  )
  select jsonb_build_object(
    'generado_en', now(),
    'persona', (select jsonb_build_object(
      'nombre', pt.nombre, 'edad', pt.edad, 'programa', pt.modalidad::text,
      'desde', coalesce(pt.aprobada_en, pt.created_at)) from pt),
    'totales', (select jsonb_build_object(
      'semanas', (select count(*) from planes),
      'actividades', count(*),
      'hechas', count(*) filter (where estado = 'realizado'),
      'en_parte', count(*) filter (where estado = 'parcial'),
      'no', count(*) filter (where estado = 'no'),
      'sin_registrar', count(*) filter (where estado in ('pendiente', 'futuro'))) from tareas),
    'semanas', coalesce((select jsonb_agg(jsonb_build_object(
      'inicio', pl.publish_at,
      'total', (select count(*) from tareas t where t.plan_id = pl.id),
      'hechas', (select count(*) from tareas t where t.plan_id = pl.id and t.estado = 'realizado'),
      'en_parte', (select count(*) from tareas t where t.plan_id = pl.id and t.estado = 'parcial'),
      'animo', pl.week_mood,
      'lo_que_mas_gusto', pl.review_favorita,
      'preocupacion', pl.review_preocupacion,
      'mensaje_equipo', pl.feedback_mensaje) order by pl.publish_at desc) from planes pl), '[]'::jsonb),
    'por_area', coalesce((select jsonb_agg(x order by x.total desc) from (
      select coalesce(modulo, 'otra') as modulo, count(*)::int as total,
        count(*) filter (where estado in ('realizado', 'parcial'))::int as hechas
      from tareas group by 1) x), '[]'::jsonb),
    'ultimas', coalesce((select jsonb_agg(x order by x.fecha desc) from (
      select t.registrado_en as fecha, t.titulo, t.modulo, t.estado::text as estado, t.comentario, t.dificultad_percibida
      from tareas t where t.registrado_en is not null order by t.registrado_en desc limit 12) x), '[]'::jsonb),
    'avisos', (select jsonb_build_object(
      'alertas_90_dias', (select count(*) from public.alertas_riesgo a where a.patient_id = p_patient and a.created_at > now() - interval '90 days'),
      'ultima_alerta', (select max(a.created_at) from public.alertas_riesgo a where a.patient_id = p_patient),
      'pedidos_ayuda_90_dias', (select count(*) from public.pedidos_ayuda h where h.patient_id = p_patient and h.created_at > now() - interval '90 days'))),
    -- «En pocas palabras» (IA o automático), el último generado.
    'ia', (select r.contenido || jsonb_build_object('fuente', r.fuente, 'generado_en', r.generado_en) from public.resumen_medico_ia r where r.patient_id = p_patient)
  );
$$;
