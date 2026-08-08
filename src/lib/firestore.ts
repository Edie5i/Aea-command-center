import { randomInt } from 'node:crypto';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { decidirOtp, OTP_TTL_MS, OTP_MAX_INTENTOS } from '@/lib/otp-policy';

function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({ projectId: 'aea-25-85385059-83402' });
}

initAdmin();

export const db = getFirestore(getApp());

const convDoc = (phone: string) => db.collection('conversations').doc(phone);
const messagesCol = (phone: string) => convDoc(phone).collection('messages');

// ── Chat state types ───────────────────────────────────────────────────────────

export type ChatState =
  | 'tu_turno'
  | 'luz_atendiendo'
  | 'esperando_cliente'
  | 'atascado'
  | 'cerrado'
  | 'frio';

export type ChatUrgency = 'alta' | 'media' | 'baja' | 'ninguna';
export type ChatLastBy = 'cliente' | 'luz' | 'humano';
export type StateChangeTrigger = 'mensaje_cliente' | 'mensaje_luz' | 'cron' | 'manual';

export interface FollowUpRecord {
  at: Timestamp;
  type: '2h' | '24h' | '72h' | '7d';
}

export interface StateHistoryEntry {
  from: ChatState | null;
  to: ChatState;
  reason: string;
  timestamp: Timestamp;
  trigger: StateChangeTrigger;
}

// ── Core message/conversation types ───────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Timestamp;
  mediaId?: string;
  mediaType?: 'image';
}

export interface Conversation {
  phone: string;
  lastActivity: Timestamp;
  lastLeadActivity: Timestamp;
  lastMessage: string;
  lastSender: 'lead' | 'bot';
  messageCount: number;
  reminder1hSent: boolean;
  reminder23hSent: boolean;
  source?: string;
  chatState?: ChatState;
  chatReason?: string;
  chatUrgency?: ChatUrgency;
  chatLastBy?: ChatLastBy;
  chatLastPreview?: string;
  botPaused?: boolean;
  courseInterest?: string | null;
  coursePrice?: string | null;
  qualifiedAt?: Timestamp | null;
  followUpsSent?: FollowUpRecord[];
  nextFollowupAt?: Timestamp | null;
  closedAt?: Timestamp | null;
  closedOutcome?: 'ganado' | 'perdido' | null;
  contactName?: string | null;
  leadCalificadoNotificado?: boolean;
  // Mensaje de un alumno ya inscrito (chatState 'cerrado') que Luz no contesta.
  // Se etiqueta acá en vez de mandar WhatsApp al admin para no saturarlo — se revisa
  // desde el dashboard.
  postCierreAlerta?: { texto: string; tipo: string; at: Timestamp } | null;
  // Forma cruda en Firestore: fechaConfirmacion es Timestamp aquí, no millis.
  // rawToInscripcion() la convierte a number para los Client Components.
  inscripcion?: Omit<InscripcionData, 'fechaConfirmacion'> & { fechaConfirmacion: Timestamp };
}

async function appendMessage(
  phone: string,
  role: 'user' | 'bot',
  text: string,
  lastSender: 'lead' | 'bot',
): Promise<void> {
  const now = Timestamp.now();
  const batch = db.batch();
  batch.set(
    convDoc(phone),
    { lastActivity: now, lastMessage: text, lastSender, messageCount: FieldValue.increment(1) },
    { merge: true }
  );
  batch.set(messagesCol(phone).doc(), { role, text, timestamp: now });
  await batch.commit();
}

export async function saveImageMessage(phone: string, mediaId: string, botText: string): Promise<void> {
  const now = Timestamp.now();
  // Ver comentario en saveConversationMessage: el bot va 1ms después para que el
  // orden de 'timestamp' sea determinista.
  const despues = Timestamp.fromMillis(now.toMillis() + 1);
  const batch = db.batch();
  batch.set(convDoc(phone), {
    phone, lastActivity: despues, lastMessage: botText,
    lastSender: 'bot', messageCount: FieldValue.increment(2),
  }, { merge: true });
  batch.set(messagesCol(phone).doc(), { role: 'user', text: '[imagen]', mediaId, mediaType: 'image', timestamp: now });
  batch.set(messagesCol(phone).doc(), { role: 'bot', text: botText, timestamp: despues });
  await batch.commit();
}

export async function saveUserMessage(phone: string, text: string): Promise<void> {
  return appendMessage(phone, 'user', text, 'lead');
}

