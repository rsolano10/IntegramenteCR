-- Everything that hangs off a patient: their questionnaire answers, the
-- computed clinical profile, their plan, messages, and audit trail.

create table public.onboarding_answers (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.onboarding_answers is 'One JSONB blob per patient holding the ~48-question functional questionnaire (see src/lib/onboardingSchema.ts). A trigger recomputes clinical_profiles whenever this changes.';

create type public.tier as enum ('verde', 'amarillo', 'rojo');

create table public.clinical_profiles (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  cognitivo public.tier,
  movimiento public.tier,
  funcional public.tier,
  nutricional public.tier,
  conductual public.tier,
  overall public.tier,
  computed_at timestamptz not null default now()
);

comment on table public.clinical_profiles is 'Written only by the recompute_clinical_profile trigger (see clinical_engine migration). No insert/update/delete RLS policy exists for any role — this is the real hiding place for severity data, not a UI convention.';

create type public.plan_state as enum ('draft', 'published');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  status public.plan_state not null default 'published',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create type public.task_tipo as enum ('video', 'actividad', 'estrategia', 'neuroproteccion');
create type public.task_estado as enum ('realizado', 'parcial', 'no', 'pendiente', 'futuro');

create table public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  dia text not null,
  is_today boolean not null default false,
  hora text,
  titulo text not null,
  tipo public.task_tipo not null,
  estado public.task_estado not null default 'pendiente',
  duracion text,
  detalle text,
  precaucion text,
  pasos jsonb,
  por_que text,
  sort_order int not null default 0
);

create index plan_tasks_plan_id_idx on public.plan_tasks (plan_id);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  texto text not null,
  autor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index mensajes_patient_id_idx on public.mensajes (patient_id, created_at desc);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete cascade,
  entidad text not null,
  accion text not null,
  autor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index audit_log_patient_id_idx on public.audit_log (patient_id, created_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  role text not null check (role in ('user', 'bot')),
  text text not null,
  escalate_to text,
  created_at timestamptz not null default now()
);

create index chat_messages_patient_id_idx on public.chat_messages (patient_id, created_at);
