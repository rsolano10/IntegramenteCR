# IntegraMente: Flujos de Interacción entre Familiar, Paciente, Profesional y Clínica

> A diferencia de los dos documentos anteriores, **este no transcribe un documento fuente**. Los cuatro flujos que pediste (autoregistro familiar, primera revisión del expediente, mensajería del profesional, administración de cuentas de staff) no están definidos en ninguno de los dos documentos previos (`integramente_arquitectura_implementacion.md` = IntegraMente en Casa; `integramente_automatizaciones_implementacion.md` = Plataforma IntegraMente/CRM). Este documento es una **propuesta de diseño** que conecta ambos sistemas de forma lógica.

---

## 0. Cómo leer este documento

Cada decisión está etiquetada:
- **[YA DEFINIDO]** — viene literal de uno de los dos documentos anteriores, cito la sección.
- **[PROPUESTA]** — decisión mía para conectar los sistemas donde el negocio todavía no ha especificado nada. Está sujeta a validación, no es spec cerrada.

Todas las [PROPUESTA] quedan además listadas en el §10 como checklist de decisiones a confirmar, para que no se implementen como si fueran definitivas sin que alguien del negocio las revise primero.

---

## 1. Actores y roles

| Rol | Sistema donde actúa | Estado |
|---|---|---|
| Familiar / Cuidador | IntegraMente en Casa (siempre); recibe comunicación de la Plataforma, no opera dentro de ella | [YA DEFINIDO] `rol_respondente` en el cuestionario |
| Paciente | IntegraMente en Casa (según capacidad); cuenta creada automáticamente en la Plataforma al activarse | [YA DEFINIDO] creación de cuenta (Plataforma §4.2 Acción 1); gestión de acceso = [PROPUESTA] ver §5 |
| Neuropsicóloga Referente | Plataforma. Única autoridad clínica que decide/modifica el Plan Terapéutico | [YA DEFINIDO] |
| Profesional Tratante (Gerontogimnasia, Estimulación Cognitiva, Nutrición, Psicoterapia, Snoezelen) | Plataforma. Registra sesiones, propone ajustes, no modifica el plan | [YA DEFINIDO] como "Equipo Tratante" genérico; los subtipos por disciplina son [PROPUESTA] |
| Coordinación del Programa | Plataforma. Opera pagos, horarios, seguimiento comercial | [YA DEFINIDO] |
| Administrador | Plataforma. Gestiona precios maestros y, por extensión lógica, cuentas de staff | [YA DEFINIDO] permisos de precios; gestión de cuentas es [PROPUESTA] |

Cuando en tus preguntas dices "el profesional", distingo abajo si me refiero a la Neuropsicóloga Referente (decide el plan) o a cualquier miembro del Equipo Tratante (ejecuta sesiones), porque tienen permisos distintos.

---

## 2. Modelo de datos que conecta todo [PROPUESTA]

Este es el pegamento entre los dos sistemas. Ninguno de los dos documentos define estas entidades explícitamente; las propongo para que el registro familiar (IntegraMente en Casa) y el expediente clínico (Plataforma) hablen de la misma persona sin duplicar datos.

| Entidad | Campos clave | Notas |
|---|---|---|
| `cuenta` | tipo (familiar / paciente / staff), credenciales, persona_id | Login único por tipo de usuario |
| `persona` | nombre, identificación, contacto (teléfono/correo) | Registro base compartido |
| `vinculo_familiar_paciente` | cuenta_familiar_id, paciente_id, relación, permisos (ver perfil / recibir mensajes / editar cuestionario) | Soporta múltiples familiares por paciente |
| `paciente` | persona_id, estado (máquina de estados ampliada, §8), profesional_referente_id (nullable hasta asignación) | Un solo registro de paciente, independientemente de si vino por autoregistro o por valoración presencial |
| `perfil_en_casa` | paciente_id, 4 semáforos, alertas activas, intereses, disponibilidad de acompañamiento | Salida del cuestionario de IntegraMente en Casa (ya definida en el otro doc) |
| `expediente_clinico` | paciente_id, diagnóstico, objetivos, notas de sesión | Se crea cuando hay valoración formal; puede no existir aún en un paciente fast-track (§4) |
| `plan_terapeutico` | paciente_id, tipo (ideal/contratado), componentes, estado | [YA DEFINIDO] estructura en Plataforma §3.2-3.4 |
| `mensaje` | remitente_staff_id, paciente_id, destinatarios, canal, contenido, timestamp, hilo (clínico/administrativo) | Nuevo, ver §5 |

