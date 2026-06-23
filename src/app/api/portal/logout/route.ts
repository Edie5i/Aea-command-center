import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.redirect(new URL('/portal/login', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.autoescuelaamericana.com'));
  res.cookies.set('instructor_phone', '', { maxAge: 0, path: '/portal' });
  return res;
}
