-- «Un día en el pueblo»: las actividades interactivas pasan a ser lugares de
-- un pueblo costarricense (ver src/components/actividades/pueblo). Se
-- actualizan los nombres y las descripciones que ve la familia en la
-- Biblioteca. La configuración (extras) no cambia: los valores por defecto
-- nuevos (feria, ruedas, baldosas, frutas de acá) salen del código.

update public.media_resources set
  titulo = 'La feria',
  detalle = 'Un juego en pantalla: acomodar los productos del tramo de la feria en sus canastos.',
  actividad = 'Es temprano en la feria del agricultor. Tocá un producto (un mango, un manojo de culantro, una yuca) y después el canasto donde va: frutas, verduras, raíces u olores. Con cada ronda sale un poco más el sol.',
  updated_at = now()
where codigo = 'COG-037';

update public.media_resources set
  titulo = 'La estación',
  detalle = 'Un juego en pantalla: enganchar los vagones del tren en orden.',
  actividad = 'En el andén espera la locomotora. Los vagones tienen números: tocalos de menor a mayor y se van enganchando al tren. Al final, el tren sale despacio de la estación.',
  pasos = '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar» y tocá los vagones en orden. Si uno va más adelante, no pasa nada: se queda en la vía de espera."]'::jsonb,
  updated_at = now()
where codigo = 'COG-038';

update public.media_resources set
  titulo = 'El café de la tarde',
  detalle = 'Un juego en pantalla: poner en orden los pasos de una tarea de la casa, como chorrear café.',
  updated_at = now()
where codigo = 'COG-039';

update public.media_resources set
  titulo = 'El taller de carretas',
  detalle = 'Un juego en pantalla: encontrar las ruedas pintadas iguales a la que cuelga en la pared.',
  actividad = 'En el taller de carretas, una rueda pintada cuelga de un clavo. Sobre el piso hay otras ruedas recién pintadas: tocá todas las que son iguales a la del clavo y después «Listo». Al final, la carreta queda armada.',
  ayuda = 'Si cuesta, comparen de a una rueda por vez con la del clavo: primero los colores, después la forma de los pétalos.',
  updated_at = now()
where codigo = 'COG-040';

update public.media_resources set
  titulo = 'El canasto',
  detalle = 'Un juego en pantalla: contar las frutas que se salieron del canasto.',
  actividad = 'Se volcó el canasto sobre el mantel: hay mangos, jocotes, pejibayes, cases y mamones chinos. Contá cuántas hay de cada una con los botones − y + y después tocá «Listo».',
  ayuda = 'Si cuesta, cuenten de a una fruta por vez y señalen con el dedo cada una que cuentan.',
  updated_at = now()
where codigo = 'COG-041';

update public.media_resources set
  titulo = 'El piso de mosaico',
  detalle = 'Un juego en pantalla: dar vuelta las baldosas de a dos para encontrar las que tienen el mismo dibujo.',
  actividad = 'El piso del corredor es de baldosas de mosaico, boca abajo. Tocá dos para darles vuelta. Si tienen el mismo dibujo, quedan a la vista. Si no, tocá «Continuar» y se vuelven a tapar. Al final se ve el piso completo.',
  updated_at = now()
where codigo = 'COG-042';

update public.media_resources set
  titulo = 'Las ventanas del pueblo',
  detalle = 'Un juego en pantalla: mirar qué ventanas de una casa tienen luz y después señalarlas.',
  updated_at = now()
where codigo = 'COG-043';

update public.media_resources set
  titulo = 'El rotulista',
  detalle = 'Un juego en pantalla: pintar un rótulo ordenando letras de madera.',
  actividad = 'En el taller del rotulista hay una tabla en blanco y letras de madera desordenadas. Tocá las letras en orden para pintar la palabra. Tocá una letra pintada para devolverla.',
  updated_at = now()
where codigo = 'COG-044';

update public.media_resources set
  titulo = 'La pulpería',
  detalle = 'Un juego en pantalla: pagar la cuenta justa en la pulpería con monedas y billetes.',
  updated_at = now()
where codigo = 'COG-045';

update public.media_resources set
  titulo = 'El almanaque',
  detalle = 'Un juego en pantalla: conversar sobre qué día, mes y parte del día es hoy, en el corredor de la casa.',
  updated_at = now()
where codigo = 'COG-046';