---

## 3. Flujo 1 — Autoregistro de familiar, vínculo con paciente, y revisión/aceptación del profesional

### 3.1 Lado familiar (dentro de IntegraMente en Casa)

1. El familiar abre IntegraMente en Casa y crea una cuenta [PROPUESTA: método de autenticación exacto — teléfono+OTP vs. correo — no está definido en ningún documento fuente, confirmar con el equipo].
2. En la Pantalla 2 del cuestionario ([YA DEFINIDO], `rol_respondente`), el familiar indica su relación con el paciente. Esto crea automáticamente el `vinculo_familiar_paciente`.
3. Antes de crear un registro de `paciente` nuevo, el sistema corre una **verificación de duplicados** [PROPUESTA, ver §7.1]: si el teléfono/nombre+edad de la persona a registrar coincide con un paciente ya existente vinculado a otro familiar, el sistema alerta al familiar ("Parece que [nombre] ya tiene un registro con nosotros. ¿Quieres solicitar unirte como familiar en lugar de crear uno nuevo?") en vez de crear un duplicado silencioso.
4. El familiar completa el cuestionario completo ([YA DEFINIDO], Etapas 1-3 + Bloques 1-5 + cierre, del documento de IntegraMente en Casa).
5. Al llegar a la pantalla de resumen (RES-01, [YA DEFINIDO]), además de mostrarle el resumen a la familia, el sistema:
   - Marca `perfil_en_casa.completo = true`.
   - Genera automáticamente una **ficha de pre-ingreso** y la coloca en la bandeja de revisión profesional (§3.2). [PROPUESTA — no existe en ninguno de los dos documentos: la Plataforma (Etapa 1) asume que el punto de partida siempre es una valoración neuropsicológica ya finalizada en persona; esto crea una segunda puerta de entrada digital].
   - Notifica al familiar con un mensaje consistente con las reglas de tono de IntegraMente en Casa (cálido, sin prometer resultados, sin mencionar semáforos): "Tu información ya está lista. Un especialista la revisará y te contactaremos pronto."

### 3.2 Recepción y triage por el profesional

Nueva bandeja **"Nuevos registros familiares"**, visible para la(s) Neuropsicóloga(s) [PROPUESTA: reparto round-robin vs. asignación manual por Coordinación, confirmar con el equipo]. Cada ficha muestra:

- Identidad del paciente y del familiar, y el vínculo entre ambos.
- Los 4 semáforos del perfil de En Casa, **visibles aquí sin restricción** (la regla de "nunca mostrar el semáforo al usuario" del documento de IntegraMente en Casa aplica a la interfaz familiar, no a la interfaz interna del profesional — es exactamente para esto que se calculan).
- Cualquier alerta activa (`alerta_cambio_agudo`, `alerta_caida`, `alerta_deglucion`, `alerta_conductual`, `alerta_nutricional`) destacada al tope de la ficha, no enterrada entre el resto de los datos.
- Intereses, historia significativa, disponibilidad de acompañamiento (útiles para armar el plan sin tener que re-preguntar).

**Regla de triage [PROPUESTA — necesita validación clínica del equipo, no la decido yo]:**
- Si hay **cualquier alerta activa** → el sistema sugiere (no obliga) programar una valoración presencial o virtual antes de proponer un plan, y marca la ficha como "requiere valoración clínica".
- Si no hay alertas y los 4 semáforos indican baja complejidad → el profesional puede saltar directo al Constructor del Plan Terapéutico sin agendar una valoración adicional (ruta rápida).
- El umbral exacto de "baja complejidad" que habilita la ruta rápida es una decisión clínica, no técnica; debe definirla la Neuropsicóloga a cargo del producto y quedar como parámetro configurable (consistente con el principio de "Configurabilidad de Parámetros" de la Plataforma).

**Acciones disponibles sobre la ficha:**

