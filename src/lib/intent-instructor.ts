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
];

/**
 * Palabras que solas no significan nada —un cliente también las usa— pero
 * que con contexto de trabajo sí. Se exige una de cada lista.
 */
const AMBIGUAS = /\b(instructor|maestro|profesor|uber|didi|chofer|conductor|manejo)\b/;
const CONTEXTO_LABORAL =
  /\b(trabajo|trabajar|empleo|chamba|vacante|puesto|sueldo|salario|pagan|paga|ingreso|ganar|aplicar|postular|curriculum|cv|experiencia laboral|requisitos)\b/;

export function esIntentInstructor(texto: string): boolean {
  const t = normalizar(texto);
  if (EMPLEO.some(r => r.test(t))) return true;
  return AMBIGUAS.test(t) && CONTEXTO_LABORAL.test(t);
}
