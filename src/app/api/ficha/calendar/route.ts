import { NextRequest, NextResponse } from 'next/server';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await scheduleAndCreateEvents(body);
    return NextResponse.json({ ok: true, created: result.created, total: result.total });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al crear eventos';
    console.error('[FICHA] Error en calendario:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
