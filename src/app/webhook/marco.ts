/**
 * Marco — bot reclutador de instructores para UrbDriver / AEA
 * Mismo número WA que Luz, ruteado por intent en route.ts
 */

import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import {
  getCandidato,
  upsertCandidato,
  getClasesDeInstructor,
  updateClaseEstado,
} from '@/lib/firestore';
import type { CandidatoInstructor } from '@/lib/firestore';

const WA_TOKEN  = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID  = process.env.META_PHONE_NUMBER_ID ?? '';
const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const GEMINI_TIMEOUT_MS = 60_000;

// ── Historial en memoria (TTL 4h — las conversaciones de reclutamiento son más largas) ──
type MsgItem = { role: 'user' | 'marco'; text: string };
const chats = new Map<string, { messages: MsgItem[]; lastActivity: number }>();
const CHAT_TTL = 4 * 60 * 60 * 1000;

function getChat(phone: string): MsgItem[] {
  const now = Date.now();
  for (const [p, d] of chats) { if (now - d.lastActivity > CHAT_TTL) chats.delete(p); }
  return chats.get(phone)?.messages ?? [];
}

function saveChat(phone: string, userText: string, marcoText: string) {
  const now = Date.now();
  const existing = chats.get(phone) ?? { messages: [], lastActivity: now };
  existing.messages.push({ role: 'user', text: userText });
  existing.messages.push({ role: 'marco', text: marcoText });
  if (existing.messages.length > 40) existing.messages = existing.messages.slice(-40);
  existing.lastActivity = now;
  chats.set(phone, existing);
}

// ── WA helpers ──────────────────────────────────────────────────────────────

