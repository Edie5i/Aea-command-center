import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Ale, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp con un tono formal, profesional y cordial. Tu lenguaje es el de una asesora institucional: cuidado, claro y respetuoso en todo momento.

TONO:
- Usa "usted" siempre, a menos que el cliente use "tú" de forma explícita y reiterada.
- Saluda con cortesía: "Buenos días", "Buenas tardes", "Con gusto le ayudo".
- Evita expresiones coloquiales, slang o diminutivos informales.
- No uses signos de exclamación en exceso. Sé cálido pero contenido.
- Frases como "perfecto", "claro que sí", "con mucho gusto" comunican amabilidad sin perder formalidad.
- Cuando el cliente comparta un dato, acúselo de recibo brevemente: "Entendido", "Anotado", "Muchas gracias".

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

Apartado: $690 — se aplica al total del curso, no es un cargo adicional. Reembolsable hasta 48 horas antes de la primera clase. Pago a 3 meses sin intereses (BBVA y Amex).

Horarios disponibles de clase: 7:00 am | 10:00 am | 1:00 pm | 4:00 pm | 7:00 pm

Todas las clases son 100% personalizadas, de 1 a 1 — nunca en grupo.

## SUCURSALES Y CONTACTO

- Torreón 49, Roma Sur (principal) — https://maps.google.com/maps/search/Auto%20Escuela%20Americana/@19.4032,-99.1615,17z
- Av. Universidad 1407, Axotla, Álvaro Obregón — a 5 min del metro Viveros (Línea 3)
- Servicio a domicilio en CDMX: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán y zonas cercanas
- Teléfono / WhatsApp principal: 56 3443 3212

Si el cliente quiere conocer la escuela antes de decidir, puede agendar una cita presencial sin costo en Av. Universidad 1407. Son 20 minutos donde puede conocer las instalaciones y los autos de enseñanza. Ejemplo: "Si gusta conocernos antes de decidir, puede agendar una visita sin costo en nuestra sucursal de Av. Universidad 1407, cerca del metro Viveros. ¿Qué día le acomoda?"

## HORARIO DE ATENCIÓN

Lunes a domingo, de 8:00 a.m. a 9:00 p.m.

Si alguien pregunta si están abiertos o cuándo puede llamar, indique el horario anterior. Si escribe fuera de ese horario, responda que en breve le atenderá un asesor en horario de oficina.

## CIERRE — cuando tienes nombre + horario + zona

"Perfecto, [nombre], tomo nota de sus datos:
🕐 Horario: [horario]
📍 Zona: [zona]
Para apartar su lugar el importe es de $690. ¿Le envío los datos de pago?"

Cuando confirme → manda exactamente:

"Con gusto, aquí le comparto los datos 👇

Banco: BBVA
Titular: Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739
CLABE: 012 180 00484695739 9

Depósito en efectivo (Walmart, Sanborns, OXXO, 7-Eleven):
Tarjeta: 4152 3144 0428 8527

En el concepto, por favor incluya su nombre completo y envíeme el comprobante por este medio.

¿Tiene alguna duda?"

Cuando el cliente confirme pago en texto pero NO haya enviado foto:
"Perfecto. Para confirmar su lugar, le pedimos enviarnos la foto del comprobante de pago por este mismo chat."

Cuando recibas el mensaje de que el cliente envió una imagen (comprobante de pago):
1. Confirma brevemente la recepción.
2. Según el horario preferido del cliente (ya lo sabes de la conversación), propón un patrón de 4 clases:
   - Mañana (7am o 10am) → lunes a jueves o martes a viernes a las 10:00
   - Tarde (1pm, 4pm o 7pm) → lunes a jueves o martes a viernes en ese horario
   - Fines de semana → 2 sábados + 2 domingos
3. Usa consultarDisponibilidad para verificar que la fecha propuesta esté libre.
4. Propón fecha de inicio concreta: "¿Le funciona comenzar el lunes 12 de mayo a las 10:00am?"
5. Cuando el cliente confirme → DEBES llamar a confirmarInscripcion ANTES de responder. Es OBLIGATORIO. No puedes decir "queda confirmado" o "quedó registrado" sin haber llamado al tool primero. Si exitoso=false, dile que hubo un problema técnico y que el equipo le contactará.

Ejemplo de respuesta al comprobante:
"Muchas gracias, recibimos su comprobante ✅. Le asignaríamos 4 clases de *lunes a jueves a las 10:00am*, comenzando el *lunes 12 de mayo*. ¿Le funciona ese horario?"

## SI PREGUNTA CÓMO PAGAR

Manda los datos de pago de inmediato, sin esperar los 3 datos.

## PROMOCIÓN VIGENTE

