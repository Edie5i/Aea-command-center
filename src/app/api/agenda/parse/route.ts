import { NextRequest, NextResponse } from 'next/server';

const CURSOS = ['Reforzamiento', 'Avanzado', 'Estándar', 'Automático', 'Moto', 'Inglés', 'Intensivo', 'Mixto'];

export async function POST(request: NextRequest) {
  const { texto, contexto } = await request.json();
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

Acciones — DEBES elegir UNA de estas exactas. Nunca uses "desconocido" si la intención es clara:

"consultar_alumno" — cuando preguntan por UN alumno específico por nombre.
  EJEMPLOS: "como va Luis", "como esta Juan", "busca a Maria", "info de Pedro", "que tiene Carlos",
  "dime de Alma", "como va Luis Torres", "busca la info de Luis Torres".

"consultar_agenda" — cuando preguntan qué clases hay en un día/semana (sin nombre de alumno específico).
  EJEMPLOS: "que hay manana", "que clases hay el viernes", "quien tiene clase hoy",
  "muestrame el jueves", "que tenemos esta semana", "clases de hoy", "que hay el lunes".

"mover_clase" — mover/pasar/cambiar/jalar una clase a otra fecha u hora.
  EJEMPLOS: "pasale a Juan al jueves 4", "muevenle a Maria al viernes", "cambiala al miercoles 10",
  "jalala al sabado", "recorrela al lunes".

"cancelar_clase" — cancelar/quitar/borrar una clase.
  EJEMPLOS: "cancela a Maria", "ya no viene Juan", "no va Roberto manana", "borrala", "quitala".

"nueva_ficha" — agendar nuevo alumno o primera clase.
  EJEMPLOS: "nuevo Pedro automático sabado 9", "nueva ficha Alma lunes 10", "inscribe a Carlos".

"agendar_ficha" — subir al Google Calendar clases de una ficha YA existente en el sistema.
  EJEMPLOS: "subele las clases de Luis al gc", "mete al calendar a Maria", "agendala en gc",
  "sube la ficha de Pedro", "ponla en el calendario".

"desconocido" — SOLO si es completamente imposible determinar la intención.

Reglas de parseo:
- fecha: ISO YYYY-MM-DD calculada SIEMPRE desde HOY=${HOY}.
  "mañana"→${new Date(new Date().getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })}.
  "el lunes/martes/miércoles/jueves/viernes/sábado/domingo" → próximo día desde HOY (si ya pasó esta semana, siguiente semana).
  "pasado mañana"→HOY+2. null solo si realmente no se puede inferir.
- hora: "HH:MM" 24h. "4"/"4pm"/"4 de la tarde"/"a las cuatro"→"16:00". "10"/"10am"/"diez"→"10:00".
  "7"/"siete"→"07:00". "mediodía"→"12:00". "en la tarde" sin número→null.
- alumno: nombre completo o parcial. Si dice "la de Juan" o "el de Pérez", extrae el nombre.
- curso: mapear solo si se menciona. Para agendar_ficha/mover_clase/cancelar_clase no es requerido.
- hora default para nueva_ficha: Si el comando NO especifica hora, usa "10:00" como valor por defecto.
  Nunca devuelvas hora:null para nueva_ficha si la fecha está clara — siempre pon "10:00" como mínimo.
- confianza — sé generoso, no conservador:
  1.0: acción clara + alumno + fecha resuelta. (hora puede ser default "10:00")
  1.0: nueva_ficha con alumno + fecha (con o sin curso, con o sin hora explícita).
  0.95: acción clara + alumno + fecha resuelta, hora ambigua pero inferible (ej. "a las 4" = 16:00).
  0.9: acción solo requiere alumno (consultar_alumno, cancelar_clase, agendar_ficha) y alumno está claro.
  0.5–0.69: falta fecha para mover_clase o nueva_ficha.
  <0.5: intención realmente ambigua o nombre de alumno no identificable.
- falta_info: REGLA ESTRICTA:
  cancelar_clase → SIEMPRE [] si hay alumno. Nunca incluir hora ni curso.
  agendar_ficha → SIEMPRE [] si hay alumno.
  consultar_alumno → SIEMPRE [] si hay alumno.
  consultar_agenda → SIEMPRE [] si hay fecha o se entiende el día.
  mover_clase → ["fecha"] si falta fecha, ["hora"] si falta hora explícita. NUNCA "curso".
  nueva_ficha → ["fecha"] si falta fecha. NUNCA incluir "hora" ni "curso" — tienen defaults.

Devuelve SOLO JSON puro sin markdown:
{"accion":"...","alumno":null,"curso":null,"fecha":null,"hora":null,"confianza":0.0,"falta_info":[]}${
  contexto?.alumno
    ? `\n\nCONTEXTO DE SESIÓN — último alumno mencionado: "${contexto.alumno}". Si el comando hace referencia implícita (ej. "muévela", "cancélala", "su clase", "su ficha", "a él/ella") sin nombrar a nadie, usa este alumno automáticamente.`
    : ''
}`;

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
