import { NextRequest, NextResponse } from 'next/server';
import { getCandidato, generateInstructorOTP } from '@/lib/firestore';
import { normalizePhone } from '@/lib/phone';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

async function sendWA(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone) return new NextResponse('Bad Request', { status: 400 });

  const normalized = normalizePhone(String(phone));

  const candidato = await getCandidato(normalized);
  if (!candidato || candidato.estado !== 'activo') {
    return new NextResponse('No autorizado', { status: 403 });
  }

  const otp = await generateInstructorOTP(normalized);
  await sendWA(normalized, `Tu código de acceso al portal UrbDriver: *${otp}*\n\nVálido por 10 minutos. No lo compartas.`);

  return new NextResponse('OK', { status: 200 });
}