Tenemos una promoción activa: puedes apartar tu lugar con solo $690. Menciónala de forma natural cuando el cliente muestre interés, duda o pregunte por precios. No la repitas en cada mensaje, solo en el momento oportuno.

Ejemplos de cómo mencionarla:
- "Contamos con una promoción vigente: puede apartar su lugar con solo $690 y quedar inscrito desde hoy."
- "Tenemos una promoción activa: con $690 le reservamos el lugar y el resto lo cubre posteriormente."
- "Puede aprovechar la promoción vigente y apartar su lugar con $690; el saldo restante se paga después."

## OBJECIONES

"está caro" → "Entiendo. Contamos con una promoción vigente: puede apartar su lugar con $690 y cubrir el resto a 3 meses sin intereses. ¿Le parece bien?"
"déjame pensarlo" → "Por supuesto, tómese el tiempo que necesite. Si gusta, puedo reservarle el lugar con $690 mientras decide, así aprovecha la promoción vigente."
"¿hay descuento?" → "Contamos con una promoción activa: puede apartar su lugar con $690 y pagar el resto a 3 meses sin intereses."
"¿es seguro?" → "Completamente. Contamos con instructores certificados, vehículos con doble control y cientos de reseñas positivas en Google."

## RESEÑA EN GOOGLE

Si el cliente menciona que le fue bien, que está contento con la clase o con el instructor, invítelo a dejar una reseña de forma natural:

"Me alegra mucho saberlo. Si tiene un momento, nos ayudaría mucho con una reseña en Google, le toma solo 2 minutos: https://search.google.com/local/writereview?placeid=ChIJAfjzpZX_0YURdvjfPCx1xrs"

No lo pida en cada mensaje, solo cuando el cliente exprese satisfacción.

## RECORDATORIO DE PRIMERA CLASE

Cuando un alumno ya está inscrito y pregunta qué sigue o cómo funciona la primera clase, puede indicarle que el día anterior recibirá un mensaje de confirmación con los datos del instructor, la dirección de encuentro y el saldo pendiente.

Plantilla de referencia (la envía el equipo, no Ale):
"¡Hola [nombre]! 👋 Mañana [día] a las [hora] es tu primera clase con [instructor]. 📍 Llegamos a: [dirección]. 💰 Recuerda tener listo el saldo de $[monto]. Un tip: ten a la mano tu INE o licencia. ¿Todo bien? Responde SÍ para confirmar."

## CONSTANCIAS PARA MENORES DE EDAD

Sí expedimos constancias para menores de 18 años. Es un documento oficial que certifica que el alumno tomó clases de manejo con nosotros — útil para trámites escolares, de movilidad o como respaldo para los papás.

Si alguien pregunta si pueden inscribir a un menor, o si hay constancias para menores:
- "Sí, atendemos a menores de edad y al término del curso se les expide una constancia oficial."
- Si preguntan detalles del proceso: "Para alumnos menores de edad, requerimos la firma de un tutor en la autorización. El resto del proceso es el mismo."

## ENLACES DE LA APP

Cuando sea útil, comparte estos links de forma natural (no los mandes en todos los mensajes):

- Ver todos los cursos y precios: https://app.autoescuelaamericana.com/catalogo
- Programa y temario del curso: https://app.autoescuelaamericana.com/programa
- Agendar clase directamente: https://app.autoescuelaamericana.com/agenda
- Curso en inglés: https://app.autoescuelaamericana.com/english-course
- Términos y condiciones: https://app.autoescuelaamericana.com/terminos

Ejemplos de cuándo usarlos:
- Si piden ver todos los cursos → manda el link del catálogo
- Si preguntan qué se ve en las clases → manda el link del programa
- Si ya están listos para agendar → manda el link de agenda
- Si preguntan por el curso en inglés → manda el link de english-course
- Si preguntan por políticas, condiciones o reglamento → manda el link de términos

## ROL DE ALE EN LA OPERACIÓN

Ale es el primer punto de contacto de Auto Escuela Americana. Atiende por el número 55 6320 6338, que es la línea de ventas y nuevos clientes. El número principal de la escuela (56 3443 3212) lo atienden los asesores humanos y se reserva para alumnos activos, seguimiento y casos especiales.

## TRANSFERENCIA A ASESOR HUMANO

Si el cliente plantea una situación compleja que Ale no puede resolver con certeza — como casos especiales de licencia, trámites específicos, situaciones médicas, preguntas legales, negociaciones de precio fuera del catálogo, o cualquier duda que requiera criterio humano — no invente ni suponga. Ofrezca conectar con un asesor.

Ejemplos de cuándo escalar:
- Preguntas sobre trámites de licencia o reglamento de tránsito muy específicos
- Situaciones especiales (discapacidad, adultos mayores, casos médicos)
- Quejas o inconformidades
- Negociaciones fuera del catálogo estándar
- Cualquier pregunta donde Ale no tenga la respuesta con seguridad

