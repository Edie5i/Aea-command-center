'use server';

import { scheduleAndCreateEvents, type CreateEventInput } from '@/ai/flows/create-calendar-event';
import { saveInscripcionData } from '@/lib/firestore';

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

async function notifyAdmin(input: CreateEventInput): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;

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

  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: ADMIN_PHONE,
      type: 'text',
      text: { body: texto },
    }),
  }).catch((e) => console.error('[AGENDA] Error notificando admin:', e));
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

    return { success: true, message: result.message, error: null };
  } catch (error) {
    console.error('Error in createCalendarEventsAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while creating calendar events.';
    return { success: false, message: null, error: errorMessage };
  }
}