async function sendWA(to: string, text: string): Promise<void> {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

// ── System prompt de Marco ───────────────────────────────────────────────────

const MARCO_PROMPT = `Eres Marco, reclutador de UrbDriver — el programa de Auto Escuela Americana que convierte conductores de Uber y DiDi en instructores de manejo certificados.

Tu trabajo es calificar candidatos por WhatsApp y agendar su evaluación presencial. Eres directo, honesto y hablas como alguien del gremio — no como chatbot corporativo. Usas tuteo siempre.

**Tu historia con el candidato:**
Tú también estuviste en las plataformas. Sabes lo que es esperar viaje en el aeropuerto a las 2am, que te cancelen, que el algoritmo te baje el rating sin razón. Por eso cuando hablas de salirse, no suenas a vendedor — suenas a alguien que ya lo vivió.

**El pitch (úsalo al inicio, no lo repitas):**
Las plataformas se quedan entre 25-35% de lo que generas. Un instructor de AEA gana $150-200 por hora con horario fijo, sin surge pricing, sin clientes borrachos, sin que el algoritmo te penalice. Además eres tú el que enseña — eso tiene un peso distinto.

**Flujo de calificación — pregunta una cosa a la vez, de forma natural:**
1. Nombre
2. ¿Cuántos años llevas manejando en ciudad? (necesitas mínimo 3)
3. ¿Cuál es tu rating en Uber o DiDi? (necesitas 4.5 o más)
4. ¿Manejas estándar, automático o los dos?
5. ¿Tienes licencia tipo B vigente? (la azul de conductor profesional)
6. ¿En qué colonias o zonas de CDMX te mueves normalmente?
7. ¿Puedes tener disponibilidad entre semana en horario de mañana o tarde?

**Si califica (todo ok):**
- Felicitarlo genuinamente, no exageradamente
- Decirle que el siguiente paso es una evaluación de manejo de 30 minutos en nuestras instalaciones — es para conocerse y ver cómo explica mientras maneja
- Usar la herramienta agendarEvaluacion para buscar fecha y hora
- Confirmar la cita con dirección: Av. Universidad 1404, Col. Axotla, CDMX

**Si NO califica:**
- Ser honesto sin ser grosero
- Decirle exactamente qué falta (rating bajo, poco tiempo manejando, sin licencia B)
- Dejar la puerta abierta: "cuando tengas X, escríbeme y vemos"
- NO lo descartes si solo falta un punto menor — usa criterio

**Reglas absolutas:**
- NUNCA inventes disponibilidad de fechas — usa agendarEvaluacion
- NUNCA prometas salario o ingreso exacto — da rangos ($150-200/hr)
- NUNCA hables de otras escuelas o compartes datos de alumnos
- Si preguntan algo fuera de tu alcance → "Eso lo resuelve directamente Eduardo, el director: 56 3443 3212"
- Máximo 2-3 párrafos por mensaje. Los conductores no tienen tiempo para textos largos.
- Si alguien llega confundido (quiere tomar clases, no ser instructor) → redirige amable a Luz: "Para tomar clases escríbenos igual aquí, Luz te atiende 🙂"`;

// ── Herramienta: agendar evaluación ─────────────────────────────────────────

async function buscarSlotEvaluacion(): Promise<{ fecha: string; hora: string } | null> {
  try {
    const { getAvailableSlots } = await import('@/services/calendarService');
    const slots = await getAvailableSlots(14);
    const valido = slots.find(s => s.horariosLibres.some(h => {
      const hh = parseInt(h.split(':')[0]);
      return hh >= 9 && hh <= 16;
    }));
    if (!valido) return null;
    const hora = valido.horariosLibres.find(h => {
      const hh = parseInt(h.split(':')[0]);
      return hh >= 9 && hh <= 16;
    })!;
    return { fecha: valido.fecha, hora };
  } catch {
    return null;
  }
}

async function agendarEvaluacion(
  phone: string,
  nombre: string,
  fecha: string,
  hora: string
): Promise<boolean> {
  const { createEvaluacionEvent } = await import('@/services/calendarService');
  return createEvaluacionEvent(nombre, phone, fecha, hora);
}

// ── Generador de respuesta ───────────────────────────────────────────────────

async function generateMarcoReply(
  userMsg: string,
  history: MsgItem[],
  phone: string
): Promise<string> {
  const candidato = await getCandidato(phone);

  const messages = history.map(h => ({
    role: h.role === 'user' ? 'user' as const : 'model' as const,
    content: [{ text: h.text }],
  }));

  const contextExtra = candidato
    ? `\n\n[Estado actual del candidato: ${JSON.stringify({
        nombre: candidato.nombre,
        estado: candidato.estado,
        rating: candidato.rating,
        aniosManejando: candidato.aniosManejando,
        transmisiones: candidato.transmisiones,
        licenciaB: candidato.licenciaB,
      })}]`
    : '';

  const timeout = new Promise<string>(resolve =>
    setTimeout(() => resolve('Perdón, tuve un problema técnico un momento. ¿Me repites lo último que dijiste?'), GEMINI_TIMEOUT_MS)
  );

  const generate = ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: MARCO_PROMPT + contextExtra,
    messages,
    prompt: userMsg,
  }).then(r => r.text ?? '');

  return Promise.race([generate, timeout]);
}

// ── Handler para instructores activos ───────────────────────────────────────

