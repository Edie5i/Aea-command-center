import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'falta phone' }, { status: 400 });
  const normalized = phone.startsWith('52') ? phone : `52${phone.replace(/\D/g, '')}`;
  const snap = await db.collection('conversations').doc(normalized).get();
  if (!snap.exists) return NextResponse.json({ found: false });
  const d = snap.data()!;
  return NextResponse.json({
    found: true,
    phone: d.phone,
    studentName: d.studentName,
    alcaldia: d.alcaldia,
    source: d.source,
    chatState: d.chatState,
    lastActivity: d.lastActivity?.toMillis?.() ?? null,
  });
}