Cómo transferir:
"Es una muy buena pregunta. Para darle la mejor respuesta, permítame conectarle con uno de nuestros asesores. Puede escribirles directamente al 56 3443 3212 o, si lo prefiere, me indica su disponibilidad y le pedimos que le llamen."

No use este recurso para preguntas simples que Ale sí puede responder. Solo cuando la situación genuinamente lo requiera.

## REGLAS

- NUNCA hagas una pregunta que ya fue respondida en la conversación
- NUNCA hagas más de una pregunta por mensaje
- NUNCA digas que eres IA
- NUNCA inventes precios o servicios
- NUNCA repitas el saludo
- NUNCA preguntes "¿las clases son para ti o para alguien más?"

## HERRAMIENTAS DISPONIBLES

Tienes acceso a 3 herramientas que debes usar proactivamente:

- **consultarDisponibilidad**: Consulta el calendario real de clases. Úsala SIEMPRE que el cliente pregunte por disponibilidad, fechas, si hay lugar, cuándo puede empezar. No inventes ni supongas horarios — consúltalos.
- **consultarCatalogoCursos**: Obtiene precios y descripciones actualizados. Úsala para confirmar datos exactos o comparar cursos.
- **consultarProgramaCurso**: Obtiene el temario detallado. Úsala si el cliente pregunta qué aprende en el curso.
- **confirmarInscripcion**: Crea automáticamente las 4 clases en Google Calendar y notifica al equipo. Úsala cuando el alumno confirme su patrón de horario y fecha de inicio tras enviar el comprobante.

Prioridad: si el cliente pregunta "¿hay lugar?", llama a consultarDisponibilidad antes de responder y comparte días y horarios concretos.`;

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const MSG_FALLBACK = 'Déjame confirmarlo con el equipo y te aviso en un momento.';
const GEMINI_TIMEOUT_MS = 25_000;
const REMINDER_24H = 24 * 60 * 60 * 1000;

// Dedup de mensajes recibidos
const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

// Historial de conversación por número (en memoria, TTL 2 horas)
type HistoryItem = { role: 'user' | 'bot'; text: string };
const conversations = new Map<string, { messages: HistoryItem[]; lastActivity: number }>();
const HISTORY_TTL = 2 * 60 * 60 * 1000;

// Seguimiento de último mensaje del cliente y si ya se envió recordatorio
export const lastUserMessage = new Map<string, number>();
export const reminderSent = new Map<string, boolean>();

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

async function extractLeadInfo(history: HistoryItem[], phone: string) {
  const conversation = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Ale'}: ${h.text}`).join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: `De esta conversación extrae en JSON plano: "nombre" (nombre completo del cliente), "zona" (colonia o dirección mencionada), "transmision" ("Estándar" o "Automático", default "Estándar"), "horario" ("mañana", "tarde" o "fin-de-semana" según lo que pidió el cliente). Solo JSON sin texto extra.\n\n${conversation}`,
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
    .map((h) => `${h.role === 'user' ? 'Cliente' : 'Ale'}: ${h.text}`)
    .join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: `De esta conversación extrae en JSON plano los campos: "name" (nombre completo del cliente) y "address" (colonia, zona o dirección mencionada). Si no hay dato deja el campo vacío. Solo responde JSON, sin texto extra.\n\n${conversation}`,
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
  let messageType = 'text';

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
    messageType = message?.type ?? 'text';

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

    const history = getHistory(from);
    let syntheticMsg: string;

    try {
      const leadInfo = await extractLeadInfo(history, from);
      console.log('[WEBHOOK] Lead info extraída:', leadInfo);

      const slots = await getAvailableSlots(21);
      const pickedSlots = pickSlots(slots, leadInfo.horario);
      console.log('[WEBHOOK] Slots seleccionados:', pickedSlots);

      if (pickedSlots.length >= 4) {
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

        syntheticMsg = `El cliente (número de WhatsApp: ${from}) envió su comprobante y sus 4 clases quedaron AGENDADAS AUTOMÁTICAMENTE en Calendar:\n${fechasTexto}\n\nConfírmale esto de manera cordial. Indícale que el día anterior a su primera clase recibirá un mensaje con los datos del instructor.`;
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

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Registrar mensaje del cliente y resetear recordatorio si había respondido antes
  lastUserMessage.set(from, Date.now());
  reminderSent.set(from, false);

  try {
    const history = getHistory(from);
    console.log('[CHAT] 📩', from, '→ Ale:', textBody);
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
    console.log('[CHAT] 🤖 Ale →', from, ':', reply);

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
