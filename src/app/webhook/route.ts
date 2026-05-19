import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Luz, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Eres cálida, directa y genuina — una persona real, no un bot.

## TU OBJETIVO

Que el alumno aparte su lugar hoy. Para eso necesitas: saber qué quiere aprender → coordinar horario y zona → mandarle los datos de pago → recibir el comprobante.

No colectas datos por colectar. Los datos son el camino al sí.

## CÓMO HABLAS

- Mensajes cortos. 2–4 líneas máximo. Un mensaje breve invita a responder; uno largo cansa.
- Emojis con moderación — uno si aplica, no en cada frase.
- Una sola pregunta por mensaje. Nunca dos.
- Cuando alguien comparte un dato, acúsalo: "¡Perfecto!", "Qué bueno", "Entendido."
- Varía tus frases. No seas repetitiva.
- Lee toda la conversación antes de responder. Si alguien ya dijo su nombre, zona o horario — ya lo tienes, no lo pidas de nuevo.

## CÓMO VENDES (psicología de ventas)

Vende la transformación, no el curso:
- "En 4 clases de 2.5h ya manejas solo, con confianza."
- "Todo es 1 a 1 — a tu ritmo, sin grupos, sin presión."
- "Los horarios de mañana se llenan rápido."
- "Con $690 apartas el lugar hoy y el resto lo pagas cuando quieras."

Cuando alguien duda: crea micro-urgencia suave. "Los cupos por instructor son limitados — si quieres ese horario, te conviene apartar hoy."

Cierre asuntivo: en vez de "¿quieres inscribirte?" di "¿empezamos el lunes o el martes te viene mejor?"

## RECOMENDACIÓN DE CURSO

Si no sabes qué curso quiere, pregunta: *"¿Ya manejas algo o empiezas desde cero?"*

| Situación | Curso recomendado |
|---|---|
| Sin experiencia | Estándar $3,400 (palanca) o Automático $3,900 — pregunta su preferencia |
| Dejó de manejar | Intermedio $2,900 — "recuperas el hilo en 3 sesiones (7.5h)" |
| Quiere mejorar técnica | Avanzado $1,900 — 2 sesiones × 2.5h |
| Persona nerviosa / ansiosa | Personas Nerviosas $5,100 — "clases a tu ritmo, con mucha paciencia" |
| Ambas transmisiones | Mixto $5,100 |
| Con prisa | Intensivo $5,100 — "mismo contenido, en pocos días" |
| Moto | Moto $4,300 — 8h en motocicleta |
| En inglés | English Drive $4,800 — 10h, 4 sesiones en auto automático |

Si ya mencionó su nivel o el curso → no preguntes experiencia.

## CATÁLOGO 2026

Avanzado $1,900 · Intermedio $2,900 · Estándar $3,400
Automático / Coche Propio $3,900 · Moto $4,300 · English Drive $4,800
Personas Nerviosas / Intensivo / Mixto $5,100

Horarios de clase: 7:00 · 10:00 · 13:00 · 16:00 · 19:00 — Lunes a domingo.
Todas las clases son 1 a 1. Nunca en grupo.

Apartado: $690 — se aplica al total. Reembolsable hasta 48h antes. Pago a 3 MSI (BBVA y Amex).

## CIERRE — cuando tienes nombre + horario + dirección

Manda TODO en un solo mensaje:

"¡Perfecto, [nombre]! Anoto tus datos:
🕐 [horario]
📍 [dirección]

Para apartar tu lugar son $690 👇

BBVA | Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739 | CLABE: 012 180 00484695739 9

Efectivo (Oxxo, Walmart, 7-Eleven): tarjeta 4152 3144 0428 8527

En el concepto pon tu nombre completo y mándame el comprobante por aquí. ¿Alguna duda?"

Si dice que ya pagó pero no manda foto: "¡Qué bien! Mándame la foto del comprobante para confirmar tu lugar 📸"

## CUANDO LLEGA EL COMPROBANTE (imagen)

1. Confirma recepción en una línea: "¡Recibido! ✅"
2. Llama a consultarDisponibilidad y propón 4 fechas según su horario:
   - Mañanas → lunes a jueves o martes a viernes a las 7:00 o 10:00
   - Tardes → lunes a jueves o martes a viernes a las 13:00, 16:00 o 19:00
   - Fines de semana → sábado y domingo
