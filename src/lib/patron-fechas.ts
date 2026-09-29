/**
 * Los cuatro días de un curso, a partir de cómo se venden.
 *
 * Un curso no se agenda fecha por fecha: se acuerda un patrón —lunes a jueves,
 * martes a viernes, o el fin de semana— una fecha de inicio y una hora. De ahí
 * salen las cuatro clases. Así lo cierra Luz por WhatsApp desde siempre; esto
 * saca esa cuenta de `aea-tools.ts` (que arrastra Genkit) para que la puedan
 * usar también el formulario del mostrador y sus pruebas.
 */

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export type Patron = 'lunes-jueves' | 'martes-viernes' | 'fin-de-semana';

export const PATRONES: { valor: Patron; etiqueta: string; dias: string }[] = [
  { valor: 'lunes-jueves', etiqueta: 'Lunes a jueves', dias: 'L M M J' },
  { valor: 'martes-viernes', etiqueta: 'Martes a viernes', dias: 'M M J V' },
  // El de fin de semana son dos sábados y dos domingos: +0, +1, +7 y +8.
  { valor: 'fin-de-semana', etiqueta: 'Fin de semana', dias: 'S D · S D' },
];

/**
 * Las horas a las que de verdad arranca una clase. Cada una dura 2.5 horas, así
 * que no hay nada entre medio: una hora libre deja capturar 10:37, que no existe.
 */
export const HORARIOS_INICIO = ['07:00', '10:00', '13:00', '16:00', '19:00'];

/** "7am", "1pm" — como se dicen, para el prompt de Luz y para los botones. */
export function horaCorta(hhmm: string): string {
  const h = Number(hhmm.split(':')[0]);
  return `${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}`;
}

export const HORARIOS_TEXTO = HORARIOS_INICIO.map(horaCorta).join(', ');

export function calcularFechas(patron: string, fechaInicio: string, hora: string) {
  const offsets = patron === 'fin-de-semana' ? [0, 1, 7, 8] : [0, 1, 2, 3];
  const [y, m, d] = fechaInicio.split('-').map(Number);
  return offsets.map((offset) => {
    const fecha = new Date(y, m - 1, d + offset);
    const dateStr = fecha.toLocaleDateString('en-CA');
    const label = `${DIAS_ES[fecha.getDay()]} ${fecha.getDate()} de ${MESES_ES[fecha.getMonth()]}`;
    return { date: dateStr + 'T12:00:00', time: hora, label };
  });
}
