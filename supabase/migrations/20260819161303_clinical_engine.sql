-- Faithful port of src/lib/clinicalEngine.ts (computeProfiles/overallTier)
-- to plpgsql, run server-side by a trigger on onboarding_answers so the
-- severity tiers are never computable client-side.

create or replace function public.tier_of(v text, mapping jsonb)
returns public.tier
language sql
immutable
as $$
  select case when v is null then null else (mapping ->> v)::public.tier end;
$$;

create or replace function public.worst_of(tiers public.tier[])
returns public.tier
language sql
immutable
as $$
  select case
    when 'rojo' = any (array_remove(tiers, null)) then 'rojo'::public.tier
    when 'amarillo' = any (array_remove(tiers, null)) then 'amarillo'::public.tier
    when array_remove(tiers, null) = '{}' then null
    else 'verde'::public.tier
  end;
$$;

create or replace function public.compute_clinical_tiers(a jsonb)
returns table (
  cognitivo public.tier,
  movimiento public.tier,
  funcional public.tier,
  nutricional public.tier,
  conductual public.tier,
  overall public.tier
)
language plpgsql
immutable
as $$
declare
  v_cognitivo public.tier;
  v_movimiento public.tier;
  v_funcional public.tier;
  v_nutricional public.tier;
  v_conductual public.tier;
  v_overall public.tier;
  v_instrucciones public.tier;
  v_reds int := 0;
  v_ambers int := 0;
  v_conductual_applicable boolean;
  v_peso_tier public.tier;
  fname text;
  v_c1 public.tier;
  v_c2 public.tier;
  v_c3 public.tier;
  v_c4 public.tier;
