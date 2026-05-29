import { NextRequest, NextResponse } from 'next/server';

const CURSOS = ['Reforzamiento', 'Avanzado', 'Estándar', 'Automático', 'Moto', 'Inglés', 'Intensivo', 'Mixto'];

export async function POST(request: NextRequest) {
  const { texto } = await request.json();
  if (!texto?.trim()) return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });

  const HOY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const DIA  = new Date().toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'America/Mexico_City' });

  const system = `Eres un parser de comandos de agenda para Auto Escuela Americana (escuela de manejo, CDMX).

Fecha de hoy: ${HOY} (${DIA}). Zona horaria: America/Mexico_City.
Cursos válidos: ${CURSOS.join(', ')}.
Mapea variaciones: "automatico"/"auto"→"Automático", "ingles"→"Inglés", "estandar"→"Estándar",
"moto"→"Moto", "intensivo"→"Intensivo", "reforzamiento"→"Reforzamiento",
"avanzado"→"Avanzado", "mixto"→"Mixto".

Acciones:
- "mover_clase": cambiar fecha/hora de clase existente
- "nueva_ficha": nuevo alumno o primera clase
- "cancelar_clase": cancelar/eliminar una clase
- "desconocido": no encaja en ninguna

Reglas:
- fecha: ISO YYYY-MM-DD calculada desde HOY. "mañana","el jueves","el sábado","el lunes" → fecha absoluta.
- hora: "HH:MM" 24h. "4"/"4pm"→"16:00". "10am"→"10:00". "en la tarde"→null (ambiguo). null si falta.
- confianza: 0.0–1.0 según qué tan completa y clara es la instrucción.
- falta_info: campos que faltan para ejecutar la acción. Ej: ["hora","curso"].

Devuelve SOLO JSON puro sin markdown:
{"accion":"...","alumno":null,"curso":null,"fecha":null,"hora":null,"confianza":0.0,"falta_info":[]}`;

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '';

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: texto }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    );
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const resultado = JSON.parse(raw);
    return NextResponse.json({ ok: true, resultado, texto });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al parsear';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