export async function saveBotMessage(phone: string, text: string): Promise<void> {
  return appendMessage(phone, 'bot', text, 'bot');
}

export async function saveConversationMessage(
  phone: string,
  userText: string,
  botText: string
): Promise<void> {
  const now = Timestamp.now();
  // El mensaje del bot va 1ms después: con el mismo timestamp, orderBy('timestamp')
  // desempata por ID de documento (esencialmente al azar) y recalculateChatState podía
  // creer que el cliente habló último cuando en realidad fue Luz — la conversación se
  // quedaba pegada en 'luz_atendiendo' sin pasar nunca a 'esperando_cliente'.
  const despues = Timestamp.fromMillis(now.toMillis() + 1);
  const batch = db.batch();
  batch.set(convDoc(phone), {
    phone, lastActivity: despues, lastMessage: botText,
    lastSender: 'bot', messageCount: FieldValue.increment(2),
  }, { merge: true });
  batch.set(messagesCol(phone).doc(), { role: 'user', text: userText, timestamp: now });
  batch.set(messagesCol(phone).doc(), { role: 'bot', text: botText, timestamp: despues });
  await batch.commit();
}

export async function saveLeadSource(phone: string, source: string): Promise<void> {
  await convDoc(phone).set({ source }, { merge: true });
}

export async function updateLeadActivity(phone: string): Promise<void> {
  const now = Timestamp.now();
  await convDoc(phone).set(
    { phone, lastLeadActivity: now, reminder1hSent: false, reminder23hSent: false },
    { merge: true }
  );
}

export async function getPendingReminders(type: '1h' | '23h'): Promise<Conversation[]> {
  const now = Date.now();
  const ms = type === '1h' ? 60 * 60 * 1000 : 23 * 60 * 60 * 1000;
  const windowMs = 30 * 60 * 1000;
  const cutoffMax = Timestamp.fromMillis(now - ms);
  const cutoffMin = Timestamp.fromMillis(now - ms - windowMs);
  const sentField = type === '1h' ? 'reminder1hSent' : 'reminder23hSent';

  // Filter by time range only to avoid a composite index requirement
  const snap = await db.collection('conversations')
    .where('lastLeadActivity', '<=', cutoffMax)
    .where('lastLeadActivity', '>=', cutoffMin)
    .get();

  return snap.docs
    .map(d => d.data() as Conversation)
    .filter(c => c[sentField] !== true);
}

export async function markReminderSent(phone: string, type: '1h' | '23h'): Promise<void> {
  const field = type === '1h' ? 'reminder1hSent' : 'reminder23hSent';
  await convDoc(phone).set({ [field]: true }, { merge: true });
}

// Sin límite y sin orderBy en la query, a propósito. El `.orderBy('lastActivity')
// .limit(50)` anterior truncaba de dos formas: mostraba 50 de 154 conversaciones,
// y además Firestore excluye de un orderBy los documentos que no tienen ese campo
// — 32 hoy — así que esos no aparecían en el panel por más que se subiera el
// límite. El orden se resuelve en memoria, donde un lastActivity ausente se trata
// como el más viejo en lugar de desaparecer.
export async function getConversations(): Promise<Conversation[]> {
  const snap = await db.collection('conversations').get();
  return snap.docs
    // El doc.id es el teléfono; si al doc le falta el campo `phone` (docs viejos),
    // esto evita un phone undefined que rompe displayPhone() en el dashboard.
    .map(d => ({ phone: d.id, ...d.data() }) as Conversation)
    .sort((a, b) => (b.lastActivity?.toMillis?.() ?? 0) - (a.lastActivity?.toMillis?.() ?? 0));
}

export async function getConversationMessages(phone: string): Promise<ChatMessage[]> {
  const snap = await messagesCol(phone).orderBy('timestamp', 'asc').get();
  return snap.docs.map(d => d.data() as ChatMessage);
}

export interface InscripcionData {
  nombre: string;
  telefono: string;
  zona: string;
  calle?: string;
  numero?: string;
  colonia?: string;
  curso: string;
  transmision: string;
  fechas: Array<{ date: string; time: string }>;
  fechaConfirmacion: number; // millis — serializable para Client Components
  status?: 'pre_reserva' | 'confirmado'; // undefined = confirmado (retrocompat)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawToInscripcion(ins: Record<string, any>, fallbackPhone: string): InscripcionData {
  return {
    nombre: ins.nombre ?? '',
    telefono: ins.telefono ?? fallbackPhone,
    zona: ins.zona ?? '',
    curso: ins.curso ?? ins.transmision ?? 'Estándar',
    transmision: ins.transmision ?? 'Estándar',
    fechas: ins.fechas ?? [],
    fechaConfirmacion: ins.fechaConfirmacion?.toMillis?.() ?? Date.now(),
    status: ins.status ?? undefined,
  };
}