| Acción | Efecto |
|---|---|
| Aceptar y agendar valoración | Crea tarea de agendamiento; estado del paciente pasa a `VALORACION_PENDIENTE` ([YA DEFINIDO], código del Anexo Técnico de la Plataforma) |
| Aceptar y construir plan directamente (ruta rápida) | Abre el Constructor del Plan Terapéutico ([YA DEFINIDO]) prellenado con lo que ya se sabe del perfil de En Casa (intereses, disponibilidad de acompañamiento); continúa el flujo de Etapa 1 desde "Programa recomendado" exactamente como ya está especificado |
| Declinar / derivar | El caso no es apto para el programa (ej. requiere atención médica urgente en vez de estimulación); notificación al familiar con siguientes pasos, cierre del registro. **Este caso no existe en ningún documento fuente**, porque la Plataforma asume que todo paciente que entra a Etapa 1 ya viene con luz verde profesional. |

### 3.3 De ahí en adelante

El flujo continúa exactamente como la Etapa 1 ya especificada en `integramente_automatizaciones_implementacion.md` (Ruta A / Ruta B, cotización, aceptación, activación). No lo repito aquí; solo señalo el punto de entrada nuevo.

```
Familiar se registra en IntegraMente en Casa
        │
        ▼
Completa cuestionario (perfil_en_casa)
        │
        ▼
Ficha de pre-ingreso → bandeja del profesional
        │
        ├── Hay alerta activa ──► Agendar valoración ──► VALORACION_PENDIENTE ──► Constructor del Plan
        │
        └── Sin alertas, baja complejidad ──► Constructor del Plan directamente
                        │
                        ▼
        (continúa igual que Etapa 1 ya especificada: Programa recomendado → cotización → Ruta A/B...)
```

---

## 4. Flujo 2 — Primera visualización del expediente por un profesional

Cuando un profesional (Referente o Tratante) abre el expediente de un paciente por primera vez, la Ficha Clínica Ejecutiva ([YA DEFINIDO], Plataforma §4.3) debe **adaptarse según qué información existe todavía**, porque ahora un paciente puede llegar por dos caminos distintos (valoración presencial tradicional, o autoregistro + ruta rápida del §3):

**Caso A — Paciente en ruta rápida (aún sin valoración formal):**
La Ficha Clínica Ejecutiva muestra únicamente lo que existe: los 4 semáforos y alertas del perfil de En Casa, intereses, disponibilidad de acompañamiento, y el Plan Terapéutico si ya fue asignado. En el campo "Diagnóstico Principal" muestra explícitamente "Pendiente de valoración formal" en vez de dejarlo vacío o inventar contenido.

**Caso B — Paciente con expediente clínico completo (valoración ya realizada):**
La Ficha Clínica Ejecutiva se ve como en la Plataforma ([YA DEFINIDO]: diagnóstico, objetivo principal, puntos clave "no olvidar", plan contratado) **más una sección adicional** [PROPUESTA] que muestra el perfil original de En Casa, si existe, para que el profesional pueda contrastar el autorreporte de la familia con la valoración profesional. Esto tiene valor clínico real: si la familia reportó "cambios evidentes" en el cuestionario pero la valoración no encontró correlato objetivo (o viceversa), es información que vale la pena que el profesional vea, no que se pierda.

**Alcance de lectura según quién abre el expediente [PROPUESTA, requiere confirmación]:**
- La Neuropsicóloga Referente ve el expediente completo, siempre.
- Un Profesional Tratante que **nunca ha tenido sesión agendada ni registrada** con ese paciente no debería poder abrir su expediente — no hay razón de negocio para ese acceso y aumenta la superficie de exposición de datos clínicos sin necesidad.
- Un Profesional Tratante que sí tiene sesiones con el paciente ve la Ficha Clínica Ejecutiva completa (los datos de seguridad — caídas, alertas, deglución — importan a través de disciplinas, no solo a la suya), pero su capacidad de **escritura** se limita a las notas de su propia disciplina, consistente con la gobernanza clínica ya definida en la Plataforma (Bloque C: el Equipo Tratante registra bitácora y propone, no modifica la estructura del plan).

La primera vez que se abre el expediente, el resumen ejecutivo se muestra automáticamente antes que cualquier otra pestaña, con una opción "Ver expediente completo" para quien necesite más detalle.

---

## 5. Flujo 3 — Mensajería del profesional hacia familiar/paciente

