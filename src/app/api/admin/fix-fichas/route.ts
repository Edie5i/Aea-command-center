import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

// Endpoint temporal de un solo uso: inspecciona y borra fichas duplicadas de
// prueba (ej. "Ana Prueba") de la colección fichas. Sin ?deleteIds solo lista
// coincidencias por studentName; con ?deleteIds=a,b borra esos docs.
// Se removerá después de usarse.
const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? 'aea_migrate_2026';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret');
  if (secret !== MIGRATION_SECRET) {
    return new NextResponse('Forbidden — incluye header X-Migration-Secret', { status: 403 });
  }

  const studentName = request.nextUrl.searchParams.get('studentName');
  if (!studentName) {
    return new NextResponse('Falta ?studentName=...', { status: 400 });
  }

  const deleteIdsParam = request.nextUrl.searchParams.get('deleteIds');
  if (deleteIdsParam) {
    const ids = deleteIdsParam.split(',').map(id => id.trim()).filter(Boolean);
    const deleted: string[] = [];
    for (const id of ids) {
      await db.collection('fichas').doc(id).delete();
      deleted.push(id);
    }
    return NextResponse.json({ deleted });
  }

  const snap = await db.collection('fichas').where('studentName', '==', studentName).get();
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ matches });
}
