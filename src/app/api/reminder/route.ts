import { NextRequest, NextResponse } from 'next/server';
import { getPendingReminders, markReminderSent } from '@/lib/firestore';

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

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (token !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let enviados = 0;

  // Recordatorio 1h
  const pending1h = await getPendingReminders('1h');
  for (const conv of pending1h) {
    await sendMessage(conv.phone, MSG_1H).catch((e) =>
      console.error('[REMINDER] Error 1h a', conv.phone, e)
    );
    await markReminderSent(conv.phone, '1h');
    enviados++;
    console.log('[REMINDER] 1h enviado a', conv.phone);
  }

  // Recordatorio 23h
  const pending23h = await getPendingReminders('23h');
  for (const conv of pending23h) {
    await sendMessage(conv.phone, MSG_23H).catch((e) =>
      console.error('[REMINDER] Error 23h a', conv.phone, e)
    );
    await markReminderSent(conv.phone, '23h');
    enviados++;
    console.log('[REMINDER] 23h enviado a', conv.phone);
  }

  return NextResponse.json({ ok: true, enviados });
}
