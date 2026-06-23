import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsumeOTP } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  const { otp } = await request.json();
  if (!otp) return new NextResponse('Bad Request', { status: 400 });

  const phone = await validateAndConsumeOTP(String(otp).trim());
  if (!phone) return new NextResponse('Código inválido o expirado', { status: 401 });

  const res = new NextResponse('OK', { status: 200 });
  res.cookies.set('instructor_phone', phone, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/portal',
  });
  return res;
}
