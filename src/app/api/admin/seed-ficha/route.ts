import { NextRequest, NextResponse } from 'next/server';
import { saveInscripcionData } from '@/lib/firestore';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const phone  = request.nextUrl.searchParams.get('phone')  ?? '';
  const nombre = request.nextUrl.searchParams.get('nombre') ?? '';

  if (!phone || !nombre) {
    return NextResponse.json({ error: 'Faltan phone y nombre' }, { status: 400 });
  }

  const zona       = request.nextUrl.searchParams.get('zona')       ?? '';
  const transmision= request.nextUrl.searchParams.get('transmision')?? 'Estándar';
  const fechasRaw  = request.nextUrl.searchParams.get('fechas')     ?? '';

  let fechas: Array<{ date: string; time: string }> = [];
  try { fechas = JSON.parse(fechasRaw); } catch { /* vacío */ }

  await saveInscripcionData(phone, { nombre, telefono: phone, zona, transmision, fechas });

  return NextResponse.json({ ok: true, phone, nombre });
}