export async function saveInscripcionData(
  phone: string,
  data: Omit<InscripcionData, 'fechaConfirmacion'>,
  origen: 'web' | 'luz' = 'luz'
): Promise<void> {
  await convDoc(phone).set(
    { inscripcion: { ...data, status: 'confirmado', fechaConfirmacion: Timestamp.now() } },
    { merge: true }
  );

  // La ficha de /admin/reservas es lo único que lee ese panel. Antes cada caller
  // de saveInscripcionData decidía por su cuenta si también llamaba a guardarFicha
  // — confirmarInscripcionTool y los endpoints de admin nunca lo hacían, así que la
  // clase quedaba creada en Calendar pero invisible en el panel. Ahora es parte de
  // la misma operación: toda inscripción confirmada, sin importar de dónde venga,
  // se refleja en la ficha. Se usa actualizarFicha (no guardarFicha) porque
  // preserva depositoPagado/comprobanteURL si ya se habían guardado antes.
  try {
    const { actualizarFicha } = await import('@/lib/fichaLuz');
    const { PRECIO_CURSO } = await import('@/lib/precios');
    const telefonoFicha = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    await actualizarFicha(phone, {
      studentName: data.nombre,
      curso: data.curso,
      precio: PRECIO_CURSO[data.curso] ?? 0,
      opcionesFechaHora: data.fechas.map((f) => `${f.date} ${f.time}`),
      zona: data.zona,
      telefono: telefonoFicha,
      origen,
    });
  } catch (e) {
    console.error('[FICHA] Error sincronizando ficha desde saveInscripcionData:', e);
  }
}

export async function savePreReserva(
  phone: string,
  data: Omit<InscripcionData, 'fechaConfirmacion' | 'status'>
): Promise<void> {
  const snap = await convDoc(phone).get();
  const existing = snap.data()?.inscripcion;
  // No sobreescribir si ya hay una inscripción confirmada
  if (existing && (!existing.status || existing.status === 'confirmado')) return;
  await convDoc(phone).set(
    { inscripcion: { ...data, status: 'pre_reserva', fechaConfirmacion: Timestamp.now() } },
    { merge: true }
  );
}

export async function buscarInscripcionPorNombre(nombre: string): Promise<(InscripcionData & { phone: string })[]> {
  const snap = await db.collection('conversations').get();
  const q = nombre.toLowerCase();
  const results: (InscripcionData & { phone: string })[] = [];
  for (const doc of snap.docs) {
    const ins = doc.data().inscripcion;
    if (ins?.nombre?.toLowerCase().includes(q) && ins.fechas?.length > 0) {
      results.push({ ...rawToInscripcion(ins, doc.id), phone: doc.id });
    }
  }
  return results;
}

export async function getInscripcionData(phone: string): Promise<InscripcionData | null> {
  const snap = await convDoc(phone).get();
  const ins = snap.data()?.inscripcion;
  if (!ins) return null;
  return rawToInscripcion(ins, phone);
}

export async function getRecentInscripciones(limit = 50): Promise<(InscripcionData & { phone: string })[]> {
  const snap = await db.collection('conversations').get();
  const results: (InscripcionData & { phone: string })[] = [];
  for (const doc of snap.docs) {
    const ins = doc.data().inscripcion;
    if (ins?.nombre && (ins.fechas?.length > 0 || ins.status === 'pre_reserva')) {
      results.push({ ...rawToInscripcion(ins, doc.id), phone: doc.id });
    }
  }
  results.sort((a, b) => b.fechaConfirmacion - a.fechaConfirmacion);
  return results.slice(0, limit);
}

// ── UrbDriver — Candidatos a instructor ───────────────────────────────────────

export type EstadoCandidato =
  | 'nuevo'
  | 'calificando'
  | 'calificado'
  | 'evaluacion_agendada'
  | 'activo'
  | 'rechazado';

export interface CandidatoInstructor {
  phone: string;
  nombre?: string;
  aniosManejando?: number;
  rating?: number;
  transmisiones?: 'estandar' | 'automatico' | 'ambas';
  licenciaB?: boolean;
  zonas?: string;
  disponibilidad?: string;
  estado: EstadoCandidato;
  razonRechazo?: string;
  evaluacionFecha?: string;
  evaluacionHora?: string;
  portalOtp?: string;
  portalOtpExpires?: number;
  portalOtpIntentos?: number;
  portalOtpSentAt?: number;
  portalOtpWindowStart?: number;
  portalOtpSendCount?: number;
  creadoEn: number;
  actualizadoEn: number;
}