Esta es una funcionalidad **nueva**, no está en ninguno de los dos documentos. Antes de diseñarla hay que reconciliar una tensión real con la Plataforma: el Bloque F de ese documento limita los envíos **automáticos** del sistema a 4 tipos (bienvenida, credenciales, documentos, reglamento) y dice explícitamente que "todo el contenido educativo, recordatorios diarios y seguimiento cercano se gestiona directamente dentro de IntegraMente en Casa". Esa regla gobierna mensajes automáticos generados por el sistema — no necesariamente prohíbe que un profesional envíe un mensaje puntual manual ("confirmamos su cita de mañana a las 3pm", "¿cómo le fue a don Juan con la actividad de esta semana?"). Aun así, **vale la pena confirmarlo explícitamente con el negocio** antes de construirlo: podría ir contra la intención original de mantener el compromiso diario fuera de la plataforma clínica, y construir esto sin esa validación puede terminar duplicando lo que ya hace IntegraMente en Casa.

**Diseño propuesto, si se confirma que se quiere:**

- Cada paciente tiene un **hilo de mensajería** único, visible desde su expediente, con todos los familiares vinculados (`vinculo_familiar_paciente`) como destinatarios posibles — mostrando explícitamente a quién se le está enviando cada mensaje, porque puede haber más de un familiar vinculado.
- **Separación por dominio** (misma lógica que el principio de "Separación de Dominio Clínico vs. Administrativo" de la Plataforma): el hilo se divide en dos sub-hilos, **Clínico** (Neuropsicóloga Referente + Equipo Tratante) y **Administrativo** (Coordinación: pagos, horarios). Esto evita que Coordinación vea o escriba contenido clínico y viceversa, sin necesidad de reglas ad hoc por mensaje.
- **Canal de entrega:** reutilizar la infraestructura de WhatsApp API que la Plataforma ya prevé para mensajes automáticos ([YA DEFINIDO], §4.2 Acción 3 y diccionario de variables §6.3). El mensaje escrito desde la Plataforma se entrega por WhatsApp al familiar y queda espejado en el hilo interno para trazabilidad.
- **Contenido:** texto libre + un set de plantillas rápidas (recordatorio de sesión, solicitud de documento) para mantener consistencia de tono. Las reglas de voz de IntegraMente en Casa (cálido, adulto, no alarmista, sin mencionar semáforos ni diagnóstico sin filtrar) deberían aplicar aquí también, porque el destinatario final es la misma familia.
- **Auditoría:** cada mensaje registra remitente, timestamp, destinatario y canal — consistente con el principio de "Trazabilidad y Auditoría Permanente" ya establecido para toda la Plataforma.
- **Mensajes directos al paciente** (no solo al familiar): solo si el paciente tiene cuenta propia activa **y** su `nivel_cognitivo` (del perfil de En Casa) sugiere que puede gestionar la comunicación por sí mismo (verde/amarillo). Si es rojo cognitivo, dirigir todo al familiar por defecto. Esto reutiliza directamente la clasificación cognitiva ya calculada en IntegraMente en Casa, y es coherente con la regla de personalización de comunicación que ya existe ahí (COG-06: adaptar según capacidad expresiva de la persona).

---

## 6. Flujo 4 — Administración de cuentas de profesionales por la clínica

Actor: **Administrador** — es el único rol con permiso para "Modificar Precios Maestros" en la matriz RBAC ya definida; por extensión lógica es también quien gestiona altas de staff, aunque la Plataforma no lo dice explícitamente para este caso [PROPUESTA, pero es la lectura más consistente con el principio de RBAC del documento fuente].

**Pantalla nueva: "Gestión de Equipo"** [PROPUESTA]:

