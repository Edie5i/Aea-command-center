// Notificación WhatsApp al admin — compartida por el motor de fichas.
// Mismo patrón/env vars que el webhook y la agenda.
import 'server-only';

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const urlMensajes = () => `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;

// Plantilla aprobada por Meta: se entrega sin importar la ventana de 24h.
async function enviarPlantilla(tipo: string, contacto: string): Promise<void> {
  const res = await fetch(urlMensajes(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: ADMIN_PHONE,
      type: 'template',
      template: {
        name: 'alerta_aea',
        language: { code: 'es_MX' },
        components: [
          { type: 'body', parameters: [tipo, contacto].map((t) => ({ type: 'text', text: t })) },
        ],
      },
    }),
  }).catch((e) => {
    console.error('[ADMIN-NOTIFY] Error de red en plantilla:', e);
    return null;
  });

  if (!res) return;
  if (!res.ok) {
    console.error('[ADMIN-NOTIFY] Plantilla falló:', res.status, await res.text());
    return;
  }
  console.log('[ADMIN-NOTIFY] 📨 Entregado por plantilla');
}

export async function notificarAdmin(texto: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;

  const res = await fetch(urlMensajes(), {
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
  }).catch((e) => {
    console.error('[ADMIN-NOTIFY] Error de red:', e);
    return null;
  });

  if (!res) return;
  if (res.ok) return;

  // fetch NO lanza con un 400, así que sin este chequeo el rechazo de Meta
  // (típicamente ventana de 24h cerrada, #131047) se descartaba en silencio y
  // el admin nunca se enteraba de la ficha. Misma red de seguridad que el webhook.
  console.error('[ADMIN-NOTIFY] WhatsApp API error:', res.status, await res.text());

  // La plantilla admite 2 parámetros y no acepta saltos de línea: se manda la
  // primera línea como resumen y el teléfono que venga en el texto.
  const tipo =
    (texto.split('\n')[0] || '')
      .replace(/[*_~`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'Alerta AEA';
  const phoneMatch = texto.match(/\+?\d[\d\s]{8,}\d/);
  const contacto = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : 'N/D';

  await enviarPlantilla(tipo, contacto);
}
