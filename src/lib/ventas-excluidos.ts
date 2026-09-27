/**
 * Quién NO es un prospecto de curso, aunque haya escrito al WhatsApp.
 *
 * El embudo de ventas daba por hecho que todo el que escribe quiere clases de
 * manejo. No es verdad, y en septiembre de 2026 se vio de tres formas:
 *
 *   · Vanessa Annese (`525526836188`), instructora de Vía Urb, quedó marcada
 *     «frío — 7 días sin actividad» el 24 de septiembre, como una alumna que
 *     no compra.
 *   · Dos candidatos a instructor recibieron seguimiento de ventas —«¿Sigues
 *     pensando en tomar clases de manejo?»— después de haber dicho que venían
 *     por el trabajo.
 *   · El propio teléfono de la escuela recibió recordatorios de prospecto
 *     frío, porque también aparece en `conversations`.
 *
 * Cada uno de esos manda además un aviso al admin, así que el ruido no se
 * queda en el destinatario: llega al teléfono desde donde se atiende.
 *
 * La parte pura vive aquí; la consulta a Firestore, en `firestore.ts`.
 */

import { normalizePhone } from './phone';

export type MotivoExclusion =
  | 'numero_de_la_escuela'
  | 'candidato_instructor'
  | 'instructor_viaurb';

export const EXPLICACION: Record<MotivoExclusion, string> = {
  numero_de_la_escuela: 'es un número de la escuela',
  candidato_instructor: 'es candidato a instructor',
  instructor_viaurb: 'es instructor de Vía Urb',
};

/**
 * Los números propios. Salen del entorno para que agregar uno no exija
 * desplegar código, pero traen el del admin por defecto: es el que siempre
 * está y el que más ruido recibía.
 */
export function numerosDeLaEscuela(env: NodeJS.ProcessEnv = process.env): string[] {
  const admin = (env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
  const extra = (env.NUMEROS_DE_LA_ESCUELA ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return [admin, ...extra].filter(Boolean);
}

export function esNumeroDeLaEscuela(
  phone: string,
  propios: readonly string[] = numerosDeLaEscuela()
): boolean {
  const p = normalizePhone(phone);
  return propios.some(o => normalizePhone(o) === p);
}

/**
 * Un candidato **rechazado** sí vuelve a ventas.
 *
 * Los cinco rechazos que hay en `candidatos_instructor` dicen todos lo mismo:
 * «falso positivo — es cliente de curso, no candidato instructor». Excluirlos
 * del embudo sería castigar dos veces el mismo error del detector.
 */
export function candidatoBloqueaVentas(estado: string | null | undefined): boolean {
  return Boolean(estado) && estado !== 'rechazado';
}
