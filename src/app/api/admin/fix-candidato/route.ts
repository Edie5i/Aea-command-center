import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

// Endpoint temporal de un solo uso: limpia los falsos positivos de
// INSTRUCTOR_REGEX (clientes de curso que quedaron atrapados hablando con
// Marco en vez de Luz). Acepta ?phones=a,b,c y marca cada uno como
// 'rechazado' para que esCandidatoExistente() deje de bloquear su regreso
// a Luz. Se removerá después de usarse.
const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? 'aea_migrate_2026';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret');
  if (secret !== MIGRATION_SECRET) {
    return new NextResponse('Forbidden — incluye header X-Migration-Secret', { status: 403 });
  }

  const phonesParam = request.nextUrl.searchParams.get('phones');
  if (!phonesParam) {
    return new NextResponse('Falta ?phones=a,b,c', { status: 400 });
  }
  const phones = phonesParam.split(',').map(p => p.trim()).filter(Boolean);

  const results: Array<Record<string, unknown>> = [];
  for (const phone of phones) {
    const ref = db.collection('candidatos_instructor').doc(phone);
    const snap = await ref.get();
    if (!snap.exists) {
      results.push({ phone, ok: false, error: 'No existe candidato con ese phone' });
      continue;
    }
    const before = snap.data();
    await ref.set(
      {
        estado: 'rechazado',
        razonRechazo: 'Falso positivo de INSTRUCTOR_REGEX — es cliente de curso, no candidato instructor',
        actualizadoEn: Date.now(),
      },
      { merge: true }
    );
    results.push({ phone, ok: true, before });
  }

  return NextResponse.json({ results });
}
