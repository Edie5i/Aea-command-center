import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({ projectId: 'aea-25-85385059-83402' });
}

initAdmin();

export const db = getFirestore();

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Timestamp;
}

export interface Conversation {
  phone: string;
  lastActivity: Timestamp;
  lastMessage: string;
  lastSender: 'lead' | 'ale';
  messageCount: number;
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
