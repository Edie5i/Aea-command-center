import { NextRequest, NextResponse } from 'next/server';
import { lastUserMessage, reminderSent } from '@/app/webhook/route';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';
const REMINDER_24H = 24 * 60 * 60 * 1000;

const MSG_RECORDATORIO =
  'Buen día, le escribimos de Auto Escuela Americana. ¿Tiene alguna pregunta sobre nuestros cursos o servicios? Con gusto le atendemos. 🚗';

async function sendMessage(to: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  await fetch(url, {
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
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (token !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const now = Date.now();
  let enviados = 0;

  for (const [phone, lastTs] of lastUserMessage) {
    const inactivo = now - lastTs > REMINDER_24H;
    const yaEnviado = reminderSent.get(phone) ?? false;

    if (inactivo && !yaEnviado) {
      await sendMessage(phone, MSG_RECORDATORIO).catch((e) =>
        console.error('[REMINDER] Error enviando a', phone, e)
      );
      reminderSent.set(phone, true);
      enviados++;
      console.log('[REMINDER] Recordatorio enviado a', phone);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
