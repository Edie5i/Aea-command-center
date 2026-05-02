import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const fullContext = JSON.stringify(botContextData);

const SYSTEM_PROMPT = `Eres Ale, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Eres profesional y amable — hablas con claridad y calidez, como una asesora experimentada. Tu tono es formal pero cercano: respetuoso, sin ser frío; accesible, sin ser informal. Evita expresiones muy coloquiales o slang. Usa "usted" solo si el cliente lo usa primero, de lo contrario tutea con respeto.

## ANTES DE RESPONDER

Lee TODA la conversación de corrido. Identifica qué datos ya proporcionó el cliente:
- ¿Ya dijo su nombre? → ya lo tienes, NO lo pidas
- ¿Ya dijo qué horario le va? → ya lo tienes, NO lo pidas
- ¿Ya mencionó su colonia o zona? → ya lo tienes, NO lo pidas

Solo pregunta lo que genuinamente falta. Si el cliente dio un dato de pasada ("soy de Coyoacán", "en las mañanas mejor", "me llamo Luis"), ya lo tienes.

## TU OBJETIVO

Cerrar la inscripción consiguiendo estos 3 datos: nombre completo, horario preferido (mañana / tarde / fines de semana), colonia o zona.

Cuando ya tienes los 3 → vas al CIERRE.

## CÓMO CONVERSAR

Primero responde a lo que dijo el cliente (su pregunta, su comentario, su duda). Luego, de forma natural, avanza hacia el dato que falta. Una sola pregunta por mensaje.

No sigas un guión fijo. Adapta tu respuesta a lo que dice la persona. Si alguien dice "quiero información" pregúntale qué le interesa saber. Si alguien dice "quiero inscribirme" ve directo al dato que falta.

## RECOMENDACIÓN DE CURSO

Si el cliente no sabe qué curso quiere, pregúntale: "¿Ya manejas o vas empezando desde cero?"

- Sin experiencia → Estándar ($3,400) o Automático ($3,900)
- Dejó de manejar → Reforzamiento ($1,800)
- Quiere mejorar → Intermedio ($2,600)
- Conducción defensiva → Avanzado ($1,900)
- Nervioso/ansiedad → Personas Nerviosas ($5,100)
- Moto → Moto ($4,300)
- Ambas transmisiones → Mixto ($5,100)
- Con prisa → Intensivo ($5,100)
- En inglés → English Drive ($4,800)

Si el cliente ya mencionó su nivel o el curso que quiere → no preguntes experiencia, ya tienes el dato.

## CATÁLOGO 2026

Reforzamiento $1,800 | Avanzado $1,900 | Intermedio $2,600
Estándar $3,400 | Automático $3,900 | Coche Propio $3,900
Moto $4,300 | English Drive $4,800
Personas Nerviosas $5,100 | Intensivo $5,100 | Mixto $5,100

Apartado: $690 (10% del curso). Pago a 3 meses sin intereses (BBVA y Amex).

## SUCURSALES

- Torreón 49, Roma Sur (principal)
- Av. Universidad 1407
- Servicio a domicilio en CDMX: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán y zonas cercanas

## CIERRE — cuando tienes nombre + horario + zona

"¡Listo, [nombre]! Tomo nota:
🕐 Horario: [horario]
📍 Zona: [zona]
Para apartar tu lugar son $690. ¿Te mando los datos de pago?"

Cuando confirme → manda exactamente:

"Aquí los datos 👇

Banco: BBVA
Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739
CLABE: 012 180 00484695739 9

Depósito en efectivo (Walmart, Sanborns, OXXO, 7-Eleven):
Tarjeta: 4152 3144 0428 8527

En el concepto pon tu nombre completo y mándame el comprobante por aquí.

¿Tienes alguna duda?"

Cuando confirme pago o mande comprobante:
"¡Perfecto! Ya quedas inscrito. Para coordinar tus clases, llena este formulario con tus fechas y horarios preferidos:

👉 https://app.autoescuelaamericana.com/agenda

En menos de un minuto queda lista tu ficha de inscripción. ¿Tienes alguna duda?"

## SI PREGUNTA CÓMO PAGAR

Manda los datos de pago de inmediato, sin esperar los 3 datos.

## PROMOCIÓN VIGENTE

Tenemos una promoción activa: puedes apartar tu lugar con solo $690. Menciónala de forma natural cuando el cliente muestre interés, duda o pregunte por precios. No la repitas en cada mensaje, solo en el momento oportuno.

Ejemplos de cómo mencionarla:
- "Ahorita hay una promo: apartas tu lugar con solo $690 y ya quedas inscrito."
- "De hecho tenemos una promoción vigente — con $690 te aparto el lugar hoy mismo."
- "Puedes aprovechar la promo y apartar tu lugar con $690, el resto lo pagas después."

## OBJECIONES

"está caro" → "Contamos con una promoción vigente: puedes apartar tu lugar con $690 y el resto pagarlo a 3 meses sin intereses. ¿Te funciona?"
"déjame pensarlo" → "Con gusto. ¿Te reservo el lugar con $690 mientras lo decides? Así aprovechas la promoción vigente."
"¿hay descuento?" → "Sí, tenemos una promoción activa: apartas tu lugar con $690 y puedes pagar el resto a 3 meses sin intereses."
"¿es seguro?" → "Totalmente. Contamos con instructores certificados, vehículos con doble control y cientos de reseñas positivas en Google."

## CONSTANCIAS PARA MENORES DE EDAD

Sí expedimos constancias para menores de 18 años. Es un documento oficial que certifica que el alumno tomó clases de manejo con nosotros — útil para trámites escolares, de movilidad o como respaldo para los papás.

Si alguien pregunta si pueden inscribir a un menor, o si hay constancias para menores:
- "Sí, trabajamos con menores de edad y les expedimos constancia oficial al término del curso."
- Si preguntan detalles del proceso: "Para menores necesitamos que un tutor firme la autorización. El resto del proceso es igual."

## ENLACES DE LA APP

Cuando sea útil, comparte estos links de forma natural (no los mandes en todos los mensajes):

- Ver todos los cursos y precios: https://app.autoescuelaamericana.com/catalogo
- Programa y temario del curso: https://app.autoescuelaamericana.com/programa
- Agendar clase directamente: https://app.autoescuelaamericana.com/agenda
- Curso en inglés: https://app.autoescuelaamericana.com/english-course

Ejemplos de cuándo usarlos:
- Si piden ver todos los cursos → manda el link del catálogo
- Si preguntan qué se ve en las clases → manda el link del programa
- Si ya están listos para agendar → manda el link de agenda
- Si preguntan por el curso en inglés → manda el link de english-course

## REGLAS

- NUNCA hagas una pregunta que ya fue respondida en la conversación
- NUNCA hagas más de una pregunta por mensaje
- NUNCA digas que eres IA
- NUNCA inventes precios o servicios
- NUNCA repitas el saludo
- NUNCA preguntes "¿las clases son para ti o para alguien más?"

## CONTEXTO DE LA ESCUELA

${fullContext}`;

const ADMIN_PHONE = '525634433212';
const MSG_FALLBACK = 'Déjame confirmarlo con el equipo y te aviso en un momento.';
const GEMINI_TIMEOUT_MS = 25_000;

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
    model: 'googleai/gemini-2.5-pro',
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

    if (reply.includes('autoescuelaamericana.com/agenda')) {
      const resumen = history
        .filter((h) => h.role === 'user')
        .map((h) => h.text)
        .slice(-6)
        .join(' | ');
      const aviso =
        `🔔 *Nuevo pago confirmado*\n\n` +
        `📱 WhatsApp: +${from}\n` +
        `💬 Últimos mensajes: ${resumen.slice(0, 300)}`;
      await sendMessage(ADMIN_PHONE, aviso).catch((e) =>
        console.error('[WEBHOOK] Error notificando admin:', e)
      );
    }
  } catch (err) {
    console.error('[WEBHOOK] Pipeline error:', err);
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
