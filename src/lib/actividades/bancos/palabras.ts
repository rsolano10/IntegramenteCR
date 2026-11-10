// Banco de palabras de Costa Rica para «Armá la palabra» y «En orden».
// `pista`: categoría o definición corta que se puede mostrar como ayuda.
// `revisado: false` hasta que el equipo clínico lo apruebe.

export interface PalabraBanco {
  palabra: string;
  categoria: "casa" | "comida" | "lugar" | "naturaleza" | "persona";
  pista: string;
  revisado: boolean;
}

const p = (categoria: PalabraBanco["categoria"], lista: [string, string][]): PalabraBanco[] =>
  lista.map(([palabra, pista]) => ({ palabra, categoria, pista, revisado: false }));

export const PALABRAS: PalabraBanco[] = [
  ...p("casa", [
    ["sol", "Sale todas las mañanas."],
    ["mesa", "Ahí se sirve la comida."],
    ["cama", "Ahí dormimos."],
    ["taza", "Para tomar el café."],
    ["olla", "Para cocinar los frijoles."],
    ["silla", "Para sentarse."],
    ["puerta", "Por ahí se entra a la casa."],
    ["ventana", "Deja entrar la luz."],
    ["cuchara", "Para tomar la sopa."],
    ["almohada", "Va en la cama, bajo la cabeza."],
    ["cocina", "Donde se prepara la comida."],
    ["cortina", "Tapa la ventana."],
    ["paraguas", "Para la lluvia."],
    ["chorreador", "Para chorrear el café."],
    ["plato", "Ahí se sirve la comida."],
    ["llave", "Abre la puerta."],
    ["radio", "Para oír música y noticias."],
  ]),
  ...p("comida", [
    ["pan", "Se compra en la panadería."],
    ["café", "Se toma en la mañana."],
    ["arroz", "Va con los frijoles."],
    ["queso", "Se hace con leche."],
    ["mango", "Fruta amarilla y dulce."],
    ["piña", "Fruta con corona."],
    ["tortilla", "Se hace con maíz."],
    ["tamal", "Se come en diciembre."],
    ["natilla", "Va con el gallo pinto."],
    ["frijoles", "Negros o rojos."],
    ["papaya", "Fruta anaranjada."],
    ["chayote", "Verdura verde para picadillo."],
    ["empanada", "Rellena de papa o frijoles."],
    ["aguacate", "Verde por fuera, cremoso por dentro."],
    ["casado", "Arroz, frijoles, ensalada y algo más."],
    ["miel", "La hacen las abejas."],
    ["sopa", "Se come con cuchara."],
    ["coco", "Tiene agua adentro."],
  ]),
  ...p("lugar", [
    ["playa", "Arena y mar."],
    ["parque", "Tiene bancas y árboles."],
    ["iglesia", "Para ir a misa."],
    ["mercado", "Ahí se compran verduras."],
    ["Cartago", "Ciudad de la Basílica de los Ángeles."],
    ["Heredia", "La Ciudad de las Flores."],
    ["Limón", "Provincia del Caribe."],
    ["Puntarenas", "Provincia del Pacífico."],
    ["Alajuela", "Ciudad de Juan Santamaría."],
    ["volcán", "Montaña que echa humo."],
    ["río", "Agua que corre."],
    ["pulpería", "La tienda del barrio."],
    ["escuela", "Ahí aprenden los niños."],
    ["hospital", "Ahí se cuida a los enfermos."],
    ["Caribe", "El mar del lado de Limón."],
  ]),
  ...p("naturaleza", [
    ["flor", "Crece en el jardín."],
    ["árbol", "Tiene tronco y hojas."],
    ["lluvia", "Cae del cielo en invierno."],
    ["luna", "Sale de noche."],
    ["perro", "El mejor amigo."],
    ["gato", "Dice miau."],
    ["vaca", "Da leche."],
    ["tucán", "Pájaro de pico grande."],
    ["perezoso", "Animal que se mueve despacio."],
    ["mariposa", "Tiene alas de colores."],
    ["colibrí", "Pájaro pequeño que vuela muy rápido."],
    ["montaña", "Más alta que un cerro."],
    ["guaria", "La flor nacional."],
    ["mar", "Agua salada."],
    ["cielo", "Arriba, con nubes."],
    ["caballo", "Animal para montar."],
  ]),
  ...p("persona", [
    ["mamá", "La que nos crió."],
    ["papá", "El que nos crió."],
    ["abuela", "La mamá de mamá o de papá."],
    ["nieto", "El hijo de un hijo."],
    ["vecino", "Vive al lado."],
    ["amigo", "Alguien de confianza."],
    ["maestra", "Enseña en la escuela."],
    ["doctor", "Cuida la salud."],
    ["hermano", "Hijo de los mismos papás."],
    ["comadre", "La madrina de un hijo."],
  ]),
];

// Letras de una palabra (tildes y ñ cuentan como una sola letra).
export const letrasDe = (palabra: string) => Array.from(palabra.normalize("NFC"));
export const largo = (palabra: string) => letrasDe(palabra).length;
