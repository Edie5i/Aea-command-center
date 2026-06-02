/**
 * Prototipo de parser de lenguaje natural → JSON de agenda.
 * Aislado: no toca Firestore ni Calendar. Solo llama Gemini.
 * Correr: node_modules/.bin/tsx scripts/test-parser.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Leer .env.local manualmente
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY ?? '';
if (!API_KEY) { console.error('Falta GEMINI_API_KEY en .env.local'); process.exit(1); }

const CURSOS = ['Reforzamiento', 'Avanzado', 'Estándar', 'Automático', 'Moto', 'Inglés', 'Intensivo', 'Mixto'];

const HOY  = new Date().toLocaleDateString('en-CA',  { timeZone: 'America/Mexico_City' });
const DIA  = new Date().toLocaleDateString('es-MX',  { weekday: 'long', timeZone: 'America/Mexico_City' });

const SYSTEM = `Eres un parser de comandos de agenda para Auto Escuela Americana (escuela de manejo, CDMX).

Fecha de hoy: ${HOY} (${DIA}). Zona horaria: America/Mexico_City.
Cursos válidos: ${CURSOS.join(', ')}.
Mapea variaciones al nombre correcto: "automatico"/"auto" → "Automático", "ingles"/"inglés" → "Inglés",
"estandar"/"standar" → "Estándar", "moto"/"motocicleta" → "Moto", "intensivo" → "Intensivo",
"reforzamiento"/"reforza" → "Reforzamiento", "avanzado" → "Avanzado", "mixto" → "Mixto".

Reglas de parseo:
- accion: "mover_clase" cuando se pide cambiar/mover/pasar una clase ya existente.
           "nueva_ficha" cuando se habla de nuevo alumno, nueva ficha, agendar por primera vez.
           "desconocido" si no encaja.
- alumno: nombre completo o parcial mencionado, o null.
- curso: nombre de curso válido mapeado, o null.
- fecha: ISO YYYY-MM-DD inferida con base en HOY. Resuelve "mañana", "el jueves", "el lunes que viene",
         "el sábado" calculando desde la fecha de hoy. null si no se menciona o no se puede inferir.
- hora: "HH:MM" en 24h. "4" o "4pm" → "16:00". "10am" o "10" → "10:00". "en la tarde" → null (ambiguo).
        "una hora más tarde" → null (necesita hora base). null si falta.
- confianza: 0.0–1.0. Alta si la intención es clara y hay suficiente info. Baja si es ambigua o incompleta.
- falta_info: lista de strings con lo que falta para ejecutar. Ej: ["fecha","hora"], ["alumno"].

Devuelve SOLO JSON puro. Sin markdown, sin bloques de código, sin explicación.`;

interface ParseResult {
  accion: string;
  alumno: string | null;
  curso: string | null;
  fecha: string | null;
  hora: string | null;
  confianza: number;
  falta_info: string[];
}

async function parse(texto: string): Promise<ParseResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: texto }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }
  );
  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(raw);
}

const FRASES = [
  "muevele la clase de juan perez al jueves a las 4",
  "cambia a maria del lunes para el miercoles 10am",
  "nueva ficha pedro ramirez automatico empieza el sabado 9",
  "agenda a la señora lopez ingles el martes en la tarde",
  "pasa la clase de carlos una hora mas tarde",
  "nuevo alumno moto, jose, deposito 690",
  "muevele a juan",
  "cancelame algo no me acuerdo",
];

(async () => {
  console.log(`\n📅 HOY: ${HOY} (${DIA})\n`);
  console.log('═'.repeat(80));

  for (let i = 0; i < FRASES.length; i++) {
    const frase = FRASES[i];
    console.log(`\n[${i + 1}] "${frase}"`);
    try {
      const r = await parse(frase);
      console.log(JSON.stringify(r, null, 2));
    } catch (e) {
      console.log('ERROR:', e);
    }
    console.log('─'.repeat(60));
  }
})();
