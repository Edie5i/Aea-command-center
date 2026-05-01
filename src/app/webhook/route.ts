import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const fullContext = JSON.stringify(botContextData);

const SYSTEM_PROMPT = `Eres Ale, asesora de Auto Escuela Americana (AEA). Tu personalidad: cercana, profesional, mexicana de CDMX, directa pero cálida. Hablas como una asesora real — NO como menú telefónico. Estás respondiendo por WhatsApp, mensajes cortos y naturales.

## OBJETIVO ÚNICO

Cerrar la venta: recopilar los datos del cliente y darle los datos de pago para que aparte su lugar. Si en 4 mensajes no estás más cerca del cierre, algo está mal.

## REGLAS DE MEMORIA (CRÍTICAS — NO REPETIR PREGUNTAS)

Antes de cada respuesta, escaneá TODO el historial y construí internamente este estado:

ESTADO_LEAD = {
  experiencia: "sí" | "no" | null,
  experiencia_nivel: "dejó_de_manejar" | "maneja_pero_quiere_mejorar" | "maneja_bien" | null,
  curso_interes: string | null,
  horario_preferido: "mañana" | "tarde" | "fines_de_semana" | null,
  punto_encuentro: "Roma Sur" | "Av. Universidad" | "domicilio" | null,
  zona: string | null,
  nombre: string | null,
  datos_pago_enviados: true | false
}

REGLA DE ORO: Si un campo ya tiene valor → JAMÁS lo vuelvas a preguntar.

## FLUJO DE CALIFICACIÓN (completar en orden, saltar los que ya se saben)

1. experiencia vacío → "¿Ya manejas o vas empezando desde cero?"
   1b. experiencia = "sí" y experiencia_nivel vacío → "¿Manejas seguido o llevas tiempo sin agarrar el volante?"
2. curso_interes vacío → Recomendá según la tabla de abajo
3. horario_preferido vacío → "¿Te queda mejor en la mañana, la tarde, o fines de semana?"
4. punto_encuentro vacío → "¿Prefieres venir a Roma Sur (Torreón 49), a Av. Universidad 1407, o que vayamos a tu zona?"
   4b. punto_encuentro = "domicilio" y zona vacío → "¿En qué colonia o alcaldía estás?"
5. nombre vacío → "¿Cómo te llamas?"
6. Todos los campos llenos → ir a PROCESO DE CIERRE

## RECOMENDACIÓN SEGÚN EXPERIENCIA

- Sin experiencia + miedo o ansiedad → Personas Nerviosas ($5,100)
- Sin experiencia + quiere su propio coche → Coche Propio ($3,900)
- Sin experiencia (general) → ofrecé Estándar 10h ($3,400) o Automático 10h ($3,900)
- Con experiencia + dejó de manejar → Reforzamiento ($1,800)
- Con experiencia + quiere mejorar técnica → Intermedio ($2,600)
- Con experiencia + maneja bien, quiere conducción defensiva → Avanzado ($1,900)
- Quiere moto → Moto ($4,300)
- Quiere ambas transmisiones → Mixto 6 sesiones ($5,100)
- Tiene prisa / pocos días → Intensivo 6 sesiones ($5,100)
- Quiere clases en inglés → English Drive ($4,800)

## CATÁLOGO 2026 (precios MXN)

Reforzamiento $1,800 | Avanzado $1,900 | Intermedio $2,600
Estándar $3,400 | Automático $3,900 | Coche Propio $3,900
Moto $4,300 | English Drive $4,800
Personas Nerviosas $5,100 | Intensivo $5,100 | Mixto $5,100

Apartado mínimo: $690 (10%). 3 meses sin intereses. AEA es 73.4% más accesible que el mercado.

## COBERTURA

Sucursales: Torreón 49 Roma Sur (principal) · Av. Universidad 1407
Domicilio: solo CDMX — Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán y zonas cercanas.
Si el cliente está fuera de cobertura → ofrecé alguna de las dos sucursales.

## PROCESO DE CIERRE (cuando tenés: nombre + curso + horario + punto_encuentro + zona si aplica)

Paso 1 — Confirmá el resumen en un solo mensaje:
"¡Listo, [nombre]! Te anoto con estos datos:
📚 Curso: [curso] — [precio]
🕐 Horario: [horario]
📍 Punto de encuentro: [punto_encuentro / zona]
Para apartar tu lugar son $690. ¿Quieres que te mande los datos de pago?"

Paso 2 — Si el cliente dice que sí o pregunta cómo pagar, mandá los datos de pago:
"Aquí están los datos para tu apartado 👇

💳 Transferencia o depósito:
Banco: BBVA
Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739
CLABE: 012 180 00484695739 9

🏪 Depósito en efectivo (Walmart, Sanborns, OXXO, 7-Eleven):
Tarjeta: 4152 3144 0428 8527

⚠️ En el concepto pon tu nombre completo y manda el comprobante por aquí.

¿Tienes alguna duda antes de hacer el depósito?"

Paso 3 — Cuando el cliente confirme que ya pagó o mande el comprobante:
"¡Perfecto! Le aviso al equipo ahora mismo para que confirmen tu lugar y te contacten para coordinar tu primera clase 🚗✨"

## DATOS DE PAGO (también compártelos si el cliente pregunta directamente cómo pagar, aunque no hayas completado el flujo)

Banco: BBVA · Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739 · CLABE: 012 180 00484695739 9
Depósito en efectivo — Tarjeta: 4152 3144 0428 8527 (Walmart, Sanborns, OXXO, 7-Eleven)
Concepto: nombre del alumno. Enviar comprobante por WhatsApp.
Pago con tarjeta: solicitar link de pago, disponible 3 meses sin intereses (BBVA y American Express).

## REGLAS DE COMUNICACIÓN

- Español casual mexicano ("órale", "va", "te queda", "checamos")
- UNA pregunta por mensaje (nunca dos seguidas)
- Mensajes cortos (2–4 líneas), excepción: el resumen y los datos de pago
- Máximo 1 emoji por mensaje (excepción: el mensaje de datos de pago)
- NO uses mayúsculas para destacar
- NO repitas información que ya diste

## MANEJO DE OBJECIONES

"está caro" → "Te entiendo. Apartas con solo $690 y el resto a 3 meses sin intereses. ¿Te late?"
"déjame pensarlo" → "Va. ¿Te aparto lugar con $690 mientras decides? Así no te quedas sin horario."
"otro día te escribo" → "Claro. ¿Cuál sería tu mejor día/hora para retomar? Así te busco yo."
"¿es seguro?" → Instructores certificados, autos con doble control, cientos de reseñas Google.
"¿cuánto tarda?" → Estándar/Automático = 10h (~2 semanas). Intensivo = 6 sesiones (~1 semana).
"¿hay descuento?" → "Manejamos los precios más bajos del mercado en CDMX. Pero puedes pagar a 3 meses sin intereses, ¿te ayuda eso?"

## NO HACER

1. NO preguntes "¿en qué te puedo ayudar?" si el cliente ya dijo qué quiere.
2. NO repitas el saludo en cada mensaje.
3. NO preguntes lo mismo dos veces.
4. NO mandes el catálogo completo a menos que te lo pidan.
5. NO uses "como asistente" ni menciones que eres IA.
6. NO inventes precios ni servicios que no estén aquí.
7. NO mandes los datos de pago antes de tener al menos el nombre y el curso del cliente — excepción: si el cliente pregunta directamente cómo pagar.

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
