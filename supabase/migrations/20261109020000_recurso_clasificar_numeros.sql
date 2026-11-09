-- El juego «Clasificar números por valor» como un recurso más de la
-- Biblioteca (COG-036): se ve y se asigna igual que cualquier otro. Su
-- configuración vive en extras (modo "clasificar"; ver
-- src/lib/clasificarNumeros.ts). Idempotente por código.
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, sabias_que, actividad, por_que, pasos, ayuda, para_cerrar,
  niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-036',
  'Clasificar números por valor',
  'Un juego en pantalla: ubicar cada número en la caja que le corresponde, según sea menor o mayor que un número de referencia.',
  'cognicion',
  'actividad',
  'De 5 a 10 minutos.',
  5,
  10,
  'De 2 a 3 veces por semana.',
  'Personas que leen números con comodidad y pueden tocar la pantalla, solas o con compañía.',
  'Comparar números es algo que hacemos todo el tiempo sin darnos cuenta: al pagar, al mirar un precio o al leer la hora.',
  'En la pantalla aparecen 8 números y dos cajas. Tocá un número y después la caja donde va: «Menores que 40» o «Mayores que 40». Son varias rondas, cada una con números nuevos.',
  'Ejercita la atención y el razonamiento con números, que usamos todos los días.',
  '["Busquen un lugar cómodo, con buena luz, y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna o toquen «Escuchar la consigna».", "Tocá «Empezar» y clasificá los números de cada ronda. Si te equivocás, el número vuelve solo para intentarlo de nuevo."]'::jsonb,
  'Si cuesta, comparen cada número con el 40 en voz alta: «¿El 39 es más o menos que 40?». También pueden contar con los dedos o ayudarse con un calendario.',
  '¡Muy bien! Cada número que comparaste es un ejercicio para la atención.',
  array['preventivo', 'dcl', 'leve'],
  '{"modo": "clasificar", "titulo": "Clasificar números por valor", "consigna": "Clasificá los siguientes números.", "referencia": 40, "cajas": [{"etiqueta": "Menores que 40", "regla": "menor"}, {"etiqueta": "Mayores que 40", "regla": "mayor"}], "numeros": [24, 42, 48, 20, 39, 49, 13, 47], "rango": {"min": 10, "max": 50}, "cantidad": 8, "rondas": 5, "mezclar": true, "mostrarEjemplo": true}'::jsonb,
  'aprobado',
  true,
  36
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, sabias_que = excluded.sabias_que,
  actividad = excluded.actividad, por_que = excluded.por_que, pasos = excluded.pasos, ayuda = excluded.ayuda,
  para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos, extras = excluded.extras,
  estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();
