import { NextRequest, NextResponse } from 'next/server';
import { classifyClientMessage } from '@/ai/flows/classify-client-message';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';

// GET /api/admin/test-classifier?token=...&msg=está+caro&ctx=Luz:+el+curso+está+en+$3400
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const msg = request.nextUrl.searchParams.get('msg');
  if (!msg) {
    return NextResponse.json({ error: 'Falta parámetro ?msg=' }, { status: 400 });
  }

  // ctx es opcional — puede repetirse para dar múltiples líneas de contexto
  const ctx = request.nextUrl.searchParams.getAll('ctx');

  const result = await classifyClientMessage(msg, ctx);

  return NextResponse.json({ msg, ctx, result }, { status: 200 });
}