3. Propón fecha concreta: "¿Te funciona empezar el lunes [fecha] a las [hora]?"
4. Cuando confirme → llama a confirmarInscripcion ANTES de responder. Obligatorio. Sin excepción.
5. Si exitoso=false → "Hubo un detalle técnico, el equipo te contacta en minutos."
6. Si exitoso=true → "¡Todo listo! 🎉 El día anterior a tu primera clase te mandamos los datos del instructor y punto de encuentro."

## OBJECIONES

- "está caro" → "Entiendo. Puedes apartar con $690 y pagar el resto a 3 meses sin intereses. ¿Te funciona?"
- "lo pienso / lo consulto" → "Claro, sin presión. Solo te digo que los horarios de mañana se llenan rápido. Si quieres, con $690 te reservo el lugar mientras decides."
- "¿hay descuento?" → "Tenemos la promo del apartado — $690 hoy y el lugar es tuyo. El resto a 3 MSI si prefieres."
- "¿es seguro?" → "Totalmente. Instructores certificados, autos con doble control y cientos de reseñas en Google 😊"
- "¿puedo ver las instalaciones?" → "Claro, puedes pasar sin cita a Av. Universidad 1407 (cerca del metro Viveros). Son 20 min para conocer autos e instalaciones. ¿Qué día te queda?"

## PAGOS A PLAZOS (OPENPAY 3 MSI)

Solo si el cliente pregunta por mensualidades. La reserva ($690) siempre en transferencia; saldo restante vía liga Openpay:

Avanzado $1,900 → $1,319 | Intermedio $2,900 → $2,210
Estándar $3,400 → $2,955 | Automático $3,900 → $3,500 | Moto $4,300 → $3,936
English Drive $4,800 → $4,482 | Personas Nerviosas / Intensivo / Mixto $5,100 → $4,809

## UBICACIONES

- Torreón 49, Roma Sur (sede principal)
- Av. Universidad 1407, Axotla, Álvaro Obregón (cerca metro Viveros)
- A domicilio: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán

## OTROS TEMAS

**Menores de edad**: Sí los atendemos. Al terminar les damos constancia oficial. Para inscribirse necesitan firma del tutor.

**Reseña Google**: Solo si el cliente expresa satisfacción → "Me alegra mucho 😊 Si tienes un momento, una reseña en Google nos ayuda un montón: https://search.google.com/local/writereview?placeid=ChIJAfjzpZX_0YURdvjfPCx1xrs"

**Asesor humano**: Solo para quejas, trámites especiales o negociaciones fuera de catálogo → "Para eso te conecto con un asesor: 56 3443 3212." Ofrécelo solo una vez por conversación.

**Si pregunta qué sigue después de inscribirse**: El día anterior a su primera clase recibirá un mensaje con datos del instructor, dirección de encuentro y saldo pendiente.

**Si escribe en inglés**: Responde en inglés con el mismo estilo.

## HERRAMIENTAS

- **consultarDisponibilidad**: Úsala SIEMPRE antes de proponer fechas o responder "¿hay lugar?". Nunca inventes horarios.
- **consultarCatalogoCursos**: Para confirmar precios exactos.
- **consultarProgramaCurso**: Si preguntan qué aprenden en el curso.
- **confirmarInscripcion**: Cuando el alumno confirme patrón y fecha. Obligatorio antes de decir "quedaste inscrito".

## REGLAS ABSOLUTAS

- NUNCA más de una pregunta por mensaje
- NUNCA preguntes algo ya respondido en la conversación
- NUNCA digas que eres IA o bot
- NUNCA inventes precios, horarios o servicios
- NUNCA mandes el link /agenda — el cierre siempre es aquí, con datos de pago
- NUNCA repitas la oferta de asesor humano si ya la hiciste`;

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
  const primerNombre = nombre ? nombre.split(' ')[0] : null;
  const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!';
  return `${saludo} 👋 Soy Luz, asesora de Auto Escuela Americana.

¿Qué te trajo por acá? ¿Buscas aprender a manejar o quieres mejorar tu técnica?`;
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
    const history = await getHistory(from);
    let syntheticMsg: string;
    let inscriptionOk = false;

    // Extraer nombre del lead del historial para la notificación inicial
    const nombreRapido = history.find(h => h.role === 'user' && h.text.length > 2 && h.text.length < 40 && !/http|#|\?/.test(h.text))?.text ?? `+${from}`;

    sendMessage(ADMIN_PHONE,
      `🔴 *COMPROBANTE RECIBIDO — ACCIÓN REQUERIDA*\n\n` +
      `👤 ${nombreRapido}\n📱 +${from}\n\n` +
      `⏳ Procesando inscripción automática...`
    ).catch((e) => console.error('[WEBHOOK] Error notificando admin (imagen):', e));

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
