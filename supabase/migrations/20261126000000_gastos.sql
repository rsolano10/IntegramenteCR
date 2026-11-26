-- Gastos (Administración): cuánto cuesta operar la app.
--
-- 1. uso_servicios: consumo crudo de cada llamada a servicios de pago
--    (tokens de Gemini, créditos y segundos de ElevenLabs, y los WhatsApp
--    que no quedan en notifications_log). Lo escriben las funciones del
--    servidor (service_role).
-- 2. tarifas_servicio: precios que edita la administración. El costo se
--    calcula al leer, así un cambio de tarifa recalcula todo el historial.
-- 3. gastos: lo que se paga aparte (suscripciones mensuales o pagos únicos:
--    Supabase, Vercel, plan de ElevenLabs, dominio, etc.).
-- 4. resumen_gastos(p_mes, p_meses): detalle del mes y tendencia, con los
--    ingresos (pagos) para comparar.

create table if not exists public.uso_servicios (
  id uuid primary key default gen_random_uuid(),
  servicio text not null check (servicio in ('gemini', 'elevenlabs', 'whatsapp')),
  funcion text not null,
  entrada bigint not null default 0,
  salida bigint not null default 0,
  creditos bigint not null default 0,
  segundos integer not null default 0,
  referencia text,
  patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists uso_servicios_fecha on public.uso_servicios (created_at desc);
create unique index if not exists uso_servicios_referencia on public.uso_servicios (servicio, referencia) where referencia is not null;
alter table public.uso_servicios enable row level security;
drop policy if exists uso_servicios_select on public.uso_servicios;
create policy uso_servicios_select on public.uso_servicios for select to authenticated using (public.es_admin());
revoke insert, update, delete on public.uso_servicios from anon, authenticated;

create table if not exists public.tarifas_servicio (
  clave text primary key,
  valor numeric not null check (valor >= 0),
  etiqueta text not null,
  unidad text not null,
  nota text,
  orden integer not null default 0,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid
);
alter table public.tarifas_servicio enable row level security;
drop policy if exists tarifas_select on public.tarifas_servicio;
create policy tarifas_select on public.tarifas_servicio for select to authenticated using (public.es_admin());
revoke insert, update, delete on public.tarifas_servicio from anon, authenticated;

insert into public.tarifas_servicio (clave, valor, etiqueta, unidad, nota, orden) values
  ('tipo_cambio', 505, 'Tipo de cambio', '₡ por US$', 'Para pasar a colones lo que se paga en dólares.', 0),
  ('gemini_entrada', 0.75, 'Gemini: entrada', 'US$ por millón de tokens', 'Gemini 3.6 Flash, nivel pagado. Sube a US$1,50 el 1 de enero de 2027.', 1),
  ('gemini_salida', 3.75, 'Gemini: salida', 'US$ por millón de tokens', 'Incluye el razonamiento interno. Sube a US$7,50 el 1 de enero de 2027.', 2),
  ('whatsapp_mensaje', 0.0113, 'WhatsApp: mensaje de utilidad', 'US$ por mensaje', 'Tarifa estimada para Costa Rica (región «Resto de Latinoamérica»). Confirmala en la facturación de WhatsApp Manager.', 3),
  ('elevenlabs_1000', 0, 'ElevenLabs: excedente', 'US$ por 1000 créditos', 'En 0 si el plan mensual cubre todo (registralo en Gastos). Poné el precio solo si pagás créditos extra.', 4)
on conflict (clave) do nothing;

create or replace function public.actualizar_tarifa(p_clave text, p_valor numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Solo la administración.' using errcode = '42501'; end if;
  if p_valor is null or p_valor < 0 then raise exception 'Valor inválido.'; end if;
  update public.tarifas_servicio set valor = p_valor, actualizado_en = now(), actualizado_por = auth.uid() where clave = p_clave;
  if not found then raise exception 'Tarifa inexistente.'; end if;
end;
$$;
revoke execute on function public.actualizar_tarifa(text, numeric) from public, anon;
grant execute on function public.actualizar_tarifa(text, numeric) to authenticated;

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  proveedor text not null,
  concepto text,
  categoria text not null default 'otro' check (categoria in ('ia', 'whatsapp', 'infraestructura', 'correo', 'dominio', 'otro')),
  monto numeric(12, 2) not null check (monto >= 0),
  moneda text not null default 'USD' check (moneda in ('USD', 'CRC')),
  recurrente boolean not null default false,
  hasta date,
  nota text,
  registrado_por uuid,
  created_at timestamptz not null default now()
);
create index if not exists gastos_fecha on public.gastos (fecha desc);
alter table public.gastos enable row level security;
drop policy if exists gastos_admin on public.gastos;
create policy gastos_admin on public.gastos for all to authenticated using (public.es_admin()) with check (public.es_admin());
grant select, insert, update, delete on public.gastos to authenticated;

-- Resumen: detalle de p_mes y tendencia de los p_meses que terminan en él.
-- Montos en US$ (y el tipo de cambio para mostrarlos en colones).
create or replace function public.resumen_gastos(p_mes date default null, p_meses integer default 6)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mes date := date_trunc('month', coalesce(p_mes, (now() at time zone 'America/Costa_Rica')::date))::date;
  v_desde date;
  t_cambio numeric;
  t_gin numeric;
  t_gout numeric;
  t_wa numeric;
  t_el numeric;
  v jsonb;
begin
  if not public.es_admin() then raise exception 'Solo la administración.' using errcode = '42501'; end if;
  v_desde := (v_mes - make_interval(months => greatest(1, least(coalesce(p_meses, 6), 24)) - 1))::date;
  select
    max(valor) filter (where clave = 'tipo_cambio'),
    max(valor) filter (where clave = 'gemini_entrada'),
    max(valor) filter (where clave = 'gemini_salida'),
    max(valor) filter (where clave = 'whatsapp_mensaje'),
    max(valor) filter (where clave = 'elevenlabs_1000')
  into t_cambio, t_gin, t_gout, t_wa, t_el
  from public.tarifas_servicio;
  t_cambio := coalesce(nullif(t_cambio, 0), 505);

  with
  -- Consumo variable, una fila por llamada o envío, con su costo.
  variable as (
    select date_trunc('month', u.created_at at time zone 'America/Costa_Rica')::date mes, u.servicio, u.funcion,
      1 as veces, u.entrada, u.salida, u.creditos, u.segundos,
      case u.servicio
        when 'gemini' then u.entrada / 1e6 * coalesce(t_gin, 0) + u.salida / 1e6 * coalesce(t_gout, 0)
        when 'elevenlabs' then u.creditos / 1000.0 * coalesce(t_el, 0)
        else coalesce(t_wa, 0)
      end usd
    from public.uso_servicios u
    where u.created_at >= (v_desde::timestamp at time zone 'America/Costa_Rica')
    union all
    select date_trunc('month', coalesce(n.sent_at, n.created_at) at time zone 'America/Costa_Rica')::date, 'whatsapp', n.tipo,
      1, 0, 0, 0, 0, coalesce(t_wa, 0)
    from public.notifications_log n
    where n.status = 'sent' and coalesce(n.sent_at, n.created_at) >= (v_desde::timestamp at time zone 'America/Costa_Rica')
  ),
  meses as (
    select generate_series(v_desde, v_mes, interval '1 month')::date mes
  ),
  -- Gastos registrados que aplican a cada mes (recurrentes: cada mes desde
  -- su fecha hasta «hasta»; únicos: el mes de su fecha).
  fijos as (
    select m.mes, g.*, case when g.moneda = 'CRC' then g.monto / t_cambio else g.monto end usd
    from meses m join public.gastos g
      on (g.recurrente and date_trunc('month', g.fecha) <= m.mes and (g.hasta is null or g.hasta >= m.mes))
      or (not g.recurrente and date_trunc('month', g.fecha) = m.mes)
  ),
  ingresos as (
    select date_trunc('month', p.fecha_pago)::date mes, sum(p.monto) crc
    from public.pagos p where p.fecha_pago >= v_desde group by 1
  )
  select jsonb_build_object(
    'mes', v_mes,
    'tipo_cambio', t_cambio,
    'tendencia', (
      select jsonb_agg(jsonb_build_object(
        'mes', m.mes,
        'gemini', coalesce((select sum(usd) from variable v where v.mes = m.mes and v.servicio = 'gemini'), 0),
        'elevenlabs', coalesce((select sum(usd) from variable v where v.mes = m.mes and v.servicio = 'elevenlabs'), 0),
        'whatsapp', coalesce((select sum(usd) from variable v where v.mes = m.mes and v.servicio = 'whatsapp'), 0),
        'registrados', coalesce((select sum(usd) from fijos f where f.mes = m.mes), 0),
        'ingresos_crc', coalesce((select crc from ingresos i where i.mes = m.mes), 0)
      ) order by m.mes)
      from meses m
    ),
    'detalle', coalesce((
      select jsonb_agg(x order by x.servicio, x.usd desc)
      from (
        select servicio, funcion, sum(veces)::int veces, sum(entrada)::bigint entrada, sum(salida)::bigint salida,
          sum(creditos)::bigint creditos, sum(segundos)::int segundos, round(sum(usd)::numeric, 4) usd
        from variable where mes = v_mes group by servicio, funcion
      ) x
    ), '[]'::jsonb),
    'gastos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'fecha', f.fecha, 'proveedor', f.proveedor, 'concepto', f.concepto, 'categoria', f.categoria,
        'monto', f.monto, 'moneda', f.moneda, 'recurrente', f.recurrente, 'hasta', f.hasta, 'nota', f.nota, 'usd', round(f.usd, 2)
      ) order by f.recurrente desc, f.usd desc)
      from fijos f where f.mes = v_mes
    ), '[]'::jsonb),
    'familias_activas', (select count(*) from public.patients pt where pt.pagado_hasta >= v_mes)
  ) into v;
  return v;
end;
$$;
revoke execute on function public.resumen_gastos(date, integer) from public, anon;
grant execute on function public.resumen_gastos(date, integer) to authenticated;
