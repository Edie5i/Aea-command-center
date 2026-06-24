import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

async function sendWelcomeWA(phone: string, nombre: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;
  const firstName = nombre.split(' ')[0];
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: `¡Hola ${firstName}! 👋 Soy Luz, de Auto Escuela Americana. Ya recibimos tus datos — en un momento te cuento todo sobre nuestros cursos y te ayudo a elegir el que mejor te queda. 🚗`,
      },
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombreCompleto, alcaldia, celular } = body;

  if (!nombreCompleto?.trim() || !alcaldia?.trim() || !celular?.trim()) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos.' }, { status: 400 });
  }

  const phone = normalizePhone(celular);
  if (phone.length !== 12) {
    return NextResponse.json({ ok: false, error: 'Número de teléfono inválido.' }, { status: 400 });
  }

  const ref = db.collection('conversations').doc(phone);
  const snap = await ref.get();
  const welcomeAlreadySent = snap.data()?.welcomeRegistroSent === true;

  await ref.set({
    phone,
    studentName: nombreCompleto.trim(),
    alcaldia,
    source: 'registro_landing',
    chatState: 'frio',
    lastActivity: Timestamp.now(),
    lastMessage: '',
    lastSender: 'lead',
    messageCount: snap.data()?.messageCount ?? 0,
    reminder1hSent: false,
    reminder23hSent: false,
    welcomeRegistroSent: true,
  }, { merge: true });

  // Enviar bienvenida solo una vez por registro
  if (!welcomeAlreadySent) {
    sendWelcomeWA(phone, nombreCompleto.trim()).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
