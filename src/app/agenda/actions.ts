'use server';

import { scheduleAndCreateEvents, type CreateEventInput } from '@/ai/flows/create-calendar-event';
import { saveInscripcionData } from '@/lib/firestore';
import { guardarFicha } from '@/lib/fichaLuz';

// Precios del catálogo 2026 (fuente: catálogo oficial AEA en bot-data)
const PRECIO_CURSO: Record<string, number> = {
  'Estándar': 3400,
  'Automático': 3900,
};

function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

async function notifyAdmin(input: CreateEventInput): Promise<void> {
  const fechas = input.dates
    .map((d) => {
      const fecha = new Date(d.date).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City',
      });
      const hora = d.time ?? 'sin hora';
      return `• ${fecha} a las ${hora}`;
    })
    .join('\n');

  const texto =
    `📋 *Nueva ficha de inscripción*\n\n` +
    `👤 *Nombre:* ${input.name}\n` +
    `📱 *Teléfono:* ${input.phone}\n` +
    `📍 *Punto de encuentro:* ${input.address}\n` +
    `🚗 *Transmisión:* ${input.transmission}\n` +
    (input.isMinor ? `👶 *Modalidad:* Menor de edad\n` : '') +
    (input.notes ? `📝 *Notas:* ${input.notes}\n` : '') +
    `\n📅 *Fechas solicitadas:*\n${fechas}`;

  // Se delega en @/lib/adminNotify: revisa la respuesta de Meta y cae a
  // plantilla fuera de la ventana de 24h. Antes sólo capturaba errores de red,
  // así que las fichas de la web se perdían igual que las de Luz.
  const { notificarAdmin } = await import('@/lib/adminNotify');
  await notificarAdmin(texto);
}

export async function createCalendarEventsAction(input: CreateEventInput): Promise<{ success: boolean; message: string | null; error: string | null; }> {
  try {
    const result = await scheduleAndCreateEvents(input);
    notifyAdmin(input);

    const phone = normalizePhone(input.phone);
    const fechas = input.dates
      .filter(d => !!d.time)
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
        time: d.time!,
      }));
    saveInscripcionData(phone, {
      nombre: input.name,
      telefono: phone,
      zona: input.address,
      curso: input.transmission ?? 'Estándar',
      transmision: input.transmission ?? 'Estándar',
      fechas,
    }).catch(e => console.error('[AGENDA] Error guardando inscripcion en Firestore:', e));

    // Ficha única (web + Luz): el panel las ve todas
    const curso = input.transmission ?? 'Estándar';
    guardarFicha(
      phone,
      {
        studentName: input.name,
        curso,
        precio: PRECIO_CURSO[curso] ?? 0, // TODO: dato pendiente si llega un curso fuera del mapa
        opcionesFechaHora: fechas.map(f => `${f.date} ${f.time}`),
        zona: input.address,
        // linkCierre arma wa.me/52{telefono} → se guarda a 10 dígitos
        telefono: phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone,
      },
      'web'
    ).catch(e => console.error('[AGENDA] Error guardando ficha:', e));

    return { success: true, message: result.message, error: null };
  } catch (error) {
    console.error('Error in createCalendarEventsAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while creating calendar events.';
    return { success: false, message: null, error: errorMessage };
  }
}
