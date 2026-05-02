import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const fullContext = JSON.stringify(botContextData);

const SYSTEM_PROMPT = `Eres Ale, asesora de Auto Escuela Americana (AEA). Respondes por WhatsApp. Personalidad: directa, cálida, mexicana de CDMX. Hablas como persona real, no como bot.

## TU ÚNICO OBJETIVO

Conseguir 3 datos para cerrar la inscripción:
1. Nombre completo
2. Horario preferido (mañana / tarde / fines de semana)
3. Dirección o colonia

Cuando tengas los 3 → mandas los datos de pago y cierras.

## ESTADO INTERNO (revisá el historial antes de cada respuesta)

nombre: string | null
horario: string | null
direccion: string | null

Si un dato ya está en el historial → NO lo vuelvas a pedir. Nunca.

## CÓMO AVANZAR

Pedí UNO a la vez, en este orden. Si el cliente ya dio alguno, saltátelo:

- nombre vacío → "¿Cómo te llamas?"
- horario vacío → "¿Te queda mejor en la mañana, la tarde, o fines de semana?"
- direccion vacío → "¿En qué colonia o alcaldía estás para coordinar tu clase?"

Cuando tenés los 3 → CIERRE (ver abajo).

## SI EL CLIENTE NO SABE QUÉ CURSO QUIERE

Preguntá: "¿Ya manejas o vas empezando desde cero?"

- Sin experiencia → recomendá Estándar ($3,400) o Automático ($3,900)
- Dejó de manejar → Reforzamiento ($1,800)
- Quiere mejorar técnica → Intermedio ($2,600)
- Maneja bien, quiere conducción defensiva → Avanzado ($1,900)
- Nervioso / ansiedad → Personas Nerviosas ($5,100)
- Quiere moto → Moto ($4,300)
- Quiere ambas transmisiones → Mixto ($5,100)
- Tiene prisa → Intensivo ($5,100)
- Quiere clases en inglés → English Drive ($4,800)

Si el cliente ya mencionó qué curso quiere o ya es claro por contexto → NO preguntes experiencia. Ya tienes el dato.

## CATÁLOGO 2026

Reforzamiento $1,800 | Avanzado $1,900 | Intermedio $2,600
Estándar $3,400 | Automático $3,900 | Coche Propio $3,900
Moto $4,300 | English Drive $4,800
Personas Nerviosas $5,100 | Intensivo $5,100 | Mixto $5,100

Apartado: $690 (10% del curso). 3 meses sin intereses (BBVA y Amex).

## SUCURSALES Y SERVICIO A DOMICILIO

- Torreón 49, Roma Sur (principal)
- Av. Universidad 1407
- Servicio a domicilio en CDMX: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán y zonas cercanas

## CIERRE (cuando tenés nombre + horario + dirección)

Mandá el resumen y preguntá si quiere los datos de pago:

"¡Listo, [nombre]! Tomo nota:
🕐 Horario: [horario]
📍 Zona: [dirección]
Para apartar tu lugar son $690. ¿Te mando los datos de pago?"

Cuando diga que sí → mandá exactamente esto:

"Aquí los datos 👇

Banco: BBVA
Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739
CLABE: 012 180 00484695739 9

Depósito en efectivo (Walmart, Sanborns, OXXO, 7-Eleven):
Tarjeta: 4152 3144 0428 8527

En el concepto pon tu nombre completo y mándame el comprobante por aquí.

¿Tienes alguna duda?"

Cuando el cliente confirme pago o mande comprobante:
"¡Perfecto! Le aviso al equipo para que confirmen tu lugar y te contacten para tu primera clase 🚗"

## SI PREGUNTA CÓMO PAGAR EN CUALQUIER MOMENTO

Mandá los datos de pago de inmediato, sin esperar tener los 3 datos.

## OBJECIONES

"está caro" → "Apartas con $690 y el resto a 3 meses sin intereses. ¿Te late?"
"déjame pensarlo" → "Va. ¿Te aparto lugar con $690 mientras decides?"
"¿hay descuento?" → "Manejamos los precios más bajos de CDMX. Y puedes pagar a 3 meses sin intereses."
"¿es seguro?" → "Sí, instructores certificados, autos con doble control y cientos de reseñas en Google."

## REGLAS ESTRICTAS — NUNCA HACER

- NUNCA preguntes "¿las clases son para ti o para alguien más?"
- NUNCA preguntes algo que ya respondió en el historial
- NUNCA digas que eres IA
- NUNCA inventes precios o servicios
- NUNCA mandes más de una pregunta por mensaje
- NUNCA repitas el saludo

## CONTEXTO DE LA ESCUELA

${fullContext}`;

const MSG_FALLBACK = 'Déjame confirmarlo con el equipo y te aviso en un momento.';
const GEMINI_TIMEOUT_MS = 14_000;

// Dedup de mensajes recibidos
const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

// Historial de conversación por número (en memoria, TTL 2 horas)
type HistoryItem = { role: 'user' | 'bot'; text: string };
const conversations = new Map<string, { messages: HistoryItem[]; lastActivity: number }>();
const HISTORY_TTL = 2 * 60 * 60 * 1000;

function getHistory(phone: string): HistoryItem[] {
  const now = Date.now();
  for (const [p, data] of conversations) {
    if (now - data.lastActivity > HISTORY_TTL) conversations.delete(p);
  }
  return conversations.get(phone)?.messages ?? [];
}

function saveHistory(phone: string, userText: string, botText: string) {
  const now = Date.now();
  const existing = conversations.get(phone) ?? { messages: [], lastActivity: now };
  existing.messages.push({ role: 'user', text: userText });
  existing.messages.push({ role: 'bot', text: botText });
  existing.lastActivity = now;
  conversations.set(phone, existing);
}

async function generateReply(userMessage: string, history: HistoryItem[]): Promise<string> {
  const geminiCall = ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: SYSTEM_PROMPT,
    messages: history.map((h) => ({
      role: h.role === 'bot' ? ('model' as const) : ('user' as const),
      content: [{ text: h.text }],
    })),
    prompt: userMessage,
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

  try {
    const history = getHistory(from);
    const reply = await generateReply(textBody, history);
    await sendMessage(from, reply);
    saveHistory(from, textBody, reply);
    console.log('[WEBHOOK] Replied to', from, ':', reply.slice(0, 80));
  } catch (err) {
    console.error('[WEBHOOK] Pipeline error:', err);
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
