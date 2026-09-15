/**
 * Los datos que Marco pregunta, guardados.
 *
 * Marco conversaba, decidía y tiraba las respuestas: solo escribía `estado`.
 * Al 2026-09-15 los 5 candidatos reales tenían los siete campos vacíos, así
 * que no había forma de saber por qué se rechazó a nadie, ni de pasarle esos
 * datos a Vía Urb.
 *
 * Lógica pura y con pruebas porque aquí entra texto de un modelo: si alucina
 * un rating de 9 o unos 200 años manejando, eso NO debe quedar guardado.
 */

import { z } from 'zod';

/** Lo que se le pide al modelo. Todo opcional: la conversación va a medias. */
export const esquemaCandidato = z.object({
  nombre: z.string().nullable().describe('Nombre de pila o completo, como lo dijo'),
  aniosManejando: z.number().nullable().describe('Años manejando en ciudad'),
  rating: z.number().nullable().describe('Calificación en Uber o DiDi, de 0 a 5'),
  transmisiones: z
    .enum(['estandar', 'automatico', 'ambas'])
    .nullable()
    .describe('Qué transmisión maneja'),
  licenciaB: z.boolean().nullable().describe('Si tiene licencia tipo B vigente'),
  zonas: z.string().nullable().describe('Colonias o zonas de CDMX donde se mueve'),
  disponibilidad: z
    .string()
    .nullable()
    .describe('Disponibilidad entre semana, tal como la describió'),
});

export type DatosExtraidos = z.infer<typeof esquemaCandidato>;

export interface DatosCandidato {
  nombre?: string;
  aniosManejando?: number;
  rating?: number;
  transmisiones?: 'estandar' | 'automatico' | 'ambas';
  licenciaB?: boolean;
  zonas?: string;
  disponibilidad?: string;
}

export const CAMPOS: Array<keyof DatosCandidato> = [
  'nombre',
  'aniosManejando',
  'rating',
  'transmisiones',
  'licenciaB',
  'zonas',
  'disponibilidad',
];

/** Cuáles siguen sin dato. Vacío quiere decir que ya no hay que extraer nada. */
export function faltan(actual: DatosCandidato): Array<keyof DatosCandidato> {
  return CAMPOS.filter(c => actual[c] === undefined || actual[c] === null);
}

/** Rangos con los que un valor alucinado se descarta en silencio. */
function valido(campo: keyof DatosCandidato, v: unknown): boolean {
  switch (campo) {
    case 'aniosManejando':
      return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 70;
    case 'rating':
      return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 5;
    case 'licenciaB':
      return typeof v === 'boolean';
    case 'transmisiones':
      return v === 'estandar' || v === 'automatico' || v === 'ambas';
    default:
      return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 200;
  }
}

/**
 * Lo que hay que escribir: solo campos que faltaban Y que vienen con un valor
 * válido.
 *
 * No pisa un dato que ya existe. Si el candidato dijo "6 años" al principio y
 * el modelo luego entiende "5", se queda el primero: lo que dijo cuando se le
 * preguntó vale más que una relectura del historial.
 */
export function fusionar(
  actual: DatosCandidato,
  extraido: Partial<DatosExtraidos> | null | undefined
): Partial<DatosCandidato> {
  if (!extraido) return {};

  const cambios: Record<string, unknown> = {};
  for (const campo of faltan(actual)) {
    const v = extraido[campo];
    if (v === null || v === undefined) continue;
    const limpio = typeof v === 'string' ? v.trim() : v;
    if (valido(campo, limpio)) cambios[campo] = limpio;
  }
  return cambios as Partial<DatosCandidato>;
}

/** Instrucción del extractor. Aparte del prompt de Marco: son trabajos distintos. */
export const PROMPT_EXTRACTOR = `Lee esta conversación entre un reclutador y un candidato a instructor de manejo, y extrae SOLO los datos que el candidato haya dicho explícitamente.

Reglas:
- Si un dato no se dijo, devuélvelo como null. NO adivines ni infieras.
- "manejo los dos" o "estándar y automático" es "ambas".
- El rating es de 0 a 5 (Uber o DiDi). Si dice "4.8 estrellas", es 4.8.
- La licencia tipo B es la azul de conductor profesional. Solo true si dijo que SÍ la tiene vigente.
- Los años son de manejar en ciudad, en número. "Como 6" es 6; "toda mi vida" es null.
- Las zonas y la disponibilidad van tal como las describió, en pocas palabras.`;
