import { NextRequest, NextResponse } from 'next/server';

const CURSOS = ['Reforzamiento', 'Avanzado', 'Estándar', 'Automático', 'Moto', 'Inglés', 'Intensivo', 'Mixto'];

export async function POST(request: NextRequest) {
  const { texto } = await request.json();
  if (!texto?.trim()) return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });

  const HOY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const DIA  = new Date().toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'America/Mexico_City' });

  const system = `Eres un parser de comandos de agenda para Auto Escuela Americana (escuela de manejo, CDMX).
El personal habla en español mexicano informal. Interpreta frases coloquiales con tolerancia.

Fecha de hoy: ${HOY} (${DIA}). Zona horaria: America/Mexico_City.
Cursos válidos: ${CURSOS.join(', ')}.
Mapea variaciones: "automatico"/"auto"/"automática"→"Automático", "ingles"/"inglés"→"Inglés",
"estandar"/"standar"/"estándar"→"Estándar", "moto"/"motocicleta"→"Moto",
"intensivo"→"Intensivo", "reforza"/"reforzamiento"→"Reforzamiento",
"avanzado"→"Avanzado", "mixto"→"Mixto".

Acciones — elige la más probable según el contexto:
- "mover_clase": mover/pasar/cambiar/recorrer/jalar una clase ya existente a otra fecha/hora.
  Frases: "pásale", "muévele", "cámbiala", "jalala", "recórrela", "ponla mejor el...".
- "cancelar_clase": cancelar/quitar/borrar/eliminar una clase.
  Frases: "cancela", "quítala", "bórrala", "ya no va", "no viene".
- "nueva_ficha": agendar a un alumno nuevo o crear primera clase.
  Frases: "nuevo alumno", "nueva ficha", "agrégalo", "inscribe a", "va a empezar".
- "agendar_ficha": subir al Google Calendar las clases de una ficha YA existente.
  Frases: "mete al calendar", "súbela al gc", "ponla en el calendario", "agéndala en gc",
  "mete las clases de X", "sube la ficha de X", "al calendario a X".
- "consultar_agenda": ver qué clases hay en un día o semana.
  Frases: "¿qué hay mañana?", "¿quién tiene clase el viernes?", "¿qué tenemos esta semana?",
  "muéstrame el jueves", "¿está ocupado el lunes a las 10?", "clases de hoy".
- "consultar_alumno": ver info completa de un alumno: ficha, avance, clases próximas.
  Frases: "¿cómo va X?", "búscame a X", "¿qué tiene X?", "info de X", "dime de X", "ficha de X".
- "desconocido": no encaja en ninguna.

Reglas de parseo:
- fecha: ISO YYYY-MM-DD calculada SIEMPRE desde HOY=${HOY}.
  "mañana"→${new Date(new Date().getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })}.
  "el lunes/martes/miércoles/jueves/viernes/sábado/domingo" → próximo día desde HOY (si ya pasó esta semana, siguiente semana).
  "pasado mañana"→HOY+2. null solo si realmente no se puede inferir.
- hora: "HH:MM" 24h. "4"/"4pm"/"4 de la tarde"/"a las cuatro"→"16:00". "10"/"10am"/"diez"→"10:00".
  "7"/"siete"→"07:00". "mediodía"→"12:00". "en la tarde" sin número→null.
- alumno: nombre completo o parcial. Si dice "la de Juan" o "el de Pérez", extrae el nombre.
- curso: mapear solo si se menciona. Para agendar_ficha/mover_clase/cancelar_clase no es requerido.
- confianza:
  0.9–1.0: acción clara + alumno + fecha + hora (o no se necesitan para la acción).
  0.7–0.89: falta solo el curso en nueva_ficha, o la hora es ambigua pero fecha clara.
  0.5–0.69: falta fecha u hora para acciones que las requieren.
  <0.5: muy ambiguo, no se entiende la intención.
- falta_info: SOLO lo bloqueante. agendar_ficha→[] si hay alumno. cancelar_clase→[] si hay alumno.
  consultar_agenda→[] si hay fecha (o se entiende que es hoy/mañana/esta semana).
  consultar_alumno→[] si hay alumno.
  mover_clase/nueva_ficha→["fecha"] si falta fecha, ["hora"] si falta hora. Nunca incluir "curso" para mover/cancelar.

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
