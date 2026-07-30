// Notificación WhatsApp al admin — compartida por el motor de fichas.
// Mismo patrón/env vars que el webhook y la agenda.
import 'server-only';
import { resumenParaPlantilla } from '@/lib/notify-format';

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

async function enviarTexto(texto: string): Promise<void> {
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
  // fetch NO lanza con un 400. Ojo: un 200 tampoco garantiza entrega —Meta puede
  // descartar el mensaje después—; eso sólo se ve en los callbacks [WA-STATUS].
  if (!res.ok) {
    console.error('[ADMIN-NOTIFY] WhatsApp API error:', res.status, await res.text());
  }
}

/**
 * Avisa al admin por dos vías a la vez: texto libre (completo, legible) y
 * plantilla (resumida pero garantizada).
 *
 * La plantilla NO es un respaldo condicional: va siempre. Con la ventana de 24h
 * cerrada Meta acepta el texto con un 200 y lo descarta después, así que no hay
 * ningún error que detectar en el momento del envío — reaccionar al fallo no
 * funciona. Es el mismo patrón de "mirror garantizado" que el webhook usa desde
 * 7c930ed para las ventas cerradas.
 *
 * El costo es un mensaje extra cuando la ventana está abierta. Perder un aviso
 * de depósito o de dirección cuesta más.
 */
export async function notificarAdmin(texto: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;

  const { tipo, contacto } = resumenParaPlantilla(texto);

  await Promise.allSettled([enviarTexto(texto), enviarPlantilla(tipo, contacto)]);
}
