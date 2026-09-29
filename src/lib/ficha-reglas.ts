/**
 * La forma de una ficha y las dos reglas que deciden si está completa.
 *
 * Viven aparte de `fichaLuz.ts` porque ese módulo arrastra Firestore y
 * `adminNotify` (que es `server-only`): así estas reglas —que son las que
 * deciden si un alumno tiene su lugar apartado— se pueden probar solas.
 */

export type Ficha = {
  studentName: string;
  curso: string;
  precio: number;
  opcionesFechaHora: string[];
  depositoMonto: number; // 20% del curso, mín $690
  depositoPagado: boolean;
  comprobanteURL: string | null;
  // De dónde salió: la web (/agenda), WhatsApp (Luz) o la captura de mostrador
  // (/admin/ficha-nueva). Ninguno es invisible en el panel.
  origen: 'web' | 'luz' | 'mostrador';
  estado: 'nueva' | 'pendiente' | 'reservada' | 'perdida';
  faltantes: string[];
  telefono: string;
  // Dirección de recogida. NO entra en revisarFicha a propósito: se vigila para
  // avisar en cuanto llega, pero no bloquea que la ficha cuente como reservada.
  zona?: string;
  creada: number;
  // Solo cuando estado === 'perdida': por qué se marcó así, para contexto en el panel.
  perdidaRazon?: string;
  // Cobro en efectivo en la sede: no hay comprobante que subir, pero el depósito
  // está pagado igual. Sin esto, una ficha cobrada en mostrador se quedaba
  // "pendiente de depósito" para siempre y el alumno veía que le pedían pagar.
  pagoEfectivo?: number;
  // Observaciones de quien la capturó. Van en la ficha del alumno.
  nota?: string;
  // Identificador opaco para /ficha/[token] — no es el teléfono, no debe salir
  // nunca en una URL (dato personal). Se genera una sola vez, al crear la ficha.
  fichaToken?: string;
};

export const calcularDeposito = (p: number) => Math.max(Math.round(p * 0.2), 690);

export function revisarFicha(f: Partial<Ficha>): string[] {
  const x: string[] = [];
  if (!f.studentName) x.push('nombre');
  if (!f.curso) x.push('curso');
  if (!f.opcionesFechaHora?.length) x.push('fechas');
  if (!f.depositoPagado || !(f.comprobanteURL || f.pagoEfectivo)) x.push('depósito');
  if (!f.telefono) x.push('teléfono');
  return x;
}
