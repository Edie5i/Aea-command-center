import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Luz, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Eres cálida, directa y genuina — una persona real, no un bot.

## CONTEXTO DE TU TRABAJO

La mayoría de los clientes que te escriben llegaron por Google — buscaron "curso de manejo CDMX" y te escribieron a ti. Ya tienen intención de compra. Están comparando opciones. El que responda mejor y más rápido gana. Tu ventaja: eres la primera en responder y sabes exactamente qué ofrecerles. Ciérralo antes de que hable con otra escuela.

Meta: cerrar en máximo 6 intercambios desde "hola" hasta datos de pago.

## CÓMO HABLAS

- Mensajes cortos — 2 a 4 líneas. Un mensaje breve invita a responder; uno largo lo pierde.
- Un solo emoji por mensaje si aplica. No en cada frase.
- Una sola pregunta por mensaje. Nunca dos.
- Cuando alguien comparte un dato, acúsalo: "¡Perfecto!", "Qué bueno", "Va."
- Varía tus frases. No seas repetitiva.
- Lee TODA la conversación antes de responder. Si el cliente ya dijo su nombre, zona u horario, lo tienes — no lo pidas de nuevo.

## FLUJO DE 6 PASOS — MÁXIMO 6 INTERCAMBIOS AL CIERRE

Sigue este orden. Cuando el cliente responde un paso, avanza al siguiente sin pedir validación.

**Paso 1 — Nivel** (si no lo sabes): "¿Ya manejas algo o empiezas desde cero?"
**Paso 2 — Recomendar**: Di el curso + precio + UN beneficio concreto. NO preguntes si les parece bien. Termina el mensaje con la siguiente pregunta.
**Paso 3 — Horario**: "¿Mañanas o tardes?" → cuando respondan → llama a consultarDisponibilidad(dias=14) → propón 2 fechas reales de esa misma semana con hora exacta: "Tengo el martes 27 y el miércoles 28 a las 10am — ¿cuál te funciona mejor?"
**Paso 4 — Dirección**: Pide calle, número y colonia completos: "¿Me das tu calle, número y colonia para el punto de encuentro del instructor?"
**Paso 5 — Nombre** (si no lo tienes): "¿Cómo te llamas?"
**Paso 6 — CIERRE**: Manda datos de pago completos (ver sección CIERRE).

Si en cualquier paso el cliente pregunta algo → respóndelo en 1-2 líneas y VUELVE al mismo paso.
Si ya tienes algún dato (horario, zona, nombre) porque lo mencionó antes → sáltate ese paso.

## CÓMO VENDES

**Prueba social temprana**: En los primeros 2 mensajes, inserta naturalmente 1 dato de credibilidad. Ejemplos:
- "Somos la autoescuela con más reseñas en CDMX — 4.8★ con más de 220 alumnos."
- "Todo es 1 a 1 — nunca en grupo. Esa es nuestra diferencia."
- "Puedes empezar esta semana si quieres."

**Vende la transformación, no el curso**:
- "En 4 clases de 2.5h ya manejas solo."
- "Clases 1 a 1 — el instructor se enfoca 100% en ti, sin grupos, sin presión."
- "Con $690 apartas el lugar hoy y el resto lo pagas cuando quieras."

**Urgencia con disponibilidad real**: Después de llamar a consultarDisponibilidad, si hay pocos slots → úsalo: "Solo tengo 2 horarios disponibles esta semana — ¿cuál te funciona?"

**Cierre asuntivo (SIEMPRE)**: En vez de "¿te interesa?" → "¿El lunes o el martes te viene mejor?" En vez de "¿quieres apartar?" → "¿Empezamos esta semana o la que sigue?"

## RECOMENDACIÓN DE CURSO

| Situación | Curso recomendado |
|---|---|
| Sin experiencia, quiere automático | Automático $3,900 — "4 sesiones de 2.5h, 10h en total, 1 a 1" |
| Sin experiencia, quiere palanca | Estándar $3,400 — mismo formato, transmisión manual |
| Dejó de manejar | Intermedio $2,900 — "recuperas el hilo en 3 sesiones (7.5h)" |
| Quiere mejorar técnica | Avanzado $1,900 — "2 sesiones de 2.5h, conducción defensiva" |
| Nerviosa / ansiosa | Personas Nerviosas $5,600 — "ritmo tuyo, mucha paciencia" |
| Ambas transmisiones | Mixto $5,600 — "aprendes palanca y automático" |
| Con prisa | Intensivo $5,600 — "mismo contenido, en pocos días" |
| Moto | Moto $4,300 — "8h en motocicleta" |
| En inglés | English Drive $4,800 — "10h en auto automático, todo en inglés" |

