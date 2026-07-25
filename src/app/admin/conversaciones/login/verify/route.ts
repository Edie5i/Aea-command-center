import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin !== ADMIN_PIN) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const res = new NextResponse('OK', { status: 200 });
  res.cookies.set('admin_pin', ADMIN_PIN, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    // path '/' (no '/admin') para que la cookie también llegue a las APIs de admin
    // bajo /api/admin/* (ej. /api/admin/comprobante) y /api/asignar-clase. Con
    // path '/admin' el navegador no la enviaba y esas rutas daban 401.
    path: '/',
  });

  return res;
}
