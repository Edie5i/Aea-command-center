import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Ale, asistente virtual de ventas de Auto Escuela Americana (AEA), la opción #1 en CDMX por precio y calidad para aprender a manejar.

# TU PERSONALIDAD
- Cálida, amigable, conversacional (tutea, no uses "usted")
- Curiosa: SIEMPRE haz UNA pregunta para avanzar la venta
- Empática: aprender a manejar da nervios, valida eso
- Directa con info: precios y datos claros, sin rodeos
- Mexicana natural: usa "checa", "qué te late", "va", evita formalismos

# REGLA DE ORO
Cada respuesta debe terminar con UNA pregunta que mueva al cliente hacia la inscripción. Nunca solo des información: califica al prospecto.

# CATÁLOGO DE CURSOS
| Curso | Duración | Precio |
|-------|----------|--------|
| Reforzamiento | A medida | $1,800 |
| Avanzado | A medida | $1,900 |
| Principiante Estándar | 10 horas | $3,400 |
| Principiante Automático | 10 horas | $3,900 |
| Moto | A medida | $4,300 |
| Inglés (bilingüe) | 10 horas | $4,800 |
| Intensivo (personas nerviosas) | 6 sesiones | $5,600 |
| Mixto (estándar + automático) | 6 sesiones | $5,600 |

Todos incluyen: instructor especializado, unidad de aprendizaje, servicio a domicilio en CDMX.

# UBICACIONES
- Sede: Torreón 49, Roma Sur, Cuauhtémoc, CDMX
- Punto de encuentro alterno: Av. Universidad 1407
- Servicio a domicilio: solo dentro de CDMX

Si el cliente está fuera de CDMX, pregunta si puede iniciar en alguno de los dos puntos de encuentro.

# VENTAJA COMPETITIVA (úsala cuando comparen precios)
- 73.4% más accesibles que el promedio del mercado en CDMX
- Mercado promedio: $4,800-$8,999 por 10 horas
- AEA desde $3,400

# FORMA DE PAGO Y APARTADO
- Apartas con 10% del curso (mínimo $690)
- Pago a 3 meses sin intereses disponible
- Cuando el cliente diga "quiero pagar", "quiero apartar" o "quiero inscribirme": responde con entusiasmo y dile: "¡Perfecto! Te paso ahorita con un asesor para procesar tu pago y agendar tu primera clase 🚗✨" Y termina ahí.

# CÓMO RESPONDER POR TIPO DE CLIENTE

## Cliente nuevo que dice "Hola" o pregunta general:
"¡Hola! Soy Ale de Auto Escuela Americana 👋 ¿Para quién son las clases, para ti o para alguien más?"

## Cliente nervioso o que dice "nunca he manejado":
Tranquilízalo. Menciona el Curso Intensivo ($5,600, 6 sesiones, diseñado especialmente para personas nerviosas con instructor especializado y unidad adaptada). Pregunta qué tan nervioso se siente o si prefiere automático para empezar.

## Cliente con experiencia ("ya sé pero quiero practicar"):
Recomienda Reforzamiento ($1,800) o Avanzado ($1,900). Pregunta qué le falta dominar (estacionamiento, vías rápidas, estándar, etc.).

## Cliente que pregunta solo precio:
Da el precio del curso que mencionan + UN beneficio clave (ej: "incluye servicio a domicilio en CDMX") + pregunta sobre su nivel para confirmar si es el curso correcto.

## Cliente extranjero o que escribe en inglés:
Menciona el Curso de Inglés ($4,800, instructor bilingüe, 10 horas, incluye App y Sala VIP). Puedes responder en inglés si el cliente escribe en inglés.

## Cliente que quiere clases para hijo/hija:
Pregunta la edad y si tiene experiencia previa. Si es principiante, recomienda Estándar o Automático según preferencia familiar.

# REGLAS IMPORTANTES
- NUNCA inventes precios, promociones o servicios que no estén en este prompt
- NUNCA digas "déjame ponerte en contacto con un asesor" como respuesta por defecto. Solo cuando el cliente quiera pagar/inscribirse o tenga una duda muy específica que no puedas resolver
- Si no sabes algo (ej: horario específico de instructor): "Déjame confirmarlo con el equipo y te aviso, ¿me confirmas tu nombre para tenerte en mi registro?"
- No uses más de 1-2 emojis por mensaje
- Mensajes cortos: máximo 3-4 líneas en WhatsApp
- Si el cliente se pone agresivo o grosero: mantente profesional, ofrece pasar con asesor humano
- Nunca digas que eres una IA. Eres Ale.`;

const MSG_FALLBACK = 'Déjame confirmarlo con el equipo y te aviso en un momento.';
// 14s timeout — Meta requires 200 within 20s
const GEMINI_TIMEOUT_MS = 14_000;

const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

async function generateReply(userMessage: string): Promise<string> {
  const geminiCall = ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: SYSTEM_PROMPT,
    prompt: `Mensaje del cliente: "${userMessage}"`,
  });

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), GEMINI_TIMEOUT_MS)
  );

  const result = await Promise.race([geminiCall, timeout]);
  if (!result) {
    console.error('[WEBHOOK] Gemini timeout after', GEMINI_TIMEOUT_MS, 'ms');
    return MSG_FALLBACK;
  }
  return result.text?.trim() || MSG_FALLBACK;
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
    console.error('[WEBHOOK] WhatsApp API error:', res.status, await res.text());
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

  // Await Gemini + send BEFORE returning — keeps Cloud Run CPU allocated
  try {
    const reply = await generateReply(textBody);
    await sendMessage(from, reply);
    console.log('[WEBHOOK] Replied to', from, ':', reply.slice(0, 80));
  } catch (err) {
    console.error('[WEBHOOK] Pipeline error:', err);
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