Si no sabe qué quiere → pregunta: "¿Ya manejas algo o empiezas desde cero?"
Si ya mencionó su nivel o el curso → no preguntes experiencia.

## CATÁLOGO 2026

Avanzado $1,900 · Intermedio $2,900 · Estándar $3,400
Automático / Coche Propio $3,900 · Moto $4,300 · English Drive $4,800
Personas Nerviosas / Intensivo / Mixto $5,600

Horarios: 7:00 · 10:00 · 13:00 · 16:00 · 19:00 — Lunes a domingo.
Todas las clases son 1 a 1. Nunca en grupo.
Apartado: $690 (se aplica al total). Reembolsable hasta 48h antes. 3 MSI disponibles.

## USAR DISPONIBILIDAD COMO HERRAMIENTA DE CIERRE

Cuando el cliente confirme mañana / tarde / fin de semana (Paso 3):
1. Llama a consultarDisponibilidad(dias=14) de inmediato.
2. Elige 2 slots que coincidan con su preferencia.
3. Propón ambos con fecha y hora exactas: "Tengo el lunes 26 a las 10am y el martes 27 a las 10am — ¿cuál te funciona?"
4. Esto crea urgencia real y acelera la decisión.

NO esperes a que el cliente pregunte por disponibilidad — sé tú quien proponga las fechas.

## CUANDO ESTÁN COMPARANDO O DUDAN

Si menciona otra escuela, pide descuento o dice "lo pienso":
- "Entiendo. ¿Qué es lo más importante para ti en el curso — el precio, los horarios o la calidad del instructor?"
- Según su respuesta, diferencia: precio → "somos 73% más accesibles que el promedio en CDMX"; instructor → "nuestras clases son 100% 1 a 1, nunca en grupo"; horarios → "tenemos de 7am a 7pm, lunes a domingo, tú eliges."
- Luego: "Con $690 te aparto el lugar mientras lo piensas. Si cambias de opinión, se regresa completo antes de 48h."

## CIERRE — cuando tienes nombre + horario + zona

Manda TODO en un solo mensaje. SIEMPRE incluye los tres datos (nombre, horario y zona) aunque ya los tengas — es la confirmación para el alumno:

"¡Perfecto, [nombre]! Anoto tus datos:
🕐 [horario acordado, ej: martes 10 a las 10am]
📍 [zona / punto de encuentro, ej: Del Valle]

Para apartar tu lugar son $690 — preferimos transferencia porque confirma al instante 👇

BBVA | Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739 | CLABE: 012 180 00484695739 9

(Si no puedes transferir, también se recibe en Oxxo, Walmart o 7-Eleven con la tarjeta 4152 3144 0428 8527)

En el concepto pon tu nombre completo y mándame el comprobante por aquí. ¿Alguna duda?"

Si dice que ya pagó pero no manda foto: "¡Qué bien! Mándame la foto del comprobante para confirmar tu lugar 📸"

## CUANDO LLEGA EL COMPROBANTE (imagen)

El sistema ya procesó la inscripción automáticamente y creó las clases en Calendar. Tu trabajo es confirmar de manera cálida en máximo 3 líneas: recibiste el pago, quedó inscrito/a, el día anterior a su primera clase le mandamos datos del instructor y punto de encuentro.

NO llames a confirmarInscripcion — las clases ya están creadas.
NO pidas más información — todo quedó registrado.

## OBJECIONES

- "está caro" → "Te entiendo. Para comparar: el mercado en CDMX cobra hasta $8,999 — aquí desde $3,400, 73.4% más accesible. Y con $690 aparta el lugar; el resto a 3 MSI sin intereses. ¿Te funciona así?"
- "lo pienso" → "Claro. Con $690 te separo el horario mientras decides — si cambias de opinión antes de 48h, se regresa completo."
- "¿hay descuento?" → "El apartado es la promo — $690 hoy y el lugar es tuyo. El resto a 3 MSI si prefieres."
- "¿es seguro?" → "Totalmente. Instructores certificados, autos con doble control y +220 reseñas en Google 😊"
- "¿puedo conocer las instalaciones?" → "Claro, puedes pasar sin cita a Av. Universidad 1407 (metro Viveros). ¿Qué día te queda?"
- "vi otras opciones" / "está caro comparado" → "Tiene sentido comparar. El mercado en CDMX cobra hasta $8,999 — en AEA es desde $3,400, 73.4% más accesible. ¿Qué te importa más: precio, horarios o calidad del instructor?"

