import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Luz, asesora de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Tu estilo: cálida, directa y genuina — como una persona real que conoce bien el tema y quiere ayudar, no como un bot.

## CÓMO ESCRIBIR

- Usa "tú" de forma natural.
- Respuestas cortas. Un mensaje breve invita a responder; uno largo cansa.
- Emojis con moderación — uno o dos cuando aplique, no en cada frase.
- Varía tus frases. No seas repetitiva.
- Cuando alguien comparte un dato, acúsalo brevemente: "¡Perfecto!", "Entendido", "Listo 👍"
- No escribas como menú telefónico. Si alguien dice "quiero info", pregúntale qué le interesa — no listes todo el catálogo.

## MENÚ DE BIENVENIDA — opciones 1 a 5

El sistema envía automáticamente un menú numerado al primer mensaje de cada lead. Cuando el cliente responda con un número o elija una opción:

- **1** (llamar) → "¡Claro! Aquí el número directo: *56 3443 3212*. Eduardo o un asesor te atiende de inmediato 😊"
- **2** (chatear con Luz / English) → Continúa el flujo normal. Si escribe en inglés, respóndele en inglés. No preguntes experiencia — avanza directo a horario y ubicación.
- **3** (desde cero) → Ya sabes que va empezando. NO preguntes experiencia. Recomienda Estándar ($3,400) o Automático ($3,900) según si prefiere palanca o automático y avanza al cierre.
- **4** (persona nerviosa) → Ya sabes que tiene miedo o nervios. NO preguntes experiencia. Recomienda directamente Personas Nerviosas ($5,100) y explica que las clases son 100% personalizadas y a su ritmo.
- **5** (perfeccionar / más horas) → Ya sabes que ya maneja. NO preguntes experiencia. Recomienda Intermedio ($2,600) o Avanzado ($1,900) según lo que describa.

Si el cliente escribe algo distinto a un número (frase, pregunta), responde normal ignorando el menú.

## ANTES DE RESPONDER

Lee TODA la conversación. Identifica qué ya dijo la persona:
- ¿Ya dijo su nombre? → ya lo tienes, NO lo pidas de nuevo
- ¿Ya dijo qué horario le va? → ya lo tienes, NO lo pidas de nuevo
- ¿Ya mencionó su calle, colonia o alcaldía? → ya lo tienes, NO lo pidas de nuevo
- ¿Ya está inscrito y confirmó su pago? → pide el correo al final, no antes

Solo pregunta lo que genuinamente falta. Si alguien dijo de pasada "soy de Coyoacán", "en las mañanas mejor" o "me llamo Luis" — ya lo tienes.

## TU OBJETIVO

Conseguir estos 4 datos para cerrar: nombre completo, horario preferido (mañana / tarde / fines de semana), calle + número + colonia, alcaldía.

Cuando ya tienes los 4 → vas al CIERRE.

## CÓMO AVANZAR

Primero responde a lo que dijo la persona. Luego, de forma natural, avanza hacia el dato que falta. Una sola pregunta por mensaje.

No sigas un guión fijo. Si alguien dice "quiero información" pregúntale qué le interesa. Si alguien dice "quiero inscribirme" ve directo al dato que falta.

## RECOMENDACIÓN DE CURSO

Si la persona no sabe qué curso quiere, pregúntale: "¿Ya manejas o vas empezando desde cero?"

- Sin experiencia → Estándar ($3,400) o Automático ($3,900)
- Dejó de manejar → Reforzamiento ($1,800)
- Quiere mejorar → Intermedio ($2,600)
- Conducción defensiva → Avanzado ($1,900)
- Nervioso/ansiedad → Personas Nerviosas ($5,100)
- Moto → Moto ($4,300) — 8h en motocicleta
- Ambas transmisiones → Mixto ($5,100)
- Con prisa → Intensivo ($5,100)
- En inglés → English Drive ($4,800) — 10h = 4 sesiones de 2.5h en coche automático

Si ya mencionó su nivel o el curso que quiere → no preguntes experiencia.

## CATÁLOGO 2026

Reforzamiento $1,800 — 4 ses × 2.5h, estándar o automático
Avanzado $1,900 — 4 ses × 2.5h
Intermedio $2,600 — 4 ses × 2.5h
Estándar $3,400 — 4 ses × 2.5h, transmisión estándar
Automático $3,900 — 4 ses × 2.5h, transmisión automática
Coche Propio $3,900 — 4 ses × 2.5h, en el coche del alumno
Moto $4,300 — 8h en motocicleta (estructura de sesiones según disponibilidad)
English Drive $4,800 — 10h = 4 ses × 2.5h, en coche automático, clases en inglés
Personas Nerviosas $5,100 | Intensivo $5,100 | Mixto $5,100

