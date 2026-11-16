// Banco de «La banca del parque»: dichos y refranes de uso común en Costa
// Rica. Los significados están redactados con palabras propias. `parecidos`
// son finales falsos pero creíbles (para el nivel medio y el retador).
// `muyConocido`: los que casi todo el mundo completa (nivel suave).
// `aceptados`: otros finales que también valen; nunca salen como opción
// junto con el principal. `revisado: false` hasta que el equipo lo apruebe.

export interface Dicho {
  id: string;
  inicio: string;
  final: string;
  aceptados?: string[];
  significado: string;
  parecidos: string[];
  muyConocido: boolean;
  revisado: boolean;
}

const d = (id: string, inicio: string, final: string, significado: string, parecidos: string[], muyConocido = true, aceptados?: string[]): Dicho => ({
  id,
  inicio,
  final,
  significado,
  parecidos,
  muyConocido,
  aceptados,
  revisado: false,
});

export const DICHOS: Dicho[] = [
  d("camaron", "Camarón que se duerme…", "se lo lleva la corriente", "Si uno se descuida, pierde la oportunidad.", ["se queda en la orilla", "amanece cansado"]),
  d("madruga", "Al que madruga…", "Dios le ayuda", "Empezar temprano rinde más.", ["le sobra el día", "le dan el mejor pan"]),
  d("pajaro", "Más vale pájaro en mano…", "que cien volando", "Es mejor algo seguro que mucho que no es seguro.", ["que dos en el árbol", "que uno en la jaula"]),
  d("perro", "Perro que ladra…", "no muerde", "Quien amenaza mucho casi nunca hace nada.", ["no duerme", "cuida la casa"]),
  d("herrero", "En casa de herrero…", "cuchillo de palo", "A veces falta justo lo que uno sabe hacer.", ["martillo de hierro", "puerta de madera"]),
  d("mal", "No hay mal que por bien…", "no venga", "De algo malo también puede salir algo bueno.", ["no se cure", "no se olvide"]),
  d("ojos", "Ojos que no ven…", "corazón que no siente", "Lo que uno no sabe no le duele.", ["boca que no habla", "manos que no tocan"]),
  d("caballo", "A caballo regalado…", "no se le mira el colmillo", "Un regalo se agradece sin buscarle defectos.", ["no se le pone silla", "se le da de comer"], true, ["no se le busca colmillo"]),
  d("andas", "Decime con quién andás…", "y te diré quién sos", "Las compañías dicen mucho de una persona.", ["y te diré a dónde vas", "y te diré qué comés"]),
  d("tarde", "Más vale tarde…", "que nunca", "Es mejor hacer algo tarde que no hacerlo.", ["que temprano", "que de noche"]),
  d("trecho", "Del dicho al hecho…", "hay mucho trecho", "Decir algo es más fácil que hacerlo.", ["hay un paso", "no hay nada"], false),
  d("galillo", "El que tiene más galillo…", "traga más pinol", "Quien es más hábil o más atrevido consigue más.", ["canta más fuerte", "come más tortillas"], false),
  d("feria", "Cada uno habla de la feria…", "según le va en ella", "Cada quien opina según lo que le ha tocado vivir.", ["según lo que compra", "cuando vuelve a la casa"], false),
  d("tigre", "Hijo de tigre…", "sale pintado", "Los hijos se parecen a sus padres.", ["sale rayado", "duerme de día"]),
  d("rabia", "Muerto el perro…", "se acabó la rabia", "Si se quita la causa, se acaba el problema.", ["se acabó el ruido", "se acabó la fiesta"], false),
  d("rio", "Cuando el río suena…", "es porque piedras trae", "Si se habla mucho de algo, por algo será.", ["es porque va a llover", "es porque está crecido"]),
  d("pan", "A falta de pan…", "buenas son tortillas", "Si no hay lo que uno quiere, se aprovecha lo que hay.", ["buenas son galletas", "buena es la sopa"]),
  d("abarca", "El que mucho abarca…", "poco aprieta", "Quien quiere hacer demasiado no hace bien nada.", ["mucho carga", "poco duerme"], false),
  d("guerra", "Guerra avisada…", "no mata soldado", "Si uno sabe lo que viene, puede prepararse.", ["no se pelea", "trae la paz"], false),
  d("barriga", "Barriga llena…", "corazón contento", "Después de comer bien, uno anda de buen ánimo.", ["pies cansados", "sueño seguro"]),
  d("despacio", "Poco a poco…", "se anda lejos", "Con constancia se llega lejos.", ["se llega tarde", "se cansa uno"], false),
  d("madrugar", "No por mucho madrugar…", "amanece más temprano", "Apurarse no hace que las cosas lleguen antes.", ["se trabaja más", "se duerme menos"], false),
];