begin
  -- cognitivo: auto-red on the single "una instrucción" tell, else worst of
  -- the four frequency questions plus the instructions-followed tier.
  if a ->> 'memoria_instrucciones' = 'una' then
    v_cognitivo := 'rojo';
  else
    v_instrucciones := case a ->> 'memoria_instrucciones'
      when 'varias' then 'verde'::public.tier
      when 'dos' then 'amarillo'::public.tier
      else null
    end;
    v_cognitivo := public.worst_of(array[
      public.tier_of(a ->> 'memoria_repite', '{"nunca":"verde","algunas":"amarillo","frecuente":"rojo"}'::jsonb),
      public.tier_of(a ->> 'memoria_olvida', '{"nunca":"verde","algunas":"amarillo","frecuente":"rojo"}'::jsonb),
      public.tier_of(a ->> 'memoria_desorientacion', '{"nunca":"verde","algunas":"amarillo","frecuente":"rojo"}'::jsonb),
      public.tier_of(a ->> 'memoria_lenguaje', '{"nunca":"verde","algunas":"amarillo","frecuente":"rojo"}'::jsonb),
      v_instrucciones
    ]);
  end if;

  -- movimiento: auto-red on two-or-more falls, else worst of five factors.
  if a ->> 'movimiento_caidas' = 'dos_mas' then
    v_movimiento := 'rojo';
  else
    v_movimiento := public.worst_of(array[
      public.tier_of(a ->> 'movimiento_desplazamiento', '{"sin_ayuda":"verde","baston":"amarillo","andadera":"amarillo","apoyo_persona":"rojo","silla_ruedas":"rojo","sentado_cama":"rojo"}'::jsonb),
      public.tier_of(a ->> 'movimiento_seguridad', '{"completamente_seguro":"verde","a_veces_inseguro":"amarillo","necesita_apoyo":"rojo","no_puede_caminar":"rojo"}'::jsonb),
      public.tier_of(a ->> 'movimiento_caidas', '{"ninguna":"verde","una":"amarillo","dos_mas":"rojo"}'::jsonb),
      public.tier_of(a ->> 'movimiento_levantarse', '{"sin_dificultad":"verde","con_impulso":"amarillo","necesita_ayuda":"rojo","no_puede":"rojo"}'::jsonb),
      public.tier_of(a ->> 'movimiento_depie', '{"sin_apoyo":"verde","poco_tiempo":"amarillo","necesita_apoyo":"rojo","no_puede":"rojo"}'::jsonb)
    ]);
  end if;

  -- funcional: count reds ("no_puede") and ambers ("con_ayuda") across six ADLs.
  foreach fname in array array['funcional_medicamentos', 'funcional_desayuno', 'funcional_ropa', 'funcional_banarse', 'funcional_compra', 'funcional_telefono']
  loop
    if a ->> fname = 'no_puede' then
      v_reds := v_reds + 1;
    elsif a ->> fname = 'con_ayuda' then
      v_ambers := v_ambers + 1;
    end if;
  end loop;
  if v_reds >= 2 then
    v_funcional := 'rojo';
  elsif v_reds >= 1 or v_ambers >= 1 then
    v_funcional := 'amarillo';
  else
    v_funcional := 'verde';
  end if;

  -- nutricional: auto-red on frequent swallowing difficulty, or weight loss
  -- combined with eating less; else worst of five factors.
  if a ->> 'nutricion_masticar_tragar' = 'frecuentemente' then
    v_nutricional := 'rojo';
  elsif (a ->> 'nutricion_perdida_peso' = 'si' and a ->> 'nutricion_come_menos' = 'si') then
    v_nutricional := 'rojo';
  else
    v_peso_tier := case
      when a ->> 'nutricion_perdida_peso' = 'si' or a ->> 'nutricion_come_menos' = 'si' then 'amarillo'::public.tier
      else 'verde'::public.tier
    end;
    v_nutricional := public.worst_of(array[
      v_peso_tier,
      public.tier_of(a ->> 'nutricion_masticar_tragar', '{"no":"verde","a_veces":"amarillo","frecuentemente":"rojo"}'::jsonb),
      public.tier_of(a ->> 'nutricion_ultraprocesados', '{"casi_nunca":"verde","1_2_semana":"amarillo","3_mas_semana":"rojo","todos_dias":"rojo"}'::jsonb),
      public.tier_of(a ->> 'nutricion_frutas_veg', '{"todos_dias":"verde","3_mas_semana":"verde","1_2_semana":"amarillo","casi_nunca":"rojo"}'::jsonb),
      public.tier_of(a ->> 'nutricion_agua', '{"menos_3":"rojo","3_5":"amarillo","6_8":"verde","mas_8":"verde"}'::jsonb)
    ]);
  end if;

  -- conductual: null unless at least one behavioral question was asked;
  -- any red among them forces red, else worst of the four.
  v_conductual_applicable := (a ? 'conductual_irritabilidad') or (a ? 'conductual_ideas_falsas') or (a ? 'conductual_deambulacion') or (a ? 'conductual_ansiedad');
  if not v_conductual_applicable then
    v_conductual := null;
  else
    v_c1 := public.tier_of(a ->> 'conductual_irritabilidad', '{"no":"verde","ocasional":"amarillo","frecuente":"rojo","leve":"amarillo","severa":"rojo"}'::jsonb);
    v_c2 := public.tier_of(a ->> 'conductual_ideas_falsas', '{"no":"verde","ocasional":"amarillo","frecuente":"rojo","leve":"amarillo","severa":"rojo"}'::jsonb);
    v_c3 := public.tier_of(a ->> 'conductual_deambulacion', '{"no":"verde","ocasional":"amarillo","frecuente":"rojo","leve":"amarillo","severa":"rojo"}'::jsonb);
    v_c4 := public.tier_of(a ->> 'conductual_ansiedad', '{"no":"verde","ocasional":"amarillo","frecuente":"rojo","leve":"amarillo","severa":"rojo"}'::jsonb);
    if 'rojo' = any (array_remove(array[v_c1, v_c2, v_c3, v_c4], null)) then
      v_conductual := 'rojo';
    else
      v_conductual := public.worst_of(array[v_c1, v_c2, v_c3, v_c4]);
    end if;
  end if;

  v_overall := coalesce(public.worst_of(array[v_cognitivo, v_movimiento, v_funcional, v_nutricional, v_conductual]), 'verde'::public.tier);

  return query select v_cognitivo, v_movimiento, v_funcional, v_nutricional, v_conductual, v_overall;
end;
$$;

create or replace function public.recompute_clinical_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.compute_clinical_tiers(new.answers);
  insert into public.clinical_profiles (patient_id, cognitivo, movimiento, funcional, nutricional, conductual, overall, computed_at)
  values (new.patient_id, r.cognitivo, r.movimiento, r.funcional, r.nutricional, r.conductual, r.overall, now())
  on conflict (patient_id) do update set
    cognitivo = excluded.cognitivo,
    movimiento = excluded.movimiento,
    funcional = excluded.funcional,
    nutricional = excluded.nutricional,
    conductual = excluded.conductual,
    overall = excluded.overall,
    computed_at = now();
  return new;
end;
$$;

create trigger on_onboarding_answers_change
  after insert or update on public.onboarding_answers
  for each row execute function public.recompute_clinical_profile();