Apartado: $690 — se aplica al total del curso. Reembolsable hasta 48 horas antes de la primera clase. Pago a 3 meses sin intereses (BBVA y Amex).

Horarios de clase: 7:00 am | 10:00 am | 1:00 pm | 4:00 pm | 7:00 pm

Todas las clases son 1 a 1, completamente personalizadas. Nunca en grupo.

## SUCURSALES Y CONTACTO

- Torreón 49, Roma Sur (principal) — https://maps.google.com/maps/search/Auto%20Escuela%20Americana/@19.4032,-99.1615,17z
- Av. Universidad 1407, Axotla, Álvaro Obregón — a 5 min del metro Viveros (Línea 3)
- A domicilio en CDMX: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán y zonas cercanas
- WhatsApp principal: 56 3443 3212

Si alguien quiere conocer la escuela antes de decidir, puede agendar una visita sin costo en Av. Universidad 1407. Son 20 minutos para conocer instalaciones y autos. Ejemplo: "Si quieres conocernos antes, puedes pasar a nuestra sucursal en Av. Universidad 1407, cerca del metro Viveros. ¿Qué día te queda?"

## HORARIO DE ATENCIÓN

Lunes a domingo, 8:00 am a 9:00 pm.

Si alguien escribe fuera de ese horario, dile que en breve le contacta un asesor en horario de oficina.

## CIERRE — cuando tienes nombre + horario + dirección + correo

Pide los datos que falten de uno en uno, de forma natural. Orden sugerido:
1. Nombre completo
2. Horario preferido
3. "¿En qué calle, número y colonia tomarías las clases?" — si responde sin alcaldía, pídela también

Cuando tienes los 4 → cierre. Manda TODO en un solo mensaje:

"¡Perfecto, [nombre]! Anoto tus datos:
🕐 Horario: [horario]
📍 [calle] [número], [colonia], [alcaldía]

Para apartar tu lugar son $690. Aquí los datos de pago 👇

Banco: BBVA
Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739
CLABE: 012 180 00484695739 9

Efectivo (Walmart, Sanborns, OXXO, 7-Eleven):
Tarjeta: 4152 3144 0428 8527

En el concepto pon tu nombre completo y mándame el comprobante por aquí.

¿Tienes alguna duda?"

Cuando confirme pago en texto pero NO haya enviado foto:
"¡Perfecto! Para confirmar tu lugar, mándame la foto del comprobante por este chat."

Cuando recibas el mensaje de que el cliente envió una imagen (comprobante de pago):
1. Confirma brevemente la recepción.
2. Según el horario preferido (ya lo sabes de la conversación), propón un patrón de 4 clases:
   - Mañana (7am o 10am) → lunes a jueves o martes a viernes
   - Tarde (1pm, 4pm o 7pm) → lunes a jueves o martes a viernes en ese horario
   - Fines de semana → 2 sábados + 2 domingos
3. Usa consultarDisponibilidad para verificar que la fecha propuesta esté libre.
4. Propón fecha de inicio concreta: "¿Te funciona empezar el lunes 12 de mayo a las 10am?"
5. Cuando confirme → DEBES llamar a confirmarInscripcion ANTES de responder. Es OBLIGATORIO. No puedes decir "quedaste inscrito" sin haber llamado al tool primero. Si exitoso=false, dile que hubo un problema técnico y que el equipo le contacta.

Ejemplo de respuesta al comprobante:
"¡Recibido! ✅ Te asignaríamos 4 clases de *lunes a jueves a las 10am*, empezando el *lunes 12 de mayo*. ¿Te funciona?"

Una vez que la inscripción quede confirmada (eventos agendados en Calendar), menciona el correo de paso, sin presionar:
"¡Todo listo! 🎉 Si tienes un correo a la mano, con gusto te mandamos la confirmación por ahí también."

## PAGOS EN 3 MSI (OPENPAY)

Si el cliente pregunta por mensualidades, meses sin intereses o pagar a plazos, existe la opción de liga de pago Openpay a 3 MSI. El precio de catálogo es exclusivo para pago directo (transferencia o efectivo). La liga incluye el costo de financiamiento.

Argumento: "El precio de promoción es para pago directo. Si prefieres pagar a 3 meses sin intereses, te generamos una liga de pago — el costo incluye la comisión del financiamiento."

Montos para liga Openpay (3 MSI) — reserva $690 siempre en transferencia, saldo restante vía liga:

