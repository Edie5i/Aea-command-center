// POST /api/transcribe
// Recibe un blob de audio (FormData field "audio") y devuelve la transcripción
// usando Gemini 2.5 Flash. Fallback para browsers sin SpeechRecognition (Firefox).

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as Blob | null;
    if (!audio) {
      return NextResponse.json({ ok: false, error: 'Falta el campo audio' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Falta GOOGLE_GENERATIVE_AI_API_KEY' }, { status: 500 });
    }

    const bytes = await audio.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = audio.type || 'audio/webm';

    const body = {
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: 'Transcribe exactamente lo que dice esta grabación de voz en español mexicano. Devuelve SOLO el texto transcrito, sin explicaciones ni comillas.',
          },
        ],
      }],
      generationConfig: { temperature: 0 },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!text) {
      return NextResponse.json({ ok: false, error: 'No se pudo transcribir el audio' }, { status: 422 });
    }

    return NextResponse.json({ ok: true, text });
  } catch (err: any) {
    console.error('[transcribe]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Error' }, { status: 500 });
  }
}
