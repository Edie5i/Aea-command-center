import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsumeOTP } from '@/lib/firestore';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  const { phone, otp } = await request.json();
  if (!phone || !otp) return new NextResponse('Bad Request', { status: 400 });

  const normalized = normalizePhone(String(phone));
  const verified = await validateAndConsumeOTP(normalized, String(otp).trim());
  if (!verified) return new NextResponse('Código inválido o expirado', { status: 401 });

  const res = new NextResponse('OK', { status: 200 });
  res.cookies.set('instructor_phone', verified, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/portal',
  });
  return res;
}