## PAGOS A PLAZOS (OPENPAY 3 MSI)

Solo si el cliente pregunta. La reserva ($690) siempre en transferencia; el saldo restante vía liga Openpay:

Avanzado $1,900 → $1,319 | Intermedio $2,900 → $2,210
Estándar $3,400 → $2,955 | Automático $3,900 → $3,500 | Moto $4,300 → $3,936
English Drive $4,800 → $4,482 | Personas Nerviosas / Intensivo / Mixto $5,600 → $5,362

## HORARIOS DISPONIBLES

Clases los 7 días de la semana. Los horarios de inicio son: 7am, 10am, 1pm, 4pm y 7pm (cada clase dura 2.5 horas). Estos son los horarios operativos reales — no existe ningún otro.

Cuando alguien pregunte "¿qué horarios tienen?" → responde con las opciones de inicio y cierra con: "¿Cuál te viene mejor?" No llames a consultarDisponibilidad solo para contestar esa pregunta genérica — úsala en el Paso 3 cuando ya sepas la preferencia.

## UBICACIONES

- Torreón 49, Roma Sur (sede principal)
- Av. Universidad 1407, Axotla, Álvaro Obregón (cerca metro Viveros)
- A domicilio: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán

IMPORTANTE: Siempre recolecta **calle + número + colonia** completos para el punto de encuentro. Si el cliente solo da colonia, pregunta la calle y número antes de avanzar al Paso 5. Esos datos se usan para generar la ficha de inscripción.

## OTROS TEMAS

**Menores de edad**: Edad mínima 16 años. Sí los atendemos. El padre/tutor firma autorización (por WhatsApp o en persona). Al terminar: constancia oficial para SEMOVI, costo adicional $500.

**Licencia de manejo**: AEA no la tramita directamente. Al terminar el curso el alumno va a SEMOVI — cita en línea, lleva INE y comprobante de domicilio.

**Cancelaciones**: Avisar mínimo 24h antes. Sin aviso, la clase se cuenta como impartida.

**Vigencia**: 3 meses para completar el curso. Se puede renovar (consultar asesor).

**Lluvia**: Las clases no se cancelan. Es buena práctica para CDMX. Doble control siempre activo.

**Los coches**: Todos con doble control (freno del instructor). Automáticos y estándar disponibles.

**Por qué AEA**: Clases 1 a 1 (nunca en grupo) · +220 reseñas Google 4.8★ · 73.4% más accesible que el mercado (mercado $8,999 vs AEA desde $3,400) · apartado $690 (ya descontado del total) · 3 MSI sin intereses · instructores certificados · disponibilidad inmediata.

**Método La Fórmula Cinco** (úsalo cuando alguien dice que tiene miedo, que ya intentó y no pudo, o pregunta qué hace diferente a AEA):
El instructor trabaja 5 factores físicos — no solo teoría: cómo agarras el volante (firme pero relajado), hombros bajos, respiración, barrido visual y pie derecho en abanico. Cuando el cuerpo aprende a relajarse, el manejo se vuelve intuitivo. Hay un momento — el "clic" — en que el alumno deja de luchar contra el coche y empieza a fluir con él. Nuestros instructores están entrenados para llevarte a ese punto.
Frases útiles: "No es cuestión de talento, es de técnica física — y eso se enseña." · "Si ya intentaste antes y se sentía forzado, lo más probable es que nadie te enseñó cómo relajar el cuerpo al manejar."

**Reseña Google**: Solo si el cliente expresa satisfacción → "Me alegra mucho 😊 Si tienes un momento, una reseña nos ayuda un montón: https://search.google.com/local/writereview?placeid=ChIJAfjzpZX_0YURdvjfPCx1xrs"

**Asesor humano**: Solo para quejas o negociaciones fuera de catálogo → "Te conecto con un asesor: 56 3443 3212." Solo una vez por conversación.

**Qué sigue después de inscribirse**: El día anterior a su primera clase recibe datos del instructor, punto de encuentro y saldo pendiente.

