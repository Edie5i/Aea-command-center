import { NextRequest, NextResponse } from 'next/server';
import { getPendingReminders, markReminderSent, motivoNoEsProspecto, type Conversation } from '@/lib/firestore';
import { EXPLICACION, yaPago } from '@/lib/ventas-excluidos';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const MSG_1H =
  '¡Hola! Solo quería asegurarme de que recibiste mi mensaje 😊 ¿Te gustaría continuar con el proceso? Con gusto te ayudo.';

const MSG_23H =
  '¡Hola! Por aquí Luz, de Auto Escuela Americana 👋 ¿Sigues pensando en tomar clases de manejo? Todavía puedes apartar tu lugar con la promo vigente. ¿Te ayudo?';

async function sendMessage(to: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    console.error('[REMINDER] WhatsApp error:', res.status, await res.text());
  }
}

/**
 * Manda el recordatorio solo si quien lo recibiría es de verdad un prospecto.
 *
 * Aquí caían candidatos a instructor, instructores de Vía Urb y el propio
 * teléfono de la escuela: todos aparecen en `conversations` por el simple
 * hecho de haber escrito, y la consulta solo miraba la hora. La bandera se
 * marca igual aunque no se mande, para que el excluido no vuelva a salir
 * elegido en cada corrida.
 */
async function recordar(
  conv: Conversation,
  texto: string,
  tipo: '1h' | '23h'
): Promise<boolean> {
  const phone = conv.phone;

  // Ya pagó: el recordatorio le preguntaría si sigue pensando en tomar clases
  // a alguien que ya las compró. El cron de seguimiento siempre lo comprobó;
  // este job, nunca.
  if (yaPago(conv)) {
    await markReminderSent(phone, tipo);
    console.log(`[REMINDER] ${tipo} omitido a ${phone}: ya pagó`);
    return false;
  }

  const motivo = await motivoNoEsProspecto(phone).catch(() => null);
  if (motivo) {
    await markReminderSent(phone, tipo);
    console.log(`[REMINDER] ${tipo} omitido a ${phone}: ${EXPLICACION[motivo]}`);
    return false;
  }

  await sendMessage(phone, texto).catch((e) =>
    console.error(`[REMINDER] Error ${tipo} a`, phone, e)
  );
  await markReminderSent(phone, tipo);
  console.log(`[REMINDER] ${tipo} enviado a`, phone);
  return true;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (token !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let enviados = 0;
  let omitidos = 0;

  // Recordatorio 1h
  for (const conv of await getPendingReminders('1h')) {
    if (await recordar(conv, MSG_1H, '1h')) enviados++;
    else omitidos++;
  }

  // Recordatorio 23h
  for (const conv of await getPendingReminders('23h')) {
    if (await recordar(conv, MSG_23H, '23h')) enviados++;
    else omitidos++;
  }

  return NextResponse.json({ ok: true, enviados, omitidos });
}
