// Sirve comprobantes del bucket privado SOLO con el PIN de admin (cookie).
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import '@/lib/firestore'; // asegura init del admin SDK
import { BUCKET_COMPROBANTES } from '@/lib/comprobantes';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path') ?? '';
  // Solo objetos de comprobantes o fichas de respaldo, sin traversal
  const prefijoValido = path.startsWith('comprobantes/') || path.startsWith('fichas/');
  if (!prefijoValido || path.includes('..')) {
    return new NextResponse('Ruta inválida', { status: 400 });
  }

  try {
    const file = getStorage(getApp()).bucket(BUCKET_COMPROBANTES).file(path);
    const [meta] = await file.getMetadata();
    const [buf] = await file.download();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': (meta.contentType as string) ?? 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[COMPROBANTE] Error sirviendo', path, e);
    return new NextResponse('No encontrado', { status: 404 });
  }
}