export async function getCandidato(phone: string): Promise<CandidatoInstructor | null> {
  const snap = await db.collection('candidatos_instructor').doc(phone).get();
  if (!snap.exists) return null;
  return snap.data() as CandidatoInstructor;
}

export async function upsertCandidato(
  phone: string,
  data: Partial<Omit<CandidatoInstructor, 'phone' | 'creadoEn'>>
): Promise<void> {
  const ref = db.collection('candidatos_instructor').doc(phone);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set({ ...data, actualizadoEn: Date.now() }, { merge: true });
  } else {
    await ref.set({ phone, estado: 'nuevo', ...data, creadoEn: Date.now(), actualizadoEn: Date.now() });
  }
}

export { OTP_TTL_MS, OTP_MAX_INTENTOS } from '@/lib/otp-policy';

const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const OTP_MAX_POR_VENTANA = 5;

export async function generateInstructorOTP(phone: string): Promise<string> {
  // randomInt y no Math.random: el generador de V8 es un xorshift128+ sembrado
  // por proceso, no un CSPRNG — quien llegue a ver una tirada de salidas puede
  // derivar el estado y predecir las siguientes. Aquí la salida es la única
  // credencial del portal. randomInt toma del CSPRNG del sistema y además
  // reparte parejo en el rango, sin el sesgo del truncado.
  const otp = String(randomInt(100000, 1000000));
  await db.collection('candidatos_instructor').doc(phone).set(
    // El contador de intentos arranca en cero: si no, un código nuevo heredaría
    // los fallos del anterior y nacería casi quemado.
    { portalOtp: otp, portalOtpExpires: Date.now() + OTP_TTL_MS, portalOtpIntentos: 0 },
    { merge: true }
  );
  return otp;
}

/**
 * Límite de envío de OTP por teléfono: 1 por minuto y 5 por hora.
 * Vive en Firestore y no en memoria porque App Hosting corre varias instancias
 * y un contador local se saltaría con sólo caer en otra.
 * Consume una unidad del límite; sólo llamar cuando de verdad se va a enviar.
 */
export async function consumeOtpRateLimit(
  phone: string
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const ref = db.collection('candidatos_instructor').doc(phone);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, retryAfterSec: OTP_COOLDOWN_MS / 1000 };

    const data = snap.data() as CandidatoInstructor;
    const now = Date.now();

    const enfriamiento = OTP_COOLDOWN_MS - (now - (data.portalOtpSentAt ?? 0));
    if (enfriamiento > 0) {
      return { ok: false, retryAfterSec: Math.ceil(enfriamiento / 1000) };
    }

    let windowStart = data.portalOtpWindowStart ?? 0;
    let count = data.portalOtpSendCount ?? 0;
    if (now - windowStart >= OTP_WINDOW_MS) {
      windowStart = now;
      count = 0;
    }
    if (count >= OTP_MAX_POR_VENTANA) {
      return { ok: false, retryAfterSec: Math.ceil((windowStart + OTP_WINDOW_MS - now) / 1000) };
    }

    tx.set(
      ref,
      { portalOtpSentAt: now, portalOtpWindowStart: windowStart, portalOtpSendCount: count + 1 },
      { merge: true }
    );
    return { ok: true, retryAfterSec: 0 };
  });
}

export type OtpValidacion =
  | { ok: true; phone: string }
  | { ok: false; reason: 'invalido' | 'bloqueado' };

/**
 * Valida el OTP contra el teléfono que lo pidió. El código NUNCA se busca por
 * sí solo: se lee el documento del instructor y se compara ahí. Así un código
 * adivinado sólo sirve para la cuenta a la que se emitió.
 *
 * A los 5 fallos el código se quema y hay que pedir otro, lo cual está limitado
 * a 5 por hora — el techo real de adivinanzas queda en 25/hora contra 900000.
 *
 * Todo en una transacción: el contador se leía y escribía por separado, así que
 * ráfagas en paralelo se pisaban entre sí y el límite se podía rebasar.
 * 'invalido' cubre por igual código incorrecto, expirado e instructor
 * inexistente, para no revelar cuál de los tres fue.
 */