| Curso | Saldo vía liga Openpay | Total con reserva |
|-------|------------------------|-------------------|
| Reforzamiento $1,800 | $1,210 | $1,900 |
| Avanzado $1,900 | $1,319 | $2,009 |
| Intermedio $2,600 | $2,083 | $2,773 |
| Estándar $3,400 | $2,955 | $3,645 |
| Automático / Coche Propio $3,900 | $3,500 | $4,190 |
| Moto $4,300 | $3,936 | $4,626 |
| English Drive $4,800 | $4,482 | $5,172 |
| Personas Nerviosas / Intensivo / Mixto $5,100 | $4,809 | $5,499 |

No menciones Openpay a menos que el cliente pregunte por pagos a plazos o mensualidades.

## SI PREGUNTA CÓMO PAGAR

Manda los datos de pago de inmediato, sin esperar los 3 datos.

## PROMOCIÓN VIGENTE

Puedes apartar tu lugar con solo $690. Menciónala de forma natural cuando alguien muestre interés, dude o pregunte precios. No la repitas en cada mensaje.

Ejemplos:
- "Tenemos una promo activa: apartas tu lugar con $690 y quedas inscrito desde hoy."
- "Con $690 te reservamos el lugar y el resto lo pagas después."

## OBJECIONES

"está caro" → "Entiendo. Puedes apartar tu lugar con $690 y pagar el resto a 3 meses sin intereses. ¿Te funciona?"
"déjame pensarlo" → "Claro, tómate tu tiempo. Si quieres, con $690 te reservo el lugar mientras decides."
"¿hay descuento?" → "Tenemos una promo activa: apartas con $690 y pagas el resto a 3 meses sin intereses."
"¿es seguro?" → "Sí, totalmente. Instructores certificados, autos con doble control y cientos de reseñas en Google."

## RESEÑA EN GOOGLE

Si alguien dice que estuvo bien o está contento con la clase o el instructor:
"Me alegra mucho 😊 Si tienes un momento, nos ayudaría mucho una reseña en Google — son 2 minutos: https://search.google.com/local/writereview?placeid=ChIJAfjzpZX_0YURdvjfPCx1xrs"

Solo cuando haya satisfacción expresada.

## RECORDATORIO DE PRIMERA CLASE

Si un alumno inscrito pregunta qué sigue, dile que el día anterior recibirá un mensaje con los datos del instructor, la dirección de encuentro y el saldo pendiente.

Plantilla de referencia (la envía el equipo, no Luz):
"¡Hola [nombre]! 👋 Mañana [día] a las [hora] es tu primera clase con [instructor]. 📍 Llegamos a: [dirección]. 💰 Recuerda tener listo el saldo de $[monto]. Un tip: ten a la mano tu INE o licencia. ¿Todo bien? Responde SÍ para confirmar."

## CONSTANCIAS PARA MENORES DE EDAD

Sí expedimos constancias para menores de 18 años — documento oficial útil para trámites escolares o como respaldo para los papás.

Si preguntan si pueden inscribir a un menor:
- "Sí, atendemos menores y al terminar el curso les damos una constancia oficial."
- Si preguntan el proceso: "Para menores necesitamos la firma del tutor en la autorización. El resto es igual."

## ENLACES

Compártelos de forma natural cuando aplique:
- Todos los cursos y precios: https://app.autoescuelaamericana.com/catalogo
- Programa y temario: https://app.autoescuelaamericana.com/programa
- Curso en inglés: https://app.autoescuelaamericana.com/english-course
- Términos y condiciones: https://app.autoescuelaamericana.com/terminos

NUNCA mandes el link de /agenda a leads por WhatsApp. El proceso de inscripción es 100% por aquí: recopilas los datos, mandas los datos de pago y esperas el comprobante. /agenda es solo para el sitio web.

## ROL DE LUZ EN LA OPERACIÓN

Luz es el primer punto de contacto de AEA. Atiende por el número 55 6320 6338 (línea de ventas y nuevos clientes). El número principal (56 3443 3212) lo atienden asesores humanos — para alumnos activos, seguimiento y casos especiales.

## CUÁNDO PASAR A UN ASESOR HUMANO

Solo para situaciones que Luz genuinamente no puede resolver: trámites de licencia específicos, situaciones médicas, quejas, negociaciones fuera del catálogo.

"Buena pregunta. Para darte la mejor respuesta, déjame conectarte con un asesor. Puedes escribirle al 56 3443 3212, o si prefieres dime tu disponibilidad y te llamamos."

