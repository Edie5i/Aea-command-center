import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const schoolContext = JSON.stringify({
  informacionGeneral: botContextData.informacionGeneral,
  catalogoCursos: botContextData.catalogoCursos,
  tramitesAdicionales: botContextData.tramitesAdicionales,
  metodosPago: botContextData.metodosPago,
  politicas: botContextData.politicas,
  procesoAgendar: botContextData.procesoAgendar,
  preguntasFrecuentes: botContextData.preguntasFrecuentes,
});

const SYSTEM_PROMPT = `Eres Ale, asesora de Auto Escuela Americana, una escuela de manejo en CDMX.

Tu objetivo es entender qué necesita el cliente y recomendarle el curso correcto.

Cómo hablas:
- Mensajes MUY cortos. Máximo 3 oraciones por respuesta. Estamos en WhatsApp.
- Natural y cálida, como una amiga que trabaja en la escuela.
- Haz preguntas para entender al cliente: si ya manejó antes, si tiene nerviosismo, si es menor de edad, si prefiere automático o estándar.
- No mandes listas largas ni menús. Conversa.
- Usa emojis con moderación (1 por mensaje máximo).
- Cuando recomiendas agendar, manda este link: app.autoescuelaamericana.com/agenda
- Si el cliente pregunta algo que no sabes o pide hablar con alguien: dile "Déjame ponerte en contacto con un asesor 😊" y nada más.
- Nunca digas que eres una IA. Eres Ale.
- Habla en español mexicano natural.

Usa SOLO la información del contexto de la escuela que se te proporciona. No inventes precios ni cursos.`;

const MSG_FALLBACK = 'Déjame ponerte en contacto con un asesor 😊';

const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

async function generateReply(userMessage: string): Promise<string> {
  try {
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: SYSTEM_PROMPT,
      prompt: `CONTEXTO DE LA ESCUELA:\n${schoolContext}\n\nMensaje del cliente: "${userMessage}"`,
    });
    return result.text?.trim() || MSG_FALLBACK;
  } catch (err) {
    console.error('[WEBHOOK] Gemini error:', err);
    return MSG_FALLBACK;
  }
}

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
    console.error('WhatsApp API error:', res.status, await res.text());
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  let from = '';
  let textBody = '';

  try {
    const body = await request.json();
    console.log('[WEBHOOK] POST recibido:', JSON.stringify(body).slice(0, 300));
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const msgId: string = message.id ?? '';
    from = message.from ?? '';
    textBody = message?.text?.body ?? '';

    if (!from || !textBody) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const now = Date.now();
    for (const [id, ts] of seen) {
      if (now - ts > DEDUP_TTL) seen.delete(id);
    }
    if (seen.has(msgId)) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    seen.set(msgId, now);

  } catch {
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  if (from && textBody) {
    generateReply(textBody)
      .then((reply) => sendMessage(from, reply))
      .catch((err) => console.error('[WEBHOOK] sendMessage failed:', err));
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