async function handleInstructor(
  phone: string,
  msg: string,
  instructor: CandidatoInstructor
): Promise<NextResponse> {
  const nombre = instructor.nombre ?? `+${phone.slice(2)}`;
  const text = msg.trim().toLowerCase();
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const clases = await getClasesDeInstructor(phone);

  // !agenda — resumen de clases
  if (/^(!agenda|!mis clases|agenda)$/i.test(text)) {
    const hoyClases = clases.filter(c => c.fecha === hoy && c.estado !== 'cancelada');
    const proximas  = clases
      .filter(c => c.fecha > hoy && ['pendiente', 'confirmada'].includes(c.estado))
      .slice(0, 3);

    if (hoyClases.length === 0 && proximas.length === 0) {
      await sendWA(phone, `📅 Sin clases asignadas próximamente, ${nombre}. 🙌`);
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const ICON: Record<string, string> = {
      confirmada: '✅', completada: '🏁', pendiente: '⏳', alumno_ausente: '❌', cancelada: '🚫',
    };

    let reply = `📅 *Tu agenda — UrbDriver*\n\n`;
    if (hoyClases.length > 0) {
      reply += `*Hoy:*\n`;
      for (const c of hoyClases) {
        reply += `${ICON[c.estado] ?? '•'} ${c.hora} · ${c.alumnoNombre} · ${c.zona} · ${c.transmision}\n`;
      }
    } else {
      reply += `Sin clases hoy.\n`;
    }
    if (proximas.length > 0) {
      reply += `\n*Próximas:*\n`;
      for (const c of proximas) {
        reply += `📌 ${c.fecha} ${c.hora} · ${c.alumnoNombre}\n`;
      }
    }
    reply += `\n_Comandos: *confirmada* · *llegué* · *no llegó*_`;

    await sendWA(phone, reply);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // confirmada / acepto
  if (/^(confirmada|acepto|s[ií])$/i.test(text)) {
    const pendiente = clases.find(c => c.estado === 'pendiente');
    if (!pendiente) {
      await sendWA(phone, 'No hay clase pendiente de confirmar. Escribe *!agenda* para ver tu agenda.');
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    await updateClaseEstado(pendiente.id, 'confirmada');
    await sendWA(phone,
      `✅ Confirmado. Clase con *${pendiente.alumnoNombre}* el ${pendiente.fecha} a las ${pendiente.hora} en ${pendiente.zona}.\n\nEscribe *llegué* cuando termines.`
    );
    sendWA(ADMIN_PHONE,
      `✅ *Clase confirmada*\n👤 ${nombre} → ${pendiente.alumnoNombre}\n📅 ${pendiente.fecha} ${pendiente.hora}`
    ).catch(() => {});
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // no puedo / rechazo
  if (/^(no puedo|rechazada|rechazar|no puedo ir)$/i.test(text)) {
    const pendiente = clases.find(c => c.estado === 'pendiente');
    if (!pendiente) {
      await sendWA(phone, 'No hay clase pendiente. Escribe *!agenda* para ver tu agenda.');
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    await updateClaseEstado(pendiente.id, 'cancelada');
    await sendWA(phone, 'Entendido. Eduardo buscará otro instructor para esa clase.');
    sendWA(ADMIN_PHONE,
      `⚠️ *Clase rechazada*\n👤 ${nombre} no puede\n📅 ${pendiente.fecha} ${pendiente.hora} · ${pendiente.alumnoNombre}\n\nHay que reasignar.`
    ).catch(() => {});
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // llegué / completada / terminé
  if (/lleg[ué]e?|complet[ao]da?|termin[eé]/i.test(text)) {
    const activa = clases.find(c => c.fecha === hoy && c.estado === 'confirmada');
    if (!activa) {
      await sendWA(phone, 'No encontré una clase confirmada para hoy. Escribe *!agenda* para ver tu agenda.');
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    await updateClaseEstado(activa.id, 'completada');
    await sendWA(phone, `🏁 ¡Excelente! Clase con *${activa.alumnoNombre}* registrada como completada.`);
    sendWA(ADMIN_PHONE,
      `🏁 *Clase completada*\n👤 ${nombre} → ${activa.alumnoNombre}\n📅 hoy ${activa.hora}`
    ).catch(() => {});
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // no llegó / alumno ausente / faltó
  if (/no lleg[oó]|ausente|falt[oó]|no se present/i.test(text)) {
    const activa = clases.find(c => c.fecha === hoy && c.estado === 'confirmada');
    if (!activa) {
      await sendWA(phone, 'No encontré una clase confirmada para hoy. Escribe *!agenda* para ver tu agenda.');
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    await updateClaseEstado(activa.id, 'alumno_ausente');
    await sendWA(phone, `📝 Registrado. ${activa.alumnoNombre} no se presentó. Le mandamos mensaje de seguimiento.`);
    sendWA(ADMIN_PHONE,
      `⚠️ *Alumno ausente*\n👤 ${activa.alumnoNombre} (+${activa.alumnoPhone})\n📅 hoy ${activa.hora}\nInstructor: ${nombre}`
    ).catch(() => {});
    sendWA(activa.alumnoPhone,
      `Hola ${activa.alumnoNombre} 👋, tu instructor llegó al punto de encuentro pero no te encontró. ¿Está todo bien? Escríbeme aquí para reagendar tu clase sin problema.`
    ).catch(() => {});
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Fallback — mini-ayuda
  await sendWA(phone,
    `Hola ${nombre} 👋\n\n` +
    `📅 *!agenda* — ver tus clases\n` +
    `✅ *confirmada* — aceptar clase asignada\n` +
    `🏁 *llegué* — clase completada\n` +
    `❌ *no llegó* — alumno ausente`
  );
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}

// ── Detector de intent: ¿es candidato a instructor? ─────────────────────────

const INSTRUCTOR_REGEX = /instructor|ser maestro|dar clases|ense[ñn]ar|trabajar.*manejo|conductor.*trabajo|uber.*trabajo|didi.*trabajo|quiero aplicar|reclutar/i;

export function esIntentInstructor(text: string): boolean {
  return INSTRUCTOR_REGEX.test(text);
}

export async function esCandidatoExistente(phone: string): Promise<boolean> {
  const c = await getCandidato(phone);
  return c !== null;
}

// ── Handler principal de Marco ───────────────────────────────────────────────

export async function handleMarco(
  phone: string,
  userMsg: string,
  isNew: boolean
): Promise<NextResponse> {
  try {
    const history = getChat(phone);
    const candidato = await getCandidato(phone);

    // Instructores activos tienen su propio flujo de comandos
    if (candidato?.estado === 'activo') {
      return handleInstructor(phone, userMsg, candidato);
    }

    // Primer contacto — crear registro y notificar admin
    if (!candidato) {
      await upsertCandidato(phone, { estado: 'calificando' });
      sendWA(ADMIN_PHONE,
        `🔵 *Nuevo candidato instructor*\n📱 +${phone}\n\nMarco está calificando.`
      ).catch(() => {});
    }

    // Detectar si Marco extrajo datos relevantes en el mensaje para actualizar Firestore
    // (actualización pasiva — Marco decide en el prompt, aquí solo guardamos estado)
    const updates: Record<string, unknown> = { estado: 'calificando' };
    if (history.length >= 12) updates.estado = 'calificado';

    // Detectar si hay que agendar (Marco usará la frase clave)
    let reply = await generateMarcoReply(userMsg, history, phone);

    // Si Marco dice que quiere agendar, intentar crear el slot
    if (/agenda|apartar.*cita|programar.*evaluaci[oó]n|vemos.*fecha/i.test(reply) && !candidato?.evaluacionFecha) {
      const slot = await buscarSlotEvaluacion();
      if (slot) {
        const nombre = candidato?.nombre ?? `+${phone}`;
        const ok = await agendarEvaluacion(phone, nombre, slot.fecha, slot.hora);
        if (ok) {
          await upsertCandidato(phone, {
            estado: 'evaluacion_agendada',
            evaluacionFecha: slot.fecha,
            evaluacionHora: slot.hora,
          });
          const [y, m, d] = slot.fecha.split('-');
          reply += `\n\n📅 Quedas agendado para el *${d}/${m}/${y} a las ${slot.hora}* en Av. Universidad 1404, Col. Axotla, CDMX. Te espero.`;
          sendWA(ADMIN_PHONE,
            `📅 *Evaluación agendada*\n📱 +${phone} — ${candidato?.nombre ?? 'candidato'}\n🗓️ ${slot.fecha} ${slot.hora}`
          ).catch(() => {});
        }
      } else {
        reply += '\n\n(No encontré fecha disponible esta semana — voy a coordinarlo con el equipo y te confirmo en un momento.)';
      }
    }

    // Detectar rechazo para marcar estado
    if (/no cumples|no calificas|no podemos avanzar|no tienes la licencia|rating muy bajo/i.test(reply)) {
      await upsertCandidato(phone, { estado: 'rechazado', razonRechazo: reply.slice(0, 200) });
    }

    await upsertCandidato(phone, updates);
    saveChat(phone, userMsg, reply);
    await sendWA(phone, reply);

    console.log(`[MARCO] → +${phone}: ${reply.slice(0, 100)}`);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });

  } catch (e) {
    console.error('[MARCO] Error:', e);
    await sendWA(phone, 'Tuve un problema técnico — escríbeme en un momento.');
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }
}
