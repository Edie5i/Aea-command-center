import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

// Endpoint temporal de un solo uso: corrige el falso positivo de
// INSTRUCTOR_REGEX que atrapó a un lead real (Beatriz) hablando con Marco
// en vez de Luz. Marca el registro como 'rechazado' para que
// esCandidatoExistente() deje de bloquear su regreso a Luz. Se removerá
// después de usarse.
const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? 'aea_migrate_2026';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret');
  if (secret !== MIGRATION_SECRET) {
    return new NextResponse('Forbidden — incluye header X-Migration-Secret', { status: 403 });
  }

  const phone = request.nextUrl.searchParams.get('phone');
  if (!phone) {
    return new NextResponse('Falta ?phone=', { status: 400 });
  }

  const ref = db.collection('candidatos_instructor').doc(phone);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: 'No existe candidato con ese phone' });
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

  return NextResponse.json({ ok: true, phone, before });
}
