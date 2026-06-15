import { NextRequest, NextResponse } from 'next/server';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;
  if (!mediaId || !WA_TOKEN) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    // Step 1: Get media URL from Meta
    const infoRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });
    if (!infoRes.ok) {
      return new NextResponse('Media not found', { status: 404 });
    }
    const info = await infoRes.json();

    // Step 2: Download actual media bytes
    const mediaRes = await fetch(info.url, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });
    if (!mediaRes.ok) {
      return new NextResponse('Media unavailable', { status: 502 });
    }

    const bytes = await mediaRes.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': info.mime_type ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('[MEDIA PROXY] Error:', e);
    return new NextResponse('Error', { status: 500 });
  }
}
