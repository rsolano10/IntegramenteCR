// La duración de una actividad, corta y pareja para las tarjetas: los
// datos vienen como «10-15 min», «De 3 a 8 minutos.» o «5–10 minutos,
// ajustables al interés y tolerancia.». Se toman los números y nada más;
// el texto completo sigue en la ficha. Sin números, no se muestra.
export function duracionCorta(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const numeros = texto.match(/\d+/g);
  if (!numeros) return null;
  const [a, b] = numeros.map(Number);
  if (b !== undefined && b !== a) return `${a} a ${b} min`;
  return `${a} min`;
}