export async function validateAndConsumeOTP(phone: string, otp: string): Promise<OtpValidacion> {
  const ref = db.collection('candidatos_instructor').doc(phone);
  const limpio = { portalOtp: null, portalOtpExpires: null, portalOtpIntentos: 0 };

  return db.runTransaction<OtpValidacion>(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, reason: 'invalido' };

    const data = snap.data() as CandidatoInstructor;
    // La decisión vive en @/lib/otp-policy para poder probarse; aquí sólo se
    // traduce a escrituras.
    const decision = decidirOtp(data, otp, Date.now(), OTP_MAX_INTENTOS);

    switch (decision.accion) {
      case 'aceptar':
        tx.set(ref, limpio, { merge: true });
        return { ok: true, phone: snap.id };
      case 'invalidar':
        tx.set(ref, limpio, { merge: true });
        return { ok: false, reason: decision.motivo === 'agotado' ? 'bloqueado' : 'invalido' };
      case 'rechazar':
        tx.set(ref, { portalOtpIntentos: decision.intentos }, { merge: true });
        return { ok: false, reason: 'invalido' };
      default:
        return { ok: false, reason: 'invalido' };
    }
  });
}

export async function getCandidatos(estado?: EstadoCandidato): Promise<CandidatoInstructor[]> {
  let q: FirebaseFirestore.Query = db.collection('candidatos_instructor');
  if (estado) q = q.where('estado', '==', estado);
  const snap = await q.orderBy('creadoEn', 'desc').get();
  return snap.docs.map(d => d.data() as CandidatoInstructor);
}

// ── Fichas de progreso ─────────────────────────────────────────────────────────

export interface Ficha {
  studentName: string;
  phone: string;
  date: Timestamp;
  completedTopics: string[];
  pendingTopics: string[];
  totalTopics: number;
  completedCount: number;
}

export interface FichaWithId extends Ficha {
  id: string;
  dateMillis: number;
}

function toFichaWithId(d: FirebaseFirestore.QueryDocumentSnapshot): FichaWithId {
  const data = d.data() as Ficha;
  return { ...data, id: d.id, dateMillis: data.date.toMillis() };
}

export async function saveFicha(data: Omit<Ficha, 'date'>): Promise<string> {
  const ref = db.collection('fichas').doc();
  await ref.set({ ...data, date: Timestamp.now() });
  return ref.id;
}

export async function getRecentFichas(limit = 20): Promise<FichaWithId[]> {
  const snap = await db.collection('fichas').orderBy('date', 'desc').limit(limit).get();
  return snap.docs.map(toFichaWithId);
}

export async function getFichasByPhone(phone: string): Promise<FichaWithId[]> {
  const snap = await db.collection('fichas')
    .where('phone', '==', phone)
    .orderBy('date', 'desc')
    .get();
  return snap.docs.map(toFichaWithId);
}