1. El Administrador crea una nueva cuenta de staff: nombre, correo/teléfono, y rol (Neuropsicóloga Referente / Profesional Tratante + disciplina / Coordinación / Administrador).
2. Si el rol es Profesional Tratante, selecciona la(s) disciplina(s): Gerontogimnasia, Estimulación Cognitiva, Nutrición, Psicoterapia, Snoezelen [PROPUESTA de subtipos — la Plataforma solo distingue "Neuropsicóloga Referente" vs. "Equipo Tratante" genérico, sin diferenciar disciplinas dentro de ese grupo].
3. El sistema envía invitación (WhatsApp o correo) con credenciales temporales y **obliga a cambiar la contraseña en el primer ingreso** [PROPUESTA — no está en el documento fuente, pero es necesario: la Plataforma exige registrar "usuario responsable" en cada acción de auditoría, y eso requiere autenticación real por persona, no una cuenta compartida].
4. Los permisos se heredan automáticamente de la matriz RBAC ya definida según el rol asignado. **No hay permisos "a la carta" por usuario individual** — mantiene el principio explícito de "programar por roles, nunca por usuario individual".
5. **Asignación de pacientes a un Profesional Tratante nuevo:** se hace vía la agenda/cronograma ([YA DEFINIDO], §4.2 Acción 6), no automáticamente a toda la cartera de la clínica. Esto conecta directamente con la regla de lectura de expediente del §4: acceso = tener al menos una sesión agendada o registrada con ese paciente, o ser el `profesional_referente`.
6. **Desactivación (no eliminación)** de cuentas cuando un profesional deja la clínica, para preservar el historial de auditoría intacto [PROPUESTA, no está en el documento fuente pero es necesaria dado el principio de auditoría permanente].
7. **Múltiples Neuropsicólogas Referentes en simultáneo:** el sistema debe soportar N neuropsicólogas activas, cada una siendo referente de su propia cartera de pacientes. Si una neuropsicóloga deja la clínica, el Administrador debe poder **reasignar la cartera completa** de pacientes a otra referente (transferencia masiva, no paciente por paciente) [PROPUESTA — caso no cubierto en el documento fuente en absoluto].

---

## 7. Reconciliación cruzada (donde las cuatro preguntas se tocan entre sí)

### 7.1 Deduplicación de pacientes
Campos de matching sugeridos: teléfono del paciente o del familiar, nombre + edad aproximada. Ante un match parcial (no exacto), **el sistema nunca fusiona automáticamente** — muestra al profesional una alerta de "posible duplicado" en la ficha de pre-ingreso (§3.2) para que decida manualmente. Fusionar mal a dos personas distintas es un error mucho más costoso que dejarlo pendiente de revisión humana.

### 7.2 Múltiples familiares vinculados al mismo paciente
El cuestionario de IntegraMente en Casa asume un único respondente; no cubre qué pasa si dos hijos, por ejemplo, están vinculados al mismo paciente. Propuesta: el cuestionario tiene un "dueño" (quien lo inició); los demás familiares vinculados tienen acceso de solo lectura al perfil y reciben mensajes, pero no pueden re-completar o modificar el cuestionario salvo que el dueño transfiera esa responsabilidad explícitamente.

### 7.3 Paciente que llega por las dos puertas a la vez
Si una familia ya autoregistró al paciente en IntegraMente en Casa, y semanas después esa misma persona llega a la clínica por una valoración presencial gestionada de forma independiente (sin pasar por la bandeja del §3.2), el profesional que hace la valoración presencial debe poder **buscar y vincularse** al registro de paciente ya existente en vez de crear uno nuevo — mismo mecanismo de deduplicación del §7.1, pero iniciado desde el lado clínico en vez del lado familiar.

---

## 8. Máquina de estados ampliada [PROPUESTA]

Se agrega un estado nuevo antes de `VALORACION_PENDIENTE` en la máquina de estados ya definida (Plataforma, Anexo Técnico), para cubrir el hueco identificado en el Flujo 1:

| Código nuevo | Nombre en interfaz | Transiciones válidas a |
|---|---|---|
| `PERFIL_AUTOREGISTRO_PENDIENTE_REVISION` | Autoregistro pendiente de revisión | `VALORACION_PENDIENTE` (si requiere valoración) o `PLAN_DISENADO` (si ruta rápida) |

El resto de la máquina de estados no cambia; este nuevo código es simplemente el punto de entrada alternativo al ya existente `VALORACION_PENDIENTE`.

---

## 9. Notas de implementación técnica

