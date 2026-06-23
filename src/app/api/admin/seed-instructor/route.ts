import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

export async function POST(req: NextRequest) {
  const { phone, nombre } = await req.json();

  const normalized = phone.startsWith('52') ? phone : `52${phone}`;
  await db.collection('candidatos_instructor').doc(normalized).set({
    phone: normalized,
    nombre: nombre ?? 'Instructor prueba',
    estado: 'activo',
    transmisiones: 'ambas',
    zonas: 'Roma, Condesa',
    rating: 4.9,
    aniosManejando: 5,
    licenciaB: true,
    creadoEn: Date.now(),
    actualizadoEn: Date.now(),
  });

  return NextResponse.json({ ok: true, phone: normalized });
}
