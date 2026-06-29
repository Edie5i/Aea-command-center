import { NextRequest, NextResponse } from 'next/server';
import { saveInscripcionData } from '@/lib/firestore';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';

// Datos hardcodeados de Fernando Martinez — eliminar este endpoint después de usar
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const phone = '5215586163794';
  await saveInscripcionData(phone, {
    nombre: 'Fernando Martinez',
    telefono: phone,
    zona: 'Calle Puebla 345, Colonia Roma',
    curso: 'Automático',
    transmision: 'Automático',
    fechas: [
      { date: '2026-05-11', time: '10:00' },
      { date: '2026-05-12', time: '10:00' },
      { date: '2026-05-13', time: '10:00' },
      { date: '2026-05-14', time: '10:00' },
    ],
  });

  return NextResponse.json({ ok: true, phone, nombre: 'Fernando Martinez' });
}
