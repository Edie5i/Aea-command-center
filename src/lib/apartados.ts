/**
 * Los horarios que ya tiene alguien, aunque no exista el evento en Calendar.
 *
 * La disponibilidad se medía SÓLO con Google Calendar, y a Calendar nada más
 * llegan las clases por dos vías: el comprobante que entra por WhatsApp y la
 * herramienta `confirmarInscripcion`. Un lugar apartado —y pagado— en una ficha
 * no ocupaba nada, así que Luz y la captura de mostrador lo volvían a vender.
 * El 6 de octubre de 2026 había diecisiete horarios futuros con más de un
 * alumno encima: cuatro fichas distintas sobre el sábado 10 a las 10:00, y dos
 * alumnos pagados —Tomas y Daina— en el mismo bloque de lunes a jueves.
 *
 * Esto es la otra mitad del cálculo: las fichas que tienen el horario tomado.
 * Es una función pura sobre fichas ya leídas para poder probarla sin Firestore;
 * quien la usa pasa lo que trae de la colección.
 */

import type { Ficha } from './ficha-reglas';
import { ZONA_HORARIA } from './calendar-keys';

/**
 * Cuánto aguanta un apartado sin pagar antes de devolver el horario al mercado.
 *
 * Una pre-reserva recién hecha es un alumno decidiéndose: su horario no se le
 * vende a nadie más mientras manda el comprobante. Pero un lead que nunca pagó
 * no puede congelar el sábado para siempre —Hilario y Nasarid llevaban una
 * semana ocupando las 10:00 y la 1:00 del fin de semana sin haber dado un peso—,
 * así que al cabo de dos días el lugar vuelve a estar libre. Una ficha pagada
 * no caduca nunca: ésa es la que de verdad tiene el lugar.
 */
export const HORAS_APARTADO_SIN_PAGAR = 48;

/** Las fichas, como las necesita este cálculo: lo demás no se mira. */
export type FichaApartada = Pick<Ficha, 'estado' | 'opcionesFechaHora' | 'creada' | 'studentName'> & {
  /** El id del documento es el teléfono a 12 dígitos; `telefono` va a 10. */
  id?: string;
  telefono?: string;
};

/** Últimos 10 dígitos: el id de la ficha va a 12 y `telefono` a 10. */
const diezDigitos = (tel: string) => tel.replace(/\D/g, '').slice(-10);

/**
 * Los horarios tomados por fichas, como "YYYY-MM-DD HH:mm" → nombre del alumno.
 *
 * `excluirTelefono` deja fuera al alumno por el que se pregunta: su propio
 * apartado no es un conflicto. Sin eso, el candado del webhook que verifica que
 * las 4 fechas prometidas sigan libres vería el apartado del propio alumno y le
 * diría a todo el mundo que se le cayeron sus fechas.
 */
export function slotsApartados(
  fichas: FichaApartada[],
  opts: { ahora?: number; excluirTelefono?: string } = {}
): Map<string, string> {
  const ahora = opts.ahora ?? Date.now();
  const corte = ahora - HORAS_APARTADO_SIN_PAGAR * 3_600_000;
  const excluir = opts.excluirTelefono ? diezDigitos(opts.excluirTelefono) : null;
  const hoy = new Date(ahora).toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

  const tomados = new Map<string, string>();
  for (const f of fichas) {
    // Una ficha marcada perdida a mano no guarda nada: es un lead que ya no va.
    if (f.estado === 'perdida') continue;
    // Pagada: el lugar es suyo. Sin pagar: sólo mientras el apartado sea fresco.
    if (f.estado !== 'reservada' && (f.creada ?? 0) < corte) continue;
    if (excluir) {
      const suyo = diezDigitos(f.telefono || f.id || '');
      if (suyo && suyo === excluir) continue;
    }
    for (const slot of f.opcionesFechaHora ?? []) {
      const [dia, hora] = slot.split(' ');
      if (!dia || !hora || dia < hoy) continue;
      // La primera gana: si dos fichas tienen el mismo horario —que es
      // justamente lo que hay que dejar de producir— el nombre que se reporta
      // es el de la que se leyó antes. Para el cálculo da igual: está ocupado.
      if (!tomados.has(slot)) tomados.set(slot, f.studentName || 'sin nombre');
    }
  }
  return tomados;
}
