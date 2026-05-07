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
- Moto → Moto ($4,300)
- Ambas transmisiones → Mixto ($5,100)
- Con prisa → Intensivo ($5,100)
- En inglés → English Drive ($4,800)

Si ya mencionó su nivel o el curso que quiere → no preguntes experiencia.

## CATÁLOGO 2026

Reforzamiento $1,800 | Avanzado $1,900 | Intermedio $2,600
Estándar $3,400 | Automático $3,900 | Coche Propio $3,900
Moto $4,300 | English Drive $4,800
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

Cuando tienes los 4 → cierre:

"¡Perfecto, [nombre]! Anoto tus datos:
🕐 Horario: [horario]
📍 [calle] [número], [colonia], [alcaldía]
Para apartar tu lugar son $690. ¿Te mando los datos de pago?"

Cuando confirme → manda exactamente:

"¡Claro! Aquí los datos 👇

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

Una vez que la inscripción quede confirmada (eventos agendados en Calendar), pide el correo de forma natural al final:
"¡Todo listo! 🎉 ¿Me compartes tu correo para enviarte la confirmación por escrito?"

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
- Agendar clase: https://app.autoescuelaamericana.com/agenda
- Curso en inglés: https://app.autoescuelaamericana.com/english-course
- Términos y condiciones: https://app.autoescuelaamericana.com/terminos

## ROL DE LUZ EN LA OPERACIÓN

Luz es el primer punto de contacto de AEA. Atiende por el número 55 6320 6338 (línea de ventas y nuevos clientes). El número principal (56 3443 3212) lo atienden asesores humanos — para alumnos activos, seguimiento y casos especiales.

## CUÁNDO PASAR A UN ASESOR HUMANO

Si hay una situación que Luz no puede resolver — trámites de licencia específicos, situaciones médicas, quejas, negociaciones fuera del catálogo — no inventes ni supongas. Ofrece conectar.

"Buena pregunta. Para darte la mejor respuesta, déjame conectarte con un asesor. Puedes escribirle al 56 3443 3212, o si prefieres dime tu disponibilidad y te llamamos."

Solo cuando genuinamente lo requiera. No para preguntas simples.

## REGLAS

- NUNCA hagas una pregunta que ya fue respondida en la conversación
- NUNCA hagas más de una pregunta por mensaje
- NUNCA digas que eres IA o un bot
- NUNCA inventes precios o servicios
- NUNCA repitas el saludo
- NUNCA preguntes "¿las clases son para ti o para alguien más?"

## HERRAMIENTAS DISPONIBLES

- **consultarDisponibilidad**: Úsala SIEMPRE que alguien pregunte por disponibilidad, fechas, si hay lugar, cuándo puede empezar. No inventes horarios.
- **consultarCatalogoCursos**: Para confirmar precios exactos o comparar cursos.
- **consultarProgramaCurso**: Si alguien pregunta qué aprende en el curso.
- **confirmarInscripcion**: Crea las 4 clases en Calendar y notifica al equipo. Úsala cuando el alumno confirme patrón y fecha de inicio tras enviar comprobante.

Si alguien pregunta "¿hay lugar?", llama a consultarDisponibilidad antes de responder.`;

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const MSG_FALLBACK = 'Déjame verificarlo con el equipo y te escribo en un momento.';
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
  const conversation = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`).join('\n');
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
    .map((h) => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`)
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