export async function getFichasStats(): Promise<{
  total: number;
  thisWeek: number;
  uniqueStudents: number;
}> {
  const weekAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snap = await db.collection('fichas').get();
  const all = snap.docs.map(d => d.data() as Ficha);
  const thisWeek = all.filter(f => f.date.toMillis() >= weekAgo.toMillis()).length;
  const uniqueStudents = new Set(all.map(f => f.phone)).size;
  return { total: all.length, thisWeek, uniqueStudents };
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface MetricsData {
  totalLeads: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  byState: Partial<Record<ChatState, number>>;
  closedGanado: number;
  closedPerdido: number;
  bySource: Record<string, number>;
  byCourse: Record<string, number>;
}

export async function getMetricsData(): Promise<MetricsData> {
  const snap = await db.collection('conversations').get();
  const all = snap.docs.map(d => d.data() as Conversation);

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const monthStart = now - 30 * 24 * 60 * 60 * 1000;

  const byState: Partial<Record<ChatState, number>> = {};
  const bySource: Record<string, number> = {};
  const byCourse: Record<string, number> = {};
  let activeToday = 0, activeThisWeek = 0, activeThisMonth = 0;
  let closedGanado = 0, closedPerdido = 0;

  for (const conv of all) {
    const state: ChatState = conv.chatState ?? 'luz_atendiendo';
    byState[state] = (byState[state] ?? 0) + 1;

    const ms = conv.lastActivity?.toMillis?.() ?? 0;
    if (ms >= todayStart.getTime()) activeToday++;
    if (ms >= weekStart) activeThisWeek++;
    if (ms >= monthStart) activeThisMonth++;

    if (conv.closedOutcome === 'ganado') closedGanado++;
    if (conv.closedOutcome === 'perdido') closedPerdido++;

    const src = conv.source ?? 'Directo';
    bySource[src] = (bySource[src] ?? 0) + 1;

    if (conv.courseInterest) {
      byCourse[conv.courseInterest] = (byCourse[conv.courseInterest] ?? 0) + 1;
    }
  }

  return {
    totalLeads: all.length,
    activeToday,
    activeThisWeek,
    activeThisMonth,
    byState,
    closedGanado,
    closedPerdido,
    bySource,
    byCourse,
  };
}

// ── UrbDriver — Clases asignadas ──────────────────────────────────────────────

export type EstadoClase =
  | 'pendiente'
  | 'confirmada'
  | 'completada'
  | 'alumno_ausente'
  | 'cancelada';

export interface ClaseAsignada {
  id: string;
  alumnoPhone: string;
  alumnoNombre: string;
  instructorPhone: string;
  instructorNombre: string;
  fecha: string;       // YYYY-MM-DD
  hora: string;        // HH:mm
  zona: string;
  transmision: string;
  curso: string;
  estado: EstadoClase;
  calendarEventId?: string;
  notificadoEn?: number;
  creadoEn: number;
}

export async function createClaseAsignada(
  data: Omit<ClaseAsignada, 'id' | 'creadoEn'>
): Promise<string> {
  const ref = db.collection('clases_asignadas').doc();
  await ref.set({ ...data, id: ref.id, creadoEn: Date.now() });
  return ref.id;
}

export async function getClasesDeInstructor(phone: string): Promise<ClaseAsignada[]> {
  const snap = await db.collection('clases_asignadas')
    .where('instructorPhone', '==', phone)
    .orderBy('creadoEn', 'desc')
    .get();
  return snap.docs.map(d => d.data() as ClaseAsignada);
}

export async function getClasesActivas(): Promise<ClaseAsignada[]> {
  const snap = await db.collection('clases_asignadas')
    .where('estado', 'in', ['pendiente', 'confirmada'])
    .orderBy('creadoEn', 'desc')
    .get();
  return snap.docs.map(d => d.data() as ClaseAsignada);
}

export async function updateClaseEstado(id: string, estado: EstadoClase): Promise<void> {
  await db.collection('clases_asignadas').doc(id).set({ estado }, { merge: true });
}

// ── Chat state management ──────────────────────────────────────────────────────

export async function logStateChange(
  phone: string,
  from: ChatState | null,
  to: ChatState,
  reason: string,
  trigger: StateChangeTrigger
): Promise<void> {
  const entry: StateHistoryEntry = { from, to, reason, timestamp: Timestamp.now(), trigger };
  await convDoc(phone).collection('state_history').add(entry);
}

// Logs to state_history when state actually changes.
export async function updateChatState(
  phone: string,
  update: {
    chatState: ChatState;
    chatReason: string;
    chatUrgency: ChatUrgency;
    chatLastBy?: ChatLastBy;
    chatLastPreview?: string;
    courseInterest?: string | null;
    coursePrice?: string | null;
    qualifiedAt?: Timestamp | null;
    nextFollowupAt?: Timestamp | null;
    closedAt?: Timestamp | null;
    closedOutcome?: 'ganado' | 'perdido' | null;
    contactName?: string | null;
  },
  trigger: StateChangeTrigger
): Promise<void> {
  const ref = convDoc(phone);
  const snap = await ref.get();
  const prev = (snap.data()?.chatState ?? null) as ChatState | null;

  await ref.set(update, { merge: true });

  if (prev !== update.chatState) {
    await logStateChange(phone, prev, update.chatState, update.chatReason, trigger);
  }
}

// Uninitialized docs (no chatState) are treated as 'luz_atendiendo'.
export async function getConversationsFiltered(
  state?: ChatState
): Promise<Conversation[]> {
  const snap = await db.collection('conversations').orderBy('lastActivity', 'desc').limit(100).get();
  const all = snap.docs.map(d => d.data() as Conversation);
  if (!state) return all;
  return all.filter(c => (c.chatState ?? 'luz_atendiendo') === state);
}

export async function getConversation(phone: string): Promise<Conversation | null> {
  const snap = await convDoc(phone).get();
  if (!snap.exists) return null;
  return snap.data() as Conversation;
}

// Returns messages in ascending order (newest read last).
export async function getRecentMessages(phone: string, limit = 6): Promise<ChatMessage[]> {
  const snap = await messagesCol(phone)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => d.data() as ChatMessage).reverse();
}
