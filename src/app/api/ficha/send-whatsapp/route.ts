import { NextRequest, NextResponse } from 'next/server';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

export async function POST(req: NextRequest) {
  const { phone, pdfBase64, filename, caption } = (await req.json()) as {
    phone: string;
    pdfBase64: string;
    filename: string;
    caption?: string;
  };

  if (!phone || !pdfBase64 || !filename) {
    return NextResponse.json({ ok: false, error: 'Faltan parámetros' }, { status: 400 });
  }
  if (!WA_TOKEN || !PHONE_ID) {
    return NextResponse.json({ ok: false, error: 'WhatsApp no configurado' }, { status: 500 });
  }

  // 1. Subir PDF a WhatsApp Media API
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');
  formData.append(
    'file',
    new Blob([pdfBuffer], { type: 'application/pdf' }),
    filename
  );

  const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error('[send-whatsapp] Upload error:', err);
    return NextResponse.json({ ok: false, error: 'Error subiendo PDF a WhatsApp' }, { status: 502 });
  }

  const { id: mediaId } = (await uploadRes.json()) as { id: string };

  // 2. Enviar documento al número del lead
  const sendRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'document',
      document: {
        id: mediaId,
        filename,
        caption: caption ?? '📋 Tu ficha — Auto Escuela Americana',
      },
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    console.error('[send-whatsapp] Send error:', err);
    return NextResponse.json({ ok: false, error: 'Error enviando documento por WhatsApp' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