**Si escribe en inglés**: Responde en inglés con el mismo estilo.

## HERRAMIENTAS

- **consultarDisponibilidad**: Úsala en el Paso 3 (cuando sepas mañana/tarde/fin de semana) para proponer fechas reales. También cuando pregunten "¿hay lugar?" o "¿cuándo puedo empezar?". Nunca inventes horarios.
- **consultarCatalogoCursos**: Para confirmar precios exactos.
- **consultarProgramaCurso**: Si preguntan qué aprenden.
- **confirmarInscripcion**: Solo si el alumno confirma patrón y fecha de forma conversacional (no aplica cuando llega comprobante — ese caso ya está procesado).

## REGLAS ABSOLUTAS

- NUNCA más de una pregunta por mensaje
- NUNCA preguntes algo ya respondido en la conversación
- NUNCA digas que eres IA o bot
- NUNCA inventes precios, horarios o servicios
- NUNCA mandes el link /agenda — el cierre siempre es aquí, con datos de pago
- NUNCA repitas la oferta de asesor humano si ya la hiciste
- SIEMPRE usa consultarDisponibilidad antes de proponer fechas concretas`;

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const MSG_FALLBACK = 'Déjame verificarlo con el equipo y te escribo en un momento.';
const GEMINI_TIMEOUT_MS = 40_000;

// Dedup de mensajes recibidos
const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

// Historial de conversación por número (en memoria, TTL 2 horas)
type HistoryItem = { role: 'user' | 'bot'; text: string };
const conversations = new Map<string, { messages: HistoryItem[]; lastActivity: number }>();
const HISTORY_TTL = 2 * 60 * 60 * 1000;

async function getHistory(phone: string): Promise<HistoryItem[]> {
  const now = Date.now();
  for (const [p, data] of conversations) {
    if (now - data.lastActivity > HISTORY_TTL) conversations.delete(p);
  }
  const cached = conversations.get(phone);
  if (cached) return cached.messages;

  // Memoria expirada o primera vez — restaurar desde Firestore
  try {
    const { getConversationMessages } = await import('@/lib/firestore');
    const msgs = await getConversationMessages(phone);
    if (msgs.length > 0) {
      const recent = msgs.slice(-60);
      const messages: HistoryItem[] = recent.map(m => ({ role: m.role, text: m.text }));
      conversations.set(phone, { messages, lastActivity: now });
      console.log(`[WEBHOOK] Historial restaurado desde Firestore: ${messages.length} msgs para ${phone}`);
      return messages;
    }
  } catch (e) {
    console.error('[WEBHOOK] Error cargando historial desde Firestore:', e);
  }

  return [];
}

function saveHistory(phone: string, userText: string, botText: string) {
  const now = Date.now();
  const existing = conversations.get(phone) ?? { messages: [], lastActivity: now };
  existing.messages.push({ role: 'user', text: userText });
  existing.messages.push({ role: 'bot', text: botText });
  existing.lastActivity = now;
  conversations.set(phone, existing);
}

async function extractLeadInfo(history: HistoryItem[], phone: string) {
  const conversation = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`).join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `De esta conversación extrae en JSON plano: "nombre" (nombre completo del cliente), "zona" (calle, número, colonia y alcaldía mencionados por el cliente; si falta algún dato pon lo que haya), "transmision" ("Estándar" o "Automático", default "Estándar"), "horario" ("mañana", "tarde" o "fin-de-semana" según lo que pidió el cliente). Solo JSON sin texto extra.\n\n${conversation}`,
  });
  try {
    const json = JSON.parse(result.text?.trim() || '{}');
    const tel = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    return {
      nombre: String(json.nombre || 'Alumno'),
      zona: String(json.zona || 'Por confirmar'),
      transmision: String(json.transmision || 'Estándar'),
      horario: (json.horario || 'mañana') as 'mañana' | 'tarde' | 'fin-de-semana',
      telefono: tel,
    };
  } catch {
    const tel = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    return { nombre: 'Alumno', zona: 'Por confirmar', transmision: 'Estándar', horario: 'mañana' as const, telefono: tel };
  }
}

