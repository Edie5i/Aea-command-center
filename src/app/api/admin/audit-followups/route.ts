import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

// Diagnóstico temporal: leads con intervención humana (botPaused o chatLastBy
// 'humano') que todavía tienen un nextFollowupAt pendiente — riesgo de que el
// cron les mande un recordatorio automático encima de la atención humana.
const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? 'aea_migrate_2026';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret');
  if (secret !== MIGRATION_SECRET) {
    return new NextResponse('Forbidden — incluye header X-Migration-Secret', { status: 403 });
  }

  const snap = await db.collection('conversations').get();
  const riesgo: Array<Record<string, unknown>> = [];

  snap.forEach((doc) => {
    const d = doc.data();
    const humano = d.botPaused === true || d.chatLastBy === 'humano';
    if (humano && d.nextFollowupAt) {
      riesgo.push({
        phone: doc.id,
        contactName: d.contactName ?? null,
        chatState: d.chatState ?? null,
        chatLastBy: d.chatLastBy ?? null,
        botPaused: d.botPaused ?? false,
        nextFollowupAt: d.nextFollowupAt?.toDate?.()?.toISOString?.() ?? String(d.nextFollowupAt),
      });
    }
  });

  return NextResponse.json({
    total_conversaciones: snap.size,
    en_riesgo: riesgo.length,
    detalle: riesgo,
  });
}
