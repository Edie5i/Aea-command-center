import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone') ?? '5560150197';
  const normalized = phone.startsWith('52') ? phone : `52${phone.replace(/\D/g, '')}`;
  const snap = await db.collection('conversations').doc(normalized).get();
  if (!snap.exists) return NextResponse.json({ found: false, normalized });
  const d = snap.data()!;
  return NextResponse.json({
    found: true,
    phone: d.phone,
    contactName: d.contactName,
    studentName: d.studentName,
    alcaldia: d.alcaldia,
    source: d.source,
    chatState: d.chatState,
    lastMessage: d.lastMessage,
    lastActivity: d.lastActivity?.toMillis?.() ?? null,
  });
}
