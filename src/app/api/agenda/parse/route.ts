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

Reglas de parseo:
- fecha: ISO YYYY-MM-DD calculada SIEMPRE desde HOY=${HOY}.
  "mañana"→${new Date(new Date().getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })}.
  "el lunes/martes/miércoles/jueves/viernes/sábado/domingo" → próximo día de esa semana desde HOY.
  Si la fecha ya pasó esta semana, usa la de la semana siguiente.
  null solo si es imposible inferirla.
- hora: "HH:MM" 24h. "4"/"4pm"/"4 de la tarde"→"16:00". "10"/"10am"→"10:00". "7"→"07:00".
  "en la tarde" sin número→null. null solo si es imposible inferirla.
- curso: solo incluir en falta_info si la acción es "nueva_ficha". Para mover/cancelar, curso no es requerido.
- confianza: 0.0–1.0.
  0.9–1.0: acción clara, alumno identificado, fecha y hora resueltas.
  0.7–0.89: falta un dato menor (ej. curso en nueva_ficha) pero lo esencial está.
  0.5–0.69: falta fecha u hora.
  <0.5: muy ambiguo.
- falta_info: SOLO campos verdaderamente bloqueantes. Para mover_clase/cancelar_clase: nunca incluir "curso".

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
