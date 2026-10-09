/**
 * Lo que pasa con la conversación cuando una ficha queda reservada.
 *
 * Cerrar la venta y decirle al alumno "ya quedaste" lo hacía el webhook con
 * sólo recibir una imagen, antes de que nadie mirara el depósito. Ahora las
 * clases se crean al confirmarse el apartado (ver agendar-ficha.ts), y esto es
 * la otra mitad de ese mismo momento: la conversación pasa a inscrito y el
 * alumno recibe su confirmación.
 *
 * Vive aparte de fichaLuz.ts para que la ficha no arrastre la conversación a
 * sus pruebas.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { db, updateChatState, saveBotMessage } from './firestore';
import type { Ficha } from './ficha-reglas';

export async function alReservarse(id: string, prev: Ficha | null, ficha: Ficha): Promise<void> {
  const fechas = (ficha.opcionesFechaHora ?? [])
    .map((slot) => {
      const [date, time] = slot.split(' ');
      return { date, time: time ?? '' };
    })
    .filter((f) => f.date);

  // Una ficha de mostrador o de la web puede no tener conversación: no se le
  // inventa una sólo para cerrarla.
  const ref = db.collection('conversations').doc(id);
  const conv = await ref.get();
  if (conv.exists) {
    const anterior = conv.data()?.inscripcion ?? {};
    await ref.set(
      {
        inscripcion: {
          // La transmisión sólo la trae la pre-reserva de Luz; la ficha no.
          transmision: ficha.curso,
          ...anterior,
          nombre: ficha.studentName,
          telefono: id,
          zona: ficha.zona ?? anterior.zona ?? '',
          curso: ficha.curso,
          fechas,
          status: 'confirmado',
          fechaConfirmacion: Timestamp.now(),
        },
      },
      { merge: true }
    );
    await updateChatState(
      id,
      {
        chatState: 'cerrado',
        chatReason: 'Apartado confirmado',
        chatUrgency: 'ninguna',
        closedAt: Timestamp.now(),
        closedOutcome: 'ganado',
        nextFollowupAt: null,
      },
      'manual'
    );
  }

  // Sólo a quien ya tenía ficha y estaba esperando: una ficha que nace pagada
  // en mostrador recibe su enlace por guardarFicha, y con eso basta.
  if (!prev) return;
  const { avisarApartadoConfirmado } = await import('./ficha-enlace');
  const texto = await avisarApartadoConfirmado({
    nombre: ficha.studentName,
    telefono: id,
    zona: ficha.zona ?? '',
    curso: ficha.curso,
    fechas,
  });
  if (texto && conv.exists) await saveBotMessage(id, texto);
}
