// Banco de «La radio y El correo»: avisos de la radio comunal y cartas de
// la familia, con sus preguntas escritas a mano. La primera opción de cada
// pregunta es la correcta (el juego las baraja). `frase`: el pedazo del
// texto donde está la respuesta (para la pista). Sin datos de salud.
// `revisado: false` hasta que el equipo lo apruebe.

export interface Pregunta {
  texto: string;
  opciones: [string, string, string];
  inferencia?: boolean;
  frase?: string;
}

export interface TextoComprension {
  id: string;
  escena: "radio" | "correo";
  longitud: "corta" | "media";
  // Quién firma la carta o de qué es el aviso.
  titulo: string;
  texto: string;
  preguntas: Pregunta[];
  revisado: boolean;
}

const t = (id: string, escena: TextoComprension["escena"], longitud: TextoComprension["longitud"], titulo: string, texto: string, preguntas: Pregunta[]): TextoComprension => ({
  id,
  escena,
  longitud,
  titulo,
  texto,
  preguntas,
  revisado: false,
});

export const TEXTOS: TextoComprension[] = [
  // ─── Radio comunal ───
  t("vacunacion", "radio", "corta", "Aviso del salón comunal", "Atención, vecinos de San Rafael: este jueves habrá vacunación contra la gripe en el salón comunal, de ocho de la mañana a mediodía. Lleven la cédula y el carné.", [
    { texto: "¿Qué día es la vacunación?", opciones: ["El jueves", "El martes", "El sábado"], frase: "este jueves" },
    { texto: "¿Dónde es?", opciones: ["En el salón comunal", "En la escuela", "En la iglesia"], frase: "en el salón comunal" },
    { texto: "¿Qué hay que llevar?", opciones: ["La cédula y el carné", "Una sombrilla", "Algo de comer"], frase: "Lleven la cédula y el carné" },
  ]),
  t("perro", "radio", "corta", "Se busca a Canelo", "Se perdió un perro café con una mancha blanca en la oreja. Responde al nombre de Canelo. Si lo ven, avisen a doña Marta, que vive frente a la plaza.", [
    { texto: "¿Cómo se llama el perro?", opciones: ["Canelo", "Toby", "Chispa"], frase: "Responde al nombre de Canelo" },
    { texto: "¿De qué color es?", opciones: ["Café, con una mancha blanca", "Negro", "Blanco con manchas negras"], frase: "un perro café con una mancha blanca en la oreja" },
    { texto: "¿A quién hay que avisar?", opciones: ["A doña Marta", "Al padre de la iglesia", "A la maestra"], frase: "avisen a doña Marta" },
    { texto: "¿Cómo creés que se siente doña Marta?", opciones: ["Preocupada", "Contenta", "Aburrida"], inferencia: true },
  ]),
  t("bus", "radio", "corta", "Cambio de horario del bus", "Aviso para quienes viajan a Cartago: desde el lunes, el bus de las siete sale a las siete y media, de la parada de la iglesia. Los demás horarios no cambian.", [
    { texto: "¿Qué bus cambia de hora?", opciones: ["El de las siete", "El de las nueve", "Todos"], frase: "el bus de las siete" },
    { texto: "¿A qué hora sale ahora?", opciones: ["A las siete y media", "A las ocho", "A las seis"], frase: "sale a las siete y media" },
    { texto: "¿Desde cuándo?", opciones: ["Desde el lunes", "Desde hoy", "Desde el viernes"], frase: "desde el lunes" },
    { texto: "Si alguien llega a la parada a las siete en punto, ¿qué pasa?", opciones: ["Tiene que esperar media hora", "Ya se le fue el bus", "No hay bus ese día"], inferencia: true },
  ]),
  t("agua", "radio", "corta", "Corte de agua", "Mañana martes van a cortar el agua en el barrio, de ocho de la mañana a tres de la tarde, por arreglos en la tubería. Recojan agua desde hoy.", [
    { texto: "¿Cuándo cortan el agua?", opciones: ["Mañana martes", "El jueves", "Hoy en la noche"], frase: "Mañana martes" },
    { texto: "¿Hasta qué hora?", opciones: ["Hasta las tres de la tarde", "Hasta mediodía", "Hasta la noche"], frase: "a tres de la tarde" },
    { texto: "¿Qué conviene hacer hoy?", opciones: ["Recoger agua", "Lavar el carro", "Regar las matas"], frase: "Recojan agua desde hoy" },
  ]),
  t("feria", "radio", "media", "La feria cambia de día", "Buenas tardes, comunidad. La feria del agricultor de este sábado se pasa al domingo, porque el sábado hay carrera de bicicletas y van a cerrar la calle principal. La feria abre a las seis de la mañana, como siempre, frente al parque. Habrá fresas, aguacates y queso tierno.", [
    { texto: "¿Qué día va a ser la feria?", opciones: ["El domingo", "El sábado", "El lunes"], frase: "se pasa al domingo" },
    { texto: "¿Por qué se cambió?", opciones: ["Por la carrera de bicicletas", "Por la lluvia", "Por una boda"], frase: "hay carrera de bicicletas" },
    { texto: "¿A qué hora abre?", opciones: ["A las seis de la mañana", "A las diez", "A mediodía"], frase: "abre a las seis de la mañana" },
    { texto: "Si alguien va el sábado a la feria, ¿qué le pasa?", opciones: ["No la encuentra", "Compra más barato", "La encuentra abierta"], inferencia: true },
  ]),
  t("turno", "radio", "media", "El turno de la iglesia", "Les recordamos que el turno de la iglesia será el próximo fin de semana. Desde las dos de la tarde habrá chicharrones, tamales y arroz con leche, y la cimarrona va a tocar en el parque. Lo que se recoja es para arreglar el techo del templo. ¡Los esperamos!", [
    { texto: "¿Cuándo es el turno?", opciones: ["El próximo fin de semana", "Mañana", "En diciembre"], frase: "el próximo fin de semana" },
    { texto: "¿Qué van a vender?", opciones: ["Chicharrones y tamales", "Helados y copos", "Pan y café"], frase: "chicharrones, tamales y arroz con leche" },
    { texto: "¿Para qué es la plata?", opciones: ["Para arreglar el techo", "Para la escuela", "Para la feria"], frase: "arreglar el techo del templo" },
    { texto: "¿Cómo va a ser el ambiente del turno?", opciones: ["Alegre, con música", "Triste y callado", "Muy serio"], inferencia: true },
  ]),
  t("escuela", "radio", "media", "Fiesta en la escuela", "Buenos días, comunidad. La escuela invita a la fiesta del Día de la Madre, el viernes a las nueve de la mañana. Los niños van a cantar y a bailar en el gimnasio. Cada familia puede llevar algo de comer para compartir. Si llueve, la fiesta será en el salón comunal.", [
    { texto: "¿Qué celebran?", opciones: ["El Día de la Madre", "Una boda", "La Navidad"], frase: "la fiesta del Día de la Madre" },
    { texto: "¿Dónde será si llueve?", opciones: ["En el salón comunal", "En la iglesia", "En el parque"], frase: "Si llueve, la fiesta será en el salón comunal" },
    { texto: "¿Qué puede llevar cada familia?", opciones: ["Algo de comer", "Flores", "Sillas"], frase: "algo de comer para compartir" },
    { texto: "¿Para quiénes es la fiesta, sobre todo?", opciones: ["Para las mamás", "Para los choferes", "Para los maestros"], inferencia: true },
  ]),
  // ─── Cartas de la familia ───
  t("graduacion", "correo", "corta", "De Carmen", "Querida abuela: el viernes me gradúo del colegio. La ceremonia es a las cuatro, en el gimnasio. Mami te va a llegar a recoger a las tres. ¡Te quiero mucho! Carmen.", [
    { texto: "¿Quién escribe la carta?", opciones: ["Carmen", "Rosa", "Ana"], frase: "Carmen" },
    { texto: "¿Qué día es la graduación?", opciones: ["El viernes", "El sábado", "El domingo"], frase: "el viernes me gradúo" },
    { texto: "¿A qué hora la recogen?", opciones: ["A las tres", "A las cuatro", "A las cinco"], frase: "a recoger a las tres" },
    { texto: "¿Cómo creés que se siente Carmen?", opciones: ["Contenta y orgullosa", "Enojada", "Aburrida"], inferencia: true },
  ]),
  t("visita", "correo", "corta", "De Luis", "Hola, mamá: en dos semanas llego de visita con los chiquitos. Nos quedamos tres días. Los chiquitos dicen que quieren comer de tu gallo pinto. Un abrazo, Luis.", [
    { texto: "¿Quién viene de visita?", opciones: ["Luis con los chiquitos", "La vecina", "El cartero"], frase: "llego de visita con los chiquitos" },
    { texto: "¿Cuándo llegan?", opciones: ["En dos semanas", "Mañana", "En un mes"], frase: "en dos semanas" },
    { texto: "¿Cuántos días se quedan?", opciones: ["Tres días", "Una semana", "Un día"], frase: "Nos quedamos tres días" },
    { texto: "¿Qué le conviene preparar a la mamá?", opciones: ["Gallo pinto", "Una sopa de pescado", "Nada"], inferencia: true },
  ]),
  t("girasoles", "correo", "corta", "De Andrés", "Hola, tía: las semillas de girasol que me regalaste ya florecieron. Hay seis flores amarillas, más altas que yo. Te mando una foto pronto. Besos, Andrés.", [
    { texto: "¿Qué florecieron?", opciones: ["Los girasoles", "Las rosas", "Los claveles"], frase: "las semillas de girasol" },
    { texto: "¿Cuántas flores hay?", opciones: ["Seis", "Dos", "Diez"], frase: "Hay seis flores amarillas" },
    { texto: "¿Qué le va a mandar Andrés?", opciones: ["Una foto", "Unas semillas", "Un queque"], frase: "Te mando una foto pronto" },
    { texto: "¿Por qué le escribe a la tía?", opciones: ["Porque ella le regaló las semillas", "Porque se va de viaje", "Porque es su cumpleaños"], inferencia: true },
  ]),
  t("nieta", "correo", "media", "De Teresa", "Querida comadre: te cuento que ya nació mi nieta. Se llama Sofía y nació el martes en la mañana. Está chiquitita y duerme mucho. El domingo hacemos un almuerzo en la casa para que la conozcan; ojalá podás venir. Traé tu queque de naranja, que a todos les encanta. Con cariño, Teresa.", [
    { texto: "¿Cómo se llama la nieta?", opciones: ["Sofía", "Teresa", "Lucía"], frase: "Se llama Sofía" },
    { texto: "¿Cuándo es el almuerzo?", opciones: ["El domingo", "El martes", "El sábado"], frase: "El domingo hacemos un almuerzo" },
    { texto: "¿Qué le pide que lleve?", opciones: ["Su queque de naranja", "Flores", "Un regalo para la bebé"], frase: "Traé tu queque de naranja" },
    { texto: "¿Cómo se siente Teresa?", opciones: ["Feliz", "Preocupada", "Enojada"], inferencia: true },
  ]),
  t("puntarenas", "correo", "media", "De Mariela", "Querido papá: llegamos bien a Puntarenas. El agua del mar está tibia y en la tarde comimos churchill en el paseo de los turistas. Mañana vamos en lancha a ver la isla. Regresamos el jueves en el bus de la tarde. Te llevamos una sorpresa. Te quiere, Mariela.", [
    { texto: "¿Dónde están?", opciones: ["En Puntarenas", "En Limón", "En Cartago"], frase: "llegamos bien a Puntarenas" },
    { texto: "¿Qué comieron?", opciones: ["Churchill", "Tamales", "Arroz con pollo"], frase: "comimos churchill" },
    { texto: "¿Cuándo regresan?", opciones: ["El jueves", "El lunes", "El sábado"], frase: "Regresamos el jueves" },
    { texto: "¿Cómo la están pasando?", opciones: ["Muy bien", "Muy mal", "Aburridos"], inferencia: true },
  ]),
];
