import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

export async function GET(req: NextRequest) {
  // Sin parámetro → últimos 5 leads de registro_landing
  const phone = req.nextUrl.searchParams.get('phone');

  if (phone) {
    const normalized = phone.startsWith('52') ? phone : `52${phone.replace(/\D/g, '')}`;
    const snap = await db.collection('conversations').doc(normalized).get();
    if (!snap.exists) return NextResponse.json({ found: false });
    const d = snap.data()!;
    return NextResponse.json({ found: true, phone: d.phone, studentName: d.studentName, alcaldia: d.alcaldia, source: d.source, chatState: d.chatState });
  }

  const snap = await db.collection('conversations')
    .where('source', '==', 'registro_landing')
    .orderBy('lastActivity', 'desc')
    .limit(5)
    .get();

  return NextResponse.json(snap.docs.map(d => {
    const x = d.data();
    return { phone: x.phone, studentName: x.studentName, alcaldia: x.alcaldia, source: x.source, chatState: x.chatState };
  }));
}
