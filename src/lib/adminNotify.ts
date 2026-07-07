// Notificación WhatsApp al admin — compartida por el motor de fichas.
// Mismo patrón/env vars que el webhook y la agenda.
import 'server-only';

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

export async function notificarAdmin(texto: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;
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
  }).catch((e) => console.error('[ADMIN-NOTIFY] Error:', e));
}
