# Sesión guiada (recursos paso a paso)

Decisión del 16 de noviembre de 2026: los recursos dejan de mostrarse como una ficha larga.
- **Empezar** abre una sesión guiada: una idea por pantalla, con unas 12 palabras a la vista como máximo.
- La ficha con el texto validado sigue disponible, plegada como «Ver la ficha completa».

Cada recurso tiene su **guion propio, escrito en el código**: qué se elige, qué se arma y qué se repasa.
- Editar el recurso en la Biblioteca cambia la ficha completa, no la sesión. Rodolfo lo aceptó porque estas actividades no van a cambiar.
- Un recurso sin guion usa el paso a paso automático de antes.

## Dónde está

| Pieza | Archivo |
|---|---|
| Tipos de escena y guion | `src/lib/sesiones/tipos.ts` |
| Registro de guiones y utilidades (plantillas, condiciones, ayuda por etapa) | `src/lib/sesiones/index.ts` |
| Guiones | `src/lib/sesiones/guiones/*.ts` |
| Pruebas: palabras por pantalla, voseo, referencias, dibujos | `src/lib/sesiones/sesiones.test.ts` |
| Marco (avance, escuchar, Parar, ayuda) | `src/components/sesion/SesionGuiada.tsx` |
| Escenas | `src/components/sesion/Escenas.tsx` |
| Dibujos | `src/components/sesion/Icono.tsx` (nombres en `lib/sesiones/iconos.ts`) |
| Resumen y misión en la pantalla de la actividad | `src/components/sesion/ResumenSesion.tsx` |
| Lo armado en la sesión y la misión de la semana | `plan_tasks.progreso` (jsonb) |

## Vocabulario de escenas

| Escena | Qué hace la persona |
|---|---|
| `seguridad` | Lee «Cuándo parar» con dibujos y el texto completo. Va primero en todo ejercicio. |
| `preparar` | Toca cada cosa cuando está lista. |
| `video` | Mira el video del recurso. |
| `consigna` | Lee una instrucción grande, con dibujo y «Paso n de m». |
| `decir` | Lee en grande la frase para decirle a la persona; puede pedir «Otra pregunta». |
| `elegir` | Elige una opción, que cambia lo que viene después. Puede escribir otra. |
| `lista` | Toca lo que la persona va diciendo; las sugerencias dependen de lo elegido. |
| `ordenar` | Toca los pasos en orden. |
| `repeticiones` | Toca el anillo una vez por repetición, con recordatorios que rotan. |
| `descanso` | Sigue un círculo que respira, con cuenta regresiva. |
| `sentir` | Responde «Bien», «Con cansancio» o «Con molestia». La molestia abre «Parar». |
| `repaso` | Ve el plan que armaron juntos. |
| `mision` | Marca platos durante la semana (también desde la pantalla de la actividad). |
| `cuidados` | Lee los avisos con dibujo. |
| `cierre` | Ve el festejo y da vuelta la tarjeta «¿Sabías que…?». Después, el registro. |

Siempre están a mano:
- **Ayuda:** los consejos del guion, la pista de la escena y la ayuda de su etapa.
- **Escuchar.**
- **Parar**, solo en los ejercicios: lleva a emergencia, a llamar al 911 o a terminar por hoy.

## Tandas

| Tanda | Contenido | Estado |
|---|---|---|
| 0 | Marco, escenas y tres pilotos: GER-003, COG-005 y PRE-005 | Hecha, espera aprobación |
| 1 | Gerontogimnasia (10) | |
| 2 | Cognitivas de conversación (27) | |
| 3 | Nutrición como misión semanal (40) | |
| 4 | Reminiscencia, música, sentidos y movimiento (40) | |
| 5 | Voz pregenerada y medición de uso | |

## Pendiente de la clínica

- **Revisar los textos cortos de cada guion.** Todos tienen `revisado: false`. Se prueban desde Biblioteca › Vista previa › Probar la sesión.
- **Aprobar la seguridad compacta.** Sería el recorrido la primera vez y después los dibujos, con el texto completo a un toque. Mientras no se apruebe, `SEGURIDAD_COMPACTA = false` en `Escenas.tsx` y el texto completo se lee en cada sesión.
