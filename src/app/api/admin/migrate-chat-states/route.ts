import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// Autenticación: X-Migration-Secret header (distinto al token de webhook)
const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? 'aea_migrate_2026';

const CHAT_STATE_FIELDS = [
  'chatState', 'chatReason', 'chatUrgency', 'chatLastBy', 'chatLastPreview',
  'courseInterest', 'coursePrice', 'qualifiedAt', 'followUpsSent',
  'nextFollowupAt', 'closedAt', 'closedOutcome', 'contactName',
];

function defaultsForDoc(data: Record<string, unknown>) {
  const lastActivity = data.lastActivity as Timestamp | undefined;
  const lastSender = data.lastSender as string | undefined;
  const silenceMs = Date.now() - (lastActivity?.toMillis?.() ?? Date.now());

  let chatState = 'luz_atendiendo';
  let chatReason = 'Estado inicial (migración)';

  if (silenceMs > 7 * 24 * 60 * 60 * 1000) {
    chatState = 'frio';
    chatReason = `Sin actividad por ${Math.floor(silenceMs / 86400000)} días (migración)`;
  } else if (lastSender === 'bot' || lastSender === 'ale') {
    chatState = 'esperando_cliente';
    chatReason = 'Último mensaje fue de Luz (migración)';
  }

  return {
    chatState,
    chatReason,
    chatUrgency: 'ninguna',
    chatLastBy: lastSender === 'bot' || lastSender === 'ale' ? 'luz' : 'cliente',
    chatLastPreview: String(data.lastMessage ?? '').slice(0, 200),
    courseInterest: null,
    coursePrice: null,
    qualifiedAt: null,
    followUpsSent: [],
    nextFollowupAt: null,
    closedAt: null,
    closedOutcome: null,
    contactName: null,
  };
}

// GET /api/admin/migrate-chat-states?dry=true   → muestra qué tocaría
// GET /api/admin/migrate-chat-states?dry=false  → aplica los cambios
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret');
  if (secret !== MIGRATION_SECRET) {
    return new NextResponse('Forbidden — incluye header X-Migration-Secret', { status: 403 });
  }

  const dry = request.nextUrl.searchParams.get('dry') !== 'false';

  const snap = await db.collection('conversations').get();
  const toMigrate: Array<{ phone: string; missing: string[]; defaults: Record<string, unknown> }> = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const missing = CHAT_STATE_FIELDS.filter(f => !(f in data));
    if (missing.length === 0) continue;

    const defaults = defaultsForDoc(data);
    toMigrate.push({ phone: doc.id, missing, defaults });
  }

  if (dry) {
    return NextResponse.json({
      mode: 'dry-run',
      total_conversations: snap.size,
      need_migration: toMigrate.length,
      already_migrated: snap.size - toMigrate.length,
      preview: toMigrate.slice(0, 20), // primeros 20 para no saturar la respuesta
    });
  }

  // Aplicar en batches de 500 (límite de Firestore)
  let migrated = 0;
  const BATCH_SIZE = 400;

  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = toMigrate.slice(i, i + BATCH_SIZE);
    for (const { phone, defaults } of chunk) {
      batch.set(db.collection('conversations').doc(phone), defaults, { merge: true });
    }
    await batch.commit();
    migrated += chunk.length;
  }

  return NextResponse.json({
    mode: 'applied',
    migrated,
    skipped: snap.size - migrated,
  });
}