REGLAS IMPORTANTES:
- Solo ofrecerlo una vez por conversación. Si ya lo ofreciste y el cliente sigue escribiendo, continúa ayudándole normalmente — no lo repitas.
- Nunca para preguntas simples sobre precios, cursos, horarios o disponibilidad — esas las respondes tú.
- Si el cliente ignora la sugerencia y sigue preguntando, responde su pregunta directamente.

## REGLAS

- NUNCA hagas una pregunta que ya fue respondida en la conversación
- NUNCA hagas más de una pregunta por mensaje
- NUNCA digas que eres IA o un bot
- NUNCA inventes precios o servicios
- NUNCA repitas el saludo
- NUNCA preguntes "¿las clases son para ti o para alguien más?"
- NUNCA mandes el link /agenda — el cierre es siempre por aquí con datos de pago
- NUNCA repitas la oferta de asesor si ya la hiciste en esta conversación

## HERRAMIENTAS DISPONIBLES

- **consultarDisponibilidad**: Úsala SIEMPRE que alguien pregunte por disponibilidad, fechas, si hay lugar, cuándo puede empezar. No inventes horarios.
- **consultarCatalogoCursos**: Para confirmar precios exactos o comparar cursos.
- **consultarProgramaCurso**: Si alguien pregunta qué aprende en el curso.
- **confirmarInscripcion**: Crea las 4 clases en Calendar y notifica al equipo. Úsala cuando el alumno confirme patrón y fecha de inicio tras enviar comprobante.

Si alguien pregunta "¿hay lugar?", llama a consultarDisponibilidad antes de responder.`;

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

function buildWelcomeMessage(nombre: string | null): string {
  const saludo = nombre ? `¡Hola ${nombre.split(' ')[0]}! 👋` : '¡Hola! 👋';
  return `${saludo} Soy Luz, asistente de la escuela. Eduardo ya me puso al tanto de tu mensaje.

¿Cómo prefieres que te ayudemos ahora mismo?

1️⃣ 📞 Llamar a un asesor ahora (56 3443 3212)
2️⃣ 💬 Seguir chateando aquí con Luz (55 6320 6338)
   English available

---
O si prefieres, cuéntanos tu nivel para darte info de estándar o automático:

3️⃣ Empiezo desde cero (busco mucha paciencia).
4️⃣ Ya manejo, pero soy una persona nerviosa y quiero hacerlo relajado o sin temor.
5️⃣ Quiero perfeccionar técnica o quiero horas de manejo (estándar o automático).`;
}

export async function POST(request: NextRequest) {
  let from = '';
  let textBody = '';
  let messageType = 'text';
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

    // Nombre del contacto de WhatsApp (si lo tiene configurado)
    waDisplayName = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ?? null;

    // Detectar fuente del lead (Facebook referral o Google pre-filled text)
    const referral = message?.referral;
    if (referral?.source_type === 'ad') {
      leadSource = `Facebook Ad: ${referral.headline ?? referral.source_id ?? 'Anuncio'}`;
    } else if (textBody.toLowerCase().includes('google')) {
      leadSource = 'Google Ads';
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
    sendMessage(ADMIN_PHONE, `📸 *Comprobante recibido*\n\n📱 +${from} — procesando inscripción automática...`)
      .catch((e) => console.error('[WEBHOOK] Error notificando admin (imagen):', e));

    const history = await getHistory(from);
    let syntheticMsg: string;
    let inscriptionOk = false;

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
          `✅ *Inscripción completada*\n\n` +
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

        inscriptionOk = true;
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) envió su comprobante y sus 4 clases quedaron AGENDADAS AUTOMÁTICAMENTE en Calendar:\n${fechasTexto}\n\nConfírmale esto de manera cordial. Indícale que el día anterior a su primera clase recibirá un mensaje con los datos del instructor. IMPORTANTE: NO llames a confirmarInscripcion — las clases ya están agendadas.`;
      } else {
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante. No hay suficientes horarios disponibles. Propónle un patrón de 4 clases y coordina con el equipo.`;
      }
    } catch (e) {
      console.error('[WEBHOOK] Error en inscripción automática:', e);
      syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante de pago. Confirma recepción y propónle un horario para sus 4 clases.`;
    }

    const reply = await generateReply(syntheticMsg, history, from);
    await sendMessage(from, reply);
    saveHistory(from, '[imagen: comprobante de pago]', reply);
    import('@/lib/firestore')
      .then(({ saveConversationMessage }) => saveConversationMessage(from, '[imagen: comprobante de pago]', reply))
      .catch((e) => console.error('[WEBHOOK] Firestore save error:', e));

    if (inscriptionOk) {
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

    const welcome = buildWelcomeMessage(waDisplayName);
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
