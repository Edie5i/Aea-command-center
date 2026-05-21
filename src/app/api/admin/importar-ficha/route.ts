import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          {
            media: {
              url: `data:${mimeType};base64,${imageBase64}`,
              contentType: mimeType,
            },
          },
          {
            text: `Eres un extractor de datos de fichas de inscripción de Auto Escuela Americana (escuela de manejo en CDMX).

Analiza esta imagen y extrae los datos. Responde ÚNICAMENTE con JSON válido, sin texto adicional:

{
  "nombre": "nombre completo del alumno",
  "telefono": "solo 10 dígitos, sin espacios ni guiones",
  "curso": "nombre del curso (Estándar, Automático, Moto, Mixto, etc.)",
  "transmision": "Estándar o Automático o Moto o Mixto",
  "direccion": "dirección o punto de encuentro",
  "notas": "cualquier nota adicional o string vacío",
  "fechas": [
    { "date": "YYYY-MM-DD", "time": "HH:MM" }
  ]
}

Reglas:
- Si un campo no aparece, usa string vacío ""
- Para fechas: formato ISO YYYY-MM-DD, hora en 24h HH:MM
- Si no hay hora específica para una fecha, usa "10:00" por defecto
- Extrae TODAS las fechas que aparezcan en la ficha
- Si la imagen no es una ficha de inscripción, igual intenta extraer lo que puedas`,
          },
        ],
      }],
    });

    const text = result.text?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ ok: false, error: 'No se pudieron extraer datos de la imagen' }, { status: 422 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[importar-ficha]', err);
    const msg = err instanceof Error ? err.message : 'Error al procesar imagen';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
