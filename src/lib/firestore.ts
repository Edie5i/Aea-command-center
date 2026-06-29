import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

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
  const batch = db.batch();
  batch.set(convDoc(phone), {
    phone, lastActivity: now, lastMessage: botText,
    lastSender: 'bot', messageCount: FieldValue.increment(2),
  }, { merge: true });
  batch.set(messagesCol(phone).doc(), { role: 'user', text: '[imagen]', mediaId, mediaType: 'image', timestamp: now });
  batch.set(messagesCol(phone).doc(), { role: 'bot', text: botText, timestamp: now });
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
  const batch = db.batch();
  batch.set(convDoc(phone), {
    phone, lastActivity: now, lastMessage: botText,
    lastSender: 'bot', messageCount: FieldValue.increment(2),
  }, { merge: true });
  batch.set(messagesCol(phone).doc(), { role: 'user', text: userText, timestamp: now });
  batch.set(messagesCol(phone).doc(), { role: 'bot', text: botText, timestamp: now });
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

export async function getConversations(): Promise<Conversation[]> {
  const snap = await db.collection('conversations')
    .orderBy('lastActivity', 'desc')
    .limit(50)
    .get();
  return snap.docs.map(d => d.data() as Conversation);
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
  data: Omit<InscripcionData, 'fechaConfirmacion'>
): Promise<void> {
  await convDoc(phone).set(
    { inscripcion: { ...data, status: 'confirmado', fechaConfirmacion: Timestamp.now() } },
    { merge: true }
  );
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

export async function generateInstructorOTP(phone: string): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await db.collection('candidatos_instructor').doc(phone).set(
    { portalOtp: otp, portalOtpExpires: Date.now() + 60 * 60 * 1000 },
    { merge: true }
  );
  return otp;
}

export async function validateAndConsumeOTP(otp: string): Promise<string | null> {
  const snap = await db.collection('candidatos_instructor')
    .where('portalOtp', '==', otp)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as CandidatoInstructor;
  if (!data.portalOtpExpires || Date.now() > data.portalOtpExpires) return null;
  await doc.ref.set({ portalOtp: null, portalOtpExpires: null }, { merge: true });
  return doc.id;
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
