-- Tutorial interactivo la primera vez que cada cuenta llega a su dashboard
-- (familiar/paciente/profesional) — un solo flag por cuenta, ligado al
-- login (no al navegador), para que no se repita entre dispositivos.
-- Reutiliza la policy "profiles: self update" ya existente (self-update sin
-- restricción de columna, mismo patrón que foto_url) — no requiere una
-- policy nueva.
alter table public.profiles add column onboarding_tour_seen boolean not null default false;
