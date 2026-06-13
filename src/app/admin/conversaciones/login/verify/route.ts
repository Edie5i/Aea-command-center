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
    path: '/admin',
  });

  return res;
}
