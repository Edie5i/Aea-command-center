import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({ projectId: 'aea-25-85385059-83402' });
}

initAdmin();

export const db = getFirestore(getApp(), 'default');

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Timestamp;
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
}

export async function saveConversationMessage(
  phone: string,
  userText: string,
  botText: string
) {
  const now = Timestamp.now();
  const convRef = db.collection('conversations').doc(phone);
  const messagesRef = convRef.collection('messages');

  const batch = db.batch();

  batch.set(
    convRef,
    {
      phone,
      lastActivity: now,
      lastMessage: botText,
      lastSender: 'ale',
      messageCount: FieldValue.increment(2),
    },
    { merge: true }
  );

  batch.set(messagesRef.doc(), { role: 'user', text: userText, timestamp: now });
  batch.set(messagesRef.doc(), { role: 'bot', text: botText, timestamp: now });

  await batch.commit();
}

export async function updateLeadActivity(phone: string): Promise<void> {
  const now = Timestamp.now();
  await db.collection('conversations').doc(phone).set(
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

  // Solo filtra por rango de tiempo para evitar índice compuesto
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
  await db.collection('conversations').doc(phone).set({ [field]: true }, { merge: true });
}

export async function getConversations(): Promise<Conversation[]> {
  const snap = await db
    .collection('conversations')
    .orderBy('lastActivity', 'desc')
    .limit(50)
    .get();

  return snap.docs.map(d => d.data() as Conversation);
}

export async function getConversationMessages(phone: string): Promise<ChatMessage[]> {
  const snap = await db
    .collection('conversations')
    .doc(phone)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .get();

  return snap.docs.map(d => d.data() as ChatMessage);
}