function pickSlots(slots: Awaited<ReturnType<typeof getAvailableSlots>>, horario: string) {
  const mañana = ['07:00', '10:00'];
  const tarde = ['13:00', '16:00', '19:00'];
  const finde = ['sábado', 'domingo'];
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

  const result: Array<{ date: string; time: string }> = [];
  for (const slot of slots) {
    if (result.length >= 4) break;
    const esFinDeSemana = finde.includes(slot.diaSemana);
    if (horario === 'fin-de-semana' && !esFinDeSemana) continue;
    if (horario !== 'fin-de-semana' && esFinDeSemana) continue;
    const preferidos = horario === 'mañana' ? mañana : horario === 'tarde' ? tarde : ['10:00', '13:00'];
    const hora = preferidos.find(h => slot.horariosLibres.includes(h)) ?? slot.horariosLibres[0];
    if (hora) result.push({ date: slot.fecha + 'T12:00:00', time: hora });
  }
  return result;
}

async function extractLeadData(history: HistoryItem[], phone: string): Promise<Record<string, string>> {
  const conversation = history
    .map((h) => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`)
    .join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `De esta conversación extrae en JSON plano los campos: "name" (nombre completo del cliente) y "address" (calle, número, colonia y alcaldía mencionados; si falta algún dato pon lo que haya). Si no hay dato deja el campo vacío. Solo responde JSON, sin texto extra.\n\n${conversation}`,
  });
  const json = JSON.parse(result.text?.trim() || '{}');
  const params: Record<string, string> = {};
  if (json.name) params.name = String(json.name);
  if (json.address) params.address = String(json.address);
  const displayPhone = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
  params.phone = displayPhone;
  return params;
}

function getSystemPrompt(clientPhone?: string): string {
  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
  let prompt = SYSTEM_PROMPT + `\n\n## FECHA ACTUAL\n\nHoy es ${hoy}. Usa este año para calcular cualquier fecha futura.`;
  if (clientPhone) {
    prompt += `\n\n## NÚMERO DE WHATSAPP DEL CLIENTE\n\nEl número de WhatsApp del cliente en esta conversación es: ${clientPhone}. Usa EXACTAMENTE este número en el campo "telefono" cuando llames a confirmarInscripcion. No uses ningún otro número.`;
  }
  return prompt;
}

async function generateReply(userMessage: string, history: HistoryItem[], clientPhone?: string): Promise<string> {
  const geminiCall = ai.generate({
    model: 'googleai/gemini-2.5-pro',
    system: getSystemPrompt(clientPhone),
    tools: AEA_TOOLS,
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

async function sendImageMessage(to: string, mediaId: string, caption?: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const imagePayload: Record<string, string> = { id: mediaId };
  if (caption) imagePayload.caption = caption;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: imagePayload,
  };
  console.log('[WEBHOOK] sendImageMessage →', to, '| mediaId:', mediaId);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responseText = await res.text();
  if (!res.ok) {
    console.error('[WEBHOOK] WhatsApp image API error:', res.status, responseText);
    // Diagnóstico: manda el error al admin en texto para verlo en WhatsApp
    sendMessage(to, `⚠️ [debug] No se pudo reenviar imagen: ${res.status} — ${responseText.slice(0, 200)}`).catch(() => {});
  } else {
    console.log('[WEBHOOK] Imagen reenviada OK:', responseText.slice(0, 120));
  }
}

/**
 * Normaliza cualquier variación de número mexicano a 52XXXXXXXXXX (12 dígitos).
 * Cubre: 521XXXXXXXXXX, +52XXXXXXXXXX, +521XXXXXXXXXX, 10 dígitos sin código.
 */
function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, ''); // solo dígitos
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3); // 521→52
  if (p.startsWith('52') && p.length === 12) return p;               // ya correcto
  if (p.length === 10) return '52' + p;                              // sin código país
  return p; // internacional no mexicano — dejar como está
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

function buildWelcomeMessage(nombre: string | null, isAdLead: boolean): string {
  const primerNombre = nombre ? nombre.split(' ')[0] : null;
  const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!';
  if (isAdLead) {
    return `${saludo} Soy Luz, de Auto Escuela Americana 🚗

Somos la autoescuela con más reseñas en CDMX — 4.8★ con más de 220 alumnos. Clases 1 a 1, nunca en grupo, y puedes empezar esta semana.

¿Ya manejas algo o empiezas desde cero?`;
  }
  return `${saludo} 👋 Soy Luz, de Auto Escuela Americana.

¿Ya manejas algo o empiezas desde cero?`;
}

export async function POST(request: NextRequest) {
  let from = '';
  let textBody = '';
  let messageType = 'text';
  let imageMediaId = '';
  let leadSource: string | null = null;
  let waDisplayName: string | null = null;

  try {
    const body = await request.json();
    console.log('[WEBHOOK] POST recibido:', JSON.stringify(body).slice(0, 300));
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const msgId: string = message.id ?? '';
    from = normalizePhone(message.from ?? '');
    textBody = message?.text?.body ?? '';
    messageType = message?.type ?? 'text';
    if (messageType === 'image') {
      imageMediaId = message?.image?.id ?? '';
      console.log('[WEBHOOK] Imagen recibida — mediaId:', imageMediaId, '| mime:', message?.image?.mime_type);
    }

    // Nombre del contacto de WhatsApp (si lo tiene configurado)
    waDisplayName = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ?? null;

    // Detectar fuente del lead
    const referral = message?.referral;
    if (referral?.source_type === 'ad') {
      leadSource = `Facebook Ad: ${referral.headline ?? referral.source_id ?? 'Anuncio'}`;
    } else {
      // Google Ads → WhatsApp no pasa referral metadata.
      // Los leads de anuncio típicamente mandan un mensaje corto o saludo genérico.
      const msgLower = textBody.toLowerCase().trim();
      const esApertura = msgLower.length < 40 ||
        /^(hola|hi|hello|buenas|buen[ao]s días|información|informacion|info|quiero|curso|clases|precio|cuánto|cuanto|me interesa|quisiera|necesito|tienen)/.test(msgLower);
      if (esApertura) leadSource = 'Google Ads (probable)';
    }

    if (!from || (messageType !== 'image' && !textBody)) {
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

  // Comprobante de pago (imagen) — inscripción automática
  if (messageType === 'image') {
    const history = await getHistory(from);
    let syntheticMsg: string;
    let inscriptionOk = false;
    let fichaClienteMsg: string | null = null;

    // Extraer nombre del lead del historial para la notificación inicial
    const nombreRapido = history.find(h => h.role === 'user' && h.text.length > 2 && h.text.length < 40 && !/http|#|\?/.test(h.text))?.text ?? `+${from}`;

    sendMessage(ADMIN_PHONE,
      `🔴 *COMPROBANTE RECIBIDO*\n\n` +
      `👤 ${nombreRapido}\n📱 +${from}\n\n` +
      `⏳ Procesando inscripción...`
    ).catch((e) => console.error('[WEBHOOK] Error notificando admin (imagen):', e));

    // Reenviar la imagen del comprobante al admin para verificar monto y banco
    if (imageMediaId) {
      sendImageMessage(ADMIN_PHONE, imageMediaId, `Comprobante de +${from}`).catch(
        (e) => console.error('[WEBHOOK] Error reenviando comprobante al admin:', e)
      );
    }

    try {
      const leadInfo = await extractLeadInfo(history, from);
      console.log('[WEBHOOK] Lead info extraída:', JSON.stringify(leadInfo));

      console.log('[WEBHOOK] Consultando slots disponibles...');
      const slots = await getAvailableSlots(21);
      console.log('[WEBHOOK] Slots totales recibidos:', slots.length);
      const pickedSlots = pickSlots(slots, leadInfo.horario);
      console.log('[WEBHOOK] Slots seleccionados:', JSON.stringify(pickedSlots));

      if (pickedSlots.length >= 4) {
        console.log('[WEBHOOK] Creando 4 eventos en Calendar...');
        await scheduleAndCreateEvents({
          name: leadInfo.nombre,
          phone: leadInfo.telefono,
          address: leadInfo.zona,
          transmission: leadInfo.transmision,
          dates: pickedSlots,
        });
        console.log('[WEBHOOK] Eventos creados en Calendar');

        const fechasTexto = pickedSlots.map(s => {
          const [yyyy, mm, dd] = s.date.split('T')[0].split('-').map(Number);
          const d = new Date(yyyy, mm - 1, dd);
          return `${d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${s.time}`;
        }).join('\n  ');

        await sendMessage(ADMIN_PHONE,
          `✅ *VENTA CERRADA — Inscripción completada*\n\n` +
          `👤 ${leadInfo.nombre} | 📱 +${leadInfo.telefono}\n` +
          `📍 ${leadInfo.zona} | 🚗 ${leadInfo.transmision}\n\n` +
          `📅 Clases agendadas:\n  ${fechasTexto}`
        ).catch((e) => console.error('[WEBHOOK] Error admin final:', e));

        // Persiste datos de inscripción para ficha PDF en admin panel
        import('@/lib/firestore')
          .then(({ saveInscripcionData }) =>
            saveInscripcionData(from, {
              nombre: leadInfo.nombre,
              telefono: from,
              zona: leadInfo.zona,
              transmision: leadInfo.transmision,
              fechas: pickedSlots.map(s => ({ date: s.date.split('T')[0], time: s.time })),
            })
          )
          .catch(e => console.error('[WEBHOOK] Error guardando inscripcion:', e));

        // Ficha de inscripción para el cliente (WhatsApp)
        const displayTel = leadInfo.telefono.startsWith('52') && leadInfo.telefono.length === 12
          ? leadInfo.telefono.slice(2) : leadInfo.telefono;
        const fichaLineas = [
          `📋 *Tu Ficha de Inscripción — Auto Escuela Americana*`,
          ``,
          `👤 *${leadInfo.nombre}*`,
          `📱 ${displayTel}`,
          `🚗 Curso ${leadInfo.transmision}`,
          `📍 ${leadInfo.zona}`,
          ``,
          `📅 *Tus clases:*`,
          ...pickedSlots.slice(0, 4).map((s, i) => {
            const [yyyy, mm, dd] = s.date.split('T')[0].split('-').map(Number);
            const d = new Date(yyyy, mm - 1, dd);
            const label = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
            return `${i + 1}. ${label} · ${s.time}`;
          }),
          ``,
          `Guarda este mensaje 📌 El día antes de tu primera clase te mandamos los datos del instructor.`,
        ];
        fichaClienteMsg = fichaLineas.join('\n');

        inscriptionOk = true;
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) envió su comprobante y sus 4 clases quedaron AGENDADAS AUTOMÁTICAMENTE en Calendar:\n${fechasTexto}\n\nConfírmale esto de manera cordial. Indícale que el día anterior a su primera clase recibirá un mensaje con los datos del instructor. IMPORTANTE: NO llames a confirmarInscripcion — las clases ya están agendadas.`;
      } else {
        sendMessage(ADMIN_PHONE,
          `⚠️ *COMPROBANTE RECIBIDO — Horario pendiente*\n\n` +
          `👤 ${leadInfo.nombre} | 📱 +${leadInfo.telefono}\n` +
          `📍 ${leadInfo.zona} | 🚗 ${leadInfo.transmision}\n\n` +
          `No había suficientes slots disponibles. Asigna horario manualmente.`
        ).catch((e) => console.error('[WEBHOOK] Error notificando admin (sin slots):', e));
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante. No hay suficientes horarios disponibles. Propónle un patrón de 4 clases y coordina con el equipo.`;
      }
    } catch (e) {
      console.error('[WEBHOOK] Error en inscripción automática:', e);
      sendMessage(ADMIN_PHONE,
        `⚠️ *COMPROBANTE RECIBIDO — Requiere atención manual*\n\n` +
        `📱 +${from}\n\n` +
        `No se pudo procesar automáticamente. Entra al chat y coordina el horario.`
      ).catch((err) => console.error('[WEBHOOK] Error notificando admin (error path):', err));
      syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante de pago. Confirma recepción y propónle un horario para sus 4 clases.`;
    }

    const reply = await generateReply(syntheticMsg, history, from);
    await sendMessage(from, reply);
    saveHistory(from, '[imagen: comprobante de pago]', reply);
    import('@/lib/firestore')
      .then(({ saveImageMessage }) => saveImageMessage(from, imageMediaId || 'unknown', reply))
      .catch((e) => console.error('[WEBHOOK] Firestore save error:', e));

    if (inscriptionOk) {
      // Ficha de inscripción al cliente
      if (fichaClienteMsg) {
        sendMessage(from, fichaClienteMsg).catch(e => console.error('[WEBHOOK] Error enviando ficha cliente:', e));
      }

      // Enviar términos y condiciones + aviso de privacidad al alumno
      sendMessage(from,
        `📋 *Términos y Condiciones*\nAl realizar tu pago aceptas los términos de Auto Escuela Americana:\napp.autoescuelaamericana.com/terminos\n\n🔒 *Aviso de Privacidad*\nTus datos son tratados conforme a nuestro aviso de privacidad:\napp.autoescuelaamericana.com/aviso-privacidad`
      ).catch(e => console.error('[WEBHOOK] Error enviando T&C:', e));

      // Inscripción confirmada → cerrar lead como ganado directamente
      import('@/lib/firestore')
        .then(async ({ updateChatState }) => {
          const { Timestamp } = await import('firebase-admin/firestore');
          return updateChatState(from, {
            chatState: 'cerrado',
            chatReason: 'Inscripción confirmada automáticamente',
            chatUrgency: 'ninguna',
            closedAt: Timestamp.now(),
            closedOutcome: 'ganado',
          }, 'manual');
        })
        .catch((e) => console.error('[WEBHOOK] Error cerrando lead ganado:', e));
    } else {
      // Sin inscripción → recalcular estado normalmente
      import('@/lib/chat-state')
        .then(({ recalculateChatState }) => recalculateChatState(from, 'mensaje_luz'))
        .catch((e) => console.error('[WEBHOOK] recalculate error (imagen):', e));
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  const history = await getHistory(from);
  const isNewLead = history.length === 0;

  import('@/lib/firestore')
    .then(({ updateLeadActivity, saveLeadSource }) =>
      Promise.all([
        updateLeadActivity(from),
        isNewLead && leadSource ? saveLeadSource(from, leadSource) : Promise.resolve(),
      ])
    )
    .catch((e) => console.error('[WEBHOOK] Error actualizando lead activity:', e));

  // Nuevo lead — enviar menú de bienvenida y salir
  if (isNewLead) {
    const fuenteTexto = leadSource ? `📣 Fuente: ${leadSource}` : '📣 Fuente: directa';
    const nombreTexto = waDisplayName ? `\n👤 ${waDisplayName}` : '';
    sendMessage(ADMIN_PHONE, `🆕 *Nuevo lead*\n\n📱 +${from}${nombreTexto}\n${fuenteTexto}`)
      .catch((e) => console.error('[WEBHOOK] Error notificando nuevo lead:', e));

    const welcome = buildWelcomeMessage(waDisplayName, leadSource !== null);
    await sendMessage(from, welcome);
    saveHistory(from, textBody, welcome);
    import('@/lib/firestore')
      .then(async ({ saveConversationMessage, db }) => {
        await saveConversationMessage(from, textBody, welcome);
        if (waDisplayName) {
          await db.collection('conversations').doc(from).set({ contactName: waDisplayName }, { merge: true });
        }
      })
      .catch((e) => console.error('[WEBHOOK] Error guardando lead nuevo:', e));

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Si el bot está en pausa, guardar mensaje y no responder
  {
    const { getConversation, saveUserMessage } = await import('@/lib/firestore');
    const convData = await getConversation(from);
    if (convData?.botPaused) {
      console.log('[WEBHOOK] Bot en pausa para', from, '— guardando mensaje sin responder');
      saveUserMessage(from, textBody).catch(e => console.error('[WEBHOOK] saveUserMessage (paused):', e));
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
  }

  try {
    console.log('[CHAT] 📩', from, '→ Luz:', textBody);
    let reply = await generateReply(textBody, history, from);

    if (reply.includes('autoescuelaamericana.com/agenda')) {
      try {
        const leadData = await extractLeadData(history, from);
        if (Object.keys(leadData).length > 0) {
          const params = new URLSearchParams(leadData).toString();
          reply = reply.replace(
            'https://app.autoescuelaamericana.com/agenda',
            `https://app.autoescuelaamericana.com/agenda?${params}`
          );
        }
      } catch (e) {
        console.error('[WEBHOOK] Error extrayendo datos del lead:', e);
      }
    }

    await sendMessage(from, reply);
    saveHistory(from, textBody, reply);
    import('@/lib/firestore')
      .then(({ saveConversationMessage }) => saveConversationMessage(from, textBody, reply))
      .catch(e => console.error('[WEBHOOK] Firestore save error:', e));
    import('@/lib/chat-state')
      .then(({ recalculateChatState }) => recalculateChatState(from, 'mensaje_cliente'))
      .catch(e => console.error('[WEBHOOK] recalculate error:', e));
    console.log('[CHAT] 🤖 Luz →', from, ':', reply);

    if (reply.includes('autoescuelaamericana.com/agenda')) {
      const resumen = history
        .filter((h) => h.role === 'user')
        .map((h) => h.text)
        .slice(-6)
        .join(' | ');
      const aviso =
        `🔔 *Lead enviado a /agenda*\n\n` +
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
