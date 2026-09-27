/**
 * ¿Quien escribe busca TRABAJO como instructor, o es un cliente que quiere
 * tomar clases?
 *
 * Vive aparte de `marco.ts` —que importa código server-only— para poder
 * probarse, igual que `notify-format.ts`. Y falla en las dos direcciones:
 *
 *   - Si es demasiado estrecho, un candidato real cae con Luz, que le
 *     intenta vender un curso. Al 2026-09-14 Marco llevaba 30+ días sin
 *     contestarle a nadie: solo despertaba con el texto exacto del anuncio.
 *
 *   - Si es demasiado amplio, secuestra una venta. Ya pasó en producción con
 *     un lead real, que quedó atrapado hablando con Marco a mitad de agendar
 *     su curso. Por eso "instructor", "enseñar" o "manejo" a secas NO bastan:
 *     son vocabulario normal de un cliente.
 *
 * La regla: solo despierta con intención de EMPLEO inequívoca, o con una
 * palabra ambigua acompañada de contexto de trabajo.
 */

/** Sin acentos y en minúsculas, para no depender de cómo escriba la gente. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Señales que por sí solas ya dicen "busco trabajo". Ningún cliente que
 * quiere aprender a manejar escribe esto.
 */
const EMPLEO = [
  /\bser (instructor|maestro|profesor)\b/,
  /\btrabajar (de|como) (instructor|maestro|profesor)\b/,
  /\b(vacante|vacantes)\b/,
  /\b(contratan|contratando|contratacion|reclutan|reclutando|reclutamiento|reclutar)\b/,
  /\bbusco (trabajo|empleo|chamba)\b/,
  /\b(necesito|quiero) (trabajo|empleo|chamba)\b/,
  /\bquiero trabajar\b/,
  /\b(solicito|solicitud de) empleo\b/,
  /\b(bolsa de trabajo|oferta laboral|puesto de instructor)\b/,
  /\bcuanto pagan\b/,
  /\bme interesa (la vacante|el puesto|el trabajo|el empleo)\b/,
  // "vengo por lo del trabajo", "para el puesto", "por lo de la vacante".
  /\b(por|para) (el|la|lo del|lo de la|lo de) (trabajo|puesto|empleo|chamba)\b/,
  // Un alumno dice "tomar clases"; quien dice "DAR clases" quiere el puesto.
  /\bdar clases (de manejo|de conducir)\b/,
  /\bquiero dar clases\b/,
  // Pedir «el puesto» o «la vacante» ya es pedir trabajo, sin nombrar el
  // oficio. El alumno que escribe «solicito información del curso» no cae
  // aquí: lo que pide no es ninguna de estas palabras.
  /\b(solicit\w*|pid\w*|quiero) (el |la |un |una )?(puesto|vacante|empleo)\b/,
];

/**
 * Palabras que solas no significan nada —un cliente también las usa— pero
 * que con contexto de trabajo sí. Se exige una de cada lista.
 */
const AMBIGUAS = /\b(instructor|maestro|profesor|uber|didi|chofer|conductor|manejo)\b/;
const CONTEXTO_LABORAL =
  // Raíces y no conjugaciones sueltas: el 26 de septiembre de 2026 alguien
  // escribió «yo aplique para instructor» y se fue con Luz porque la lista
  // decía `aplicar` y no `aplique`.
  //
  // Y van DOS raíces para aplicar —`aplic` y `apliqu`—: en español la c se
  // vuelve qu antes de e, así que «apliqué» no contiene «aplic». Una sola
  // raíz deja fuera justo la forma en que la gente cuenta lo que ya hizo.
  /\b(trabajo|trabajar|empleo|chamba|vacante|puesto|sueldo|salario|pagan|paga|ingreso|ganar|aplic\w*|apliqu\w*|postul\w*|curriculum|cv|experiencia laboral|requisitos)\b/;

/**
 * Darse de alta EN UN PUESTO. Ninguna de las dos mitades basta sola —un
 * alumno se inscribe todo el tiempo, y «instructor» la dice cualquiera— pero
 * juntas no dejan lugar a dudas: quien se registra *como instructor* no
 * quiere tomar clases.
 *
 * Sale de un caso real del 27 de septiembre de 2026: «Pero yo m estoy
 * registrando como instructor». Luz le contestó «nosotros solo vendemos
 * cursos para alumnos» después de media conversación vendiéndole el curso
 * Avanzado.
 */
const DARSE_DE_ALTA =
  /\b(aplic\w*|apliqu\w*|postul\w*|registr\w*|inscrib\w*|inscripcion|anot\w*|solicit\w*|contrat\w*|dar(me)? de alta)\b/;
const EN_EL_PUESTO =
  /\b(como|de|para) (instructor|instructora|maestro|maestra|profesor|profesora|chofer|conductor)\b/;

export function esIntentInstructor(texto: string): boolean {
  const t = normalizar(texto);
  if (EMPLEO.some(r => r.test(t))) return true;
  if (DARSE_DE_ALTA.test(t) && EN_EL_PUESTO.test(t)) return true;
  return AMBIGUAS.test(t) && CONTEXTO_LABORAL.test(t);
}
