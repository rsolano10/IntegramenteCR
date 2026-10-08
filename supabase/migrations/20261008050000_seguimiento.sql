-- Pestaña "Seguimiento" de la clínica: historial de semanas, notas propias
-- de la clínica y un panorama del caso generado con IA.

-- Notas internas de la clínica (nunca visibles para la familia — a
-- diferencia del feedback_mensaje de cada semana, que sí les llega).
create table public.notas_clinicas (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  autor_id uuid references public.profiles (id) on delete set null,
  texto text not null check (length(btrim(texto)) > 0),
  created_at timestamptz not null default now()
);

create index notas_clinicas_patient_idx on public.notas_clinicas (patient_id, created_at desc);

alter table public.notas_clinicas enable row level security;

create policy "notas_clinicas: profesional read" on public.notas_clinicas
  for select using (public.is_profesional());

create policy "notas_clinicas: profesional insert" on public.notas_clinicas
  for insert with check (public.is_profesional() and autor_id = auth.uid());

create policy "notas_clinicas: autor delete" on public.notas_clinicas
  for delete using (public.is_profesional() and autor_id = auth.uid());

-- Último panorama generado por paciente (edge function seguimiento-ia,
-- service role). `huella` = hash de los datos de entrada: si nada cambió
-- desde la última vez, no se vuelve a llamar al modelo.
create table public.resumenes_seguimiento (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  contenido jsonb not null,
  huella text not null,
  semanas_incluidas int not null default 0,
  fuente text not null check (fuente in ('llm', 'fallback')),
  generado_at timestamptz not null default now()
);

alter table public.resumenes_seguimiento enable row level security;

create policy "resumenes_seguimiento: profesional read" on public.resumenes_seguimiento
  for select using (public.is_profesional());
