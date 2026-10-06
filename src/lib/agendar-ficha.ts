/**
 * Las clases de una ficha, en Google Calendar.
 *
 * Confirmar el apartado sólo ponía `depositoPagado: true`. Nada más. El alumno
 * veía "✅ Lugar confirmado" en su ficha, al admin le llegaba "FICHA RESERVADA",
 * y en Calendar —que es de donde sale la agenda del instructor y la
 * disponibilidad que Luz vende— no existía ninguna clase. El 6 de octubre de
 * 2026 había cuatro alumnos pagados así: Tomas y Daina llevaban dos días de
 * curso sin que nadie supiera que tenían clase, y los dos a la misma hora.
 *
 * Las clases se crean cuando la ficha pasa a 'reservada', venga de donde venga
 * —el panel, la liga que llega por WhatsApp o la captura de mostrador—, que es
 * el único momento en que se sabe que el lugar es de alguien. El candado de
 * `scheduleAndCreateEvents` hace que repetirlo no duplique nada.
 */

import type { Ficha } from './ficha-reglas';
import { ZONA_HORARIA } from './calendar-keys';

/** Punto de encuentro cuando la ficha no trae dirección: la sede. */
const SEDE = 'Torreón 49, Roma Sur';

/**
 * Agenda las clases futuras de una ficha reservada. Devuelve la línea que se le
 * añade al aviso del admin — una sola notificación, la que ya dice que la ficha
 * quedó reservada, en vez de dos mensajes seguidos.
 */
export async function agendarClasesDeFicha(id: string, ficha: Ficha): Promise<string> {
  if (ficha.estado !== 'reservada') return '';

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });
  const fechas = (ficha.opcionesFechaHora ?? [])
    .map((slot) => {
      const [date, time] = slot.split(' ');
      return { date, time };
    })
    .filter((f) => f.date && f.time);
  // Las clases que ya pasaron no se crean: o se dieron, o se perdieron, y en
  // ninguno de los dos casos sirve sembrarlas hoy en el calendario.
  const futuras = fechas.filter((f) => f.date >= hoy);
  const pasadas = fechas.length - futuras.length;

  if (futuras.length === 0) {
    const aviso = fechas.length === 0 ? 'la ficha no tiene fechas' : 'todas sus fechas ya pasaron';
    console.warn('[AGENDAR] Nada que agendar para', id, '—', aviso);
    return `\n⚠️ Sin clases en Calendar: ${aviso}.`;
  }

  try {
    const { scheduleAndCreateEvents } = await import('@/ai/flows/create-calendar-event');
    const { created, omitidos } = await scheduleAndCreateEvents({
      name: ficha.studentName,
      // Calendar quiere lada: el id de la ficha es el teléfono a 12 dígitos,
      // mientras que `telefono` se guarda a 10 para armar el wa.me.
      phone: id,
      address: ficha.zona || SEDE,
      transmission: ficha.curso,
      dates: futuras.map((f) => ({ date: `${f.date}T12:00:00`, time: f.time })),
      ...(ficha.nota ? { notes: ficha.nota } : {}),
    });
    console.log('[AGENDAR]', ficha.studentName, '→', created, 'clase(s) creada(s),', omitidos, 'ya estaban');
    const detalle =
      (created > 0 ? `${created} clase${created !== 1 ? 's' : ''} en Calendar ✅` : 'ya estaban en Calendar ✅') +
      (omitidos > 0 && created > 0 ? ` (+${omitidos} ya estaban)` : '') +
      (pasadas > 0 ? ` · ${pasadas} ya pasó/pasaron, no se crearon` : '');
    return `\n🗓️ ${detalle}`;
  } catch (e) {
    const razon = e instanceof Error ? e.message : String(e);
    console.error('[AGENDAR] Error agendando las clases de', id, ':', razon);
    // Esto es exactamente la falla que nadie veía: se avisa en el mismo mensaje
    // que anuncia la reserva, no en un log.
    return `\n🚨 *NO se pudieron crear sus clases en Calendar* — agéndalas a mano desde /admin/reservas.\nError: ${razon}`;
  }
}