1. **Autenticación separada por tipo de cuenta, backend de identidad compartido.** Familiar, paciente y staff son tipos de cuenta distintos con distintos scopes de permisos, pero deberían vivir en el mismo servicio de identidad para que el `vinculo_familiar_paciente` y el `profesional_referente_id` sean referencias reales, no IDs sueltos entre sistemas separados.
2. **Mensajería como cola asíncrona.** Guardar el mensaje en base de datos como "pendiente de envío" antes de intentar la entrega por WhatsApp API, para no bloquear la UI del profesional esperando la respuesta del proveedor; un job actualiza el estado a "entregado"/"fallido" después.
3. **Ficha Clínica Ejecutiva como componente adaptativo**, no como dos pantallas hardcodeadas: debe renderizar secciones condicionalmente según qué entidades existen (`perfil_en_casa`, `expediente_clinico`, `plan_terapeutico`), para soportar naturalmente los Casos A y B del §4 sin lógica duplicada.
4. **Función centralizada de control de acceso a expediente**, ej. `puede_ver_expediente(usuario, paciente)`, en vez de repetir la regla del §4 en cada pantalla: true si es referente, o si tiene sesión agendada/registrada con el paciente, o si es Coordinación/Administrador.
5. **Detección de duplicados como servicio reusable**, invocado tanto desde el flujo de autoregistro familiar (§3.1) como desde el flujo de valoración presencial iniciada por un profesional (§7.3), para no duplicar la lógica de matching en dos lugares del código.

---

## 10. Decisiones de diseño que requieren validación del negocio

Todas nuevas (no vienen de ningún documento fuente); ninguna debería tratarse como definitiva hasta que alguien del negocio las confirme:

1. Método de autenticación de cuentas de familiar (teléfono+OTP vs. correo).
2. Umbral clínico exacto que habilita la "ruta rápida" sin valoración formal (§3.2).
3. Si el paciente gestiona su propia cuenta de forma independiente o siempre a través del familiar (§5).
4. Si se separan los hilos de mensajería en Clínico/Administrativo o se maneja un único hilo (§5).
5. Si la mensajería manual del profesional contradice la intención original de mantener el engagement diario fuera de la Plataforma (§5, tensión con Bloque F de la Plataforma).
6. Umbral de "posible duplicado" y qué campos usar para el matching de pacientes (§7.1).
7. Cómo se resuelven respuestas contradictorias entre múltiples familiares vinculados al mismo paciente (§7.2).
8. Alcance de lectura del expediente para el Equipo Tratante: completo vs. limitado a su disciplina (§4).
9. Reparto de la bandeja de "Nuevos registros familiares": round-robin automático vs. asignación manual por Coordinación (§3.2).
10. Quién gestiona altas de staff en la práctica: ¿siempre Administrador, o también Coordinación con permisos limitados? (§6).

---

## 11. Checklist de aceptación (QA)

- [ ] Un familiar puede completar el cuestionario de IntegraMente en Casa y el registro de paciente resultante queda visible en la bandeja de revisión profesional, sin intervención manual.
- [ ] El sistema detecta (y alerta, no fusiona automáticamente) un posible duplicado cuando dos familiares distintos intentan registrar a la misma persona.
- [ ] Un paciente con cualquier alerta activa del perfil de En Casa **nunca** puede pasar a la ruta rápida sin que el profesional lo apruebe explícitamente.
- [ ] La Ficha Clínica Ejecutiva se renderiza correctamente tanto para pacientes en ruta rápida (Caso A) como con expediente clínico completo (Caso B), sin mostrar campos vacíos ni inventados.
- [ ] Un Profesional Tratante sin sesiones agendadas/registradas con un paciente no puede abrir su expediente.
- [ ] Cada mensaje enviado desde la Plataforma queda registrado con remitente, destinatario, canal y timestamp, y se entrega por WhatsApp al familiar correspondiente.
- [ ] Los mensajes del sub-hilo Administrativo nunca son visibles para Coordinación como si fueran clínicos, y viceversa (si se implementa la separación del §5).
- [ ] Un Administrador puede crear una cuenta de Profesional Tratante, asignarle disciplina, y esa persona solo ve pacientes una vez que tiene sesiones asignadas — nunca la cartera completa por defecto.
- [ ] Al desactivar la cuenta de un profesional, su historial de auditoría (notas, mensajes, cambios de estado) permanece intacto y atribuido a su nombre.
- [ ] Todas las decisiones marcadas [PROPUESTA] en este documento fueron confirmadas o corregidas explícitamente por el negocio antes de darse por implementadas como definitivas.
