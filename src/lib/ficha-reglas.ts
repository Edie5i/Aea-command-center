/**
 * La forma de una ficha y las dos reglas que deciden si está completa.
 *
 * Viven aparte de `fichaLuz.ts` porque ese módulo arrastra Firestore y
 * `adminNotify` (que es `server-only`): así estas reglas —que son las que
 * deciden si un alumno tiene su lugar apartado— se pueden probar solas.
 */

import { RESERVA } from './pagos';

export type Ficha = {
  studentName: string;
  curso: string;
  precio: number;
  opcionesFechaHora: string[];
  // Lo que aparta el lugar. Se guarda en la ficha, y no se recalcula al leerla,
  // para que un cambio futuro de RESERVA no altere lo que ya se le prometió a
  // alguien que reservó antes.
  depositoMonto: number;
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
  // Apartado que ya entró y se registró a mano, sin imagen del comprobante.
  // No es efectivo en la sede —no se recibe efectivo—: el alumno transfirió o
  // depositó en Oxxo/Walmart con la tarjeta, y quien captura la ficha lo
  // confirma porque ya lo vio en la cuenta. El comprobante puede llegar después
  // por WhatsApp; hasta entonces esto es lo único que dice que ya está pagado.
  depositoRegistrado?: number;
  // Observaciones de quien la capturó. Van en la ficha del alumno.
  nota?: string;
  // Identificador opaco para /ficha/[token] — no es el teléfono, no debe salir
  // nunca en una URL (dato personal). Se genera una sola vez, al crear la ficha.
  fichaToken?: string;
};

/**
 * Lo que se le pide al alumno para apartar: $690, el mismo para todos los cursos.
 *
 * Antes esto era `max(20% del curso, 690)`. Nadie se lo dijo nunca así al
 * alumno: Luz promete $690 en seis lugares del prompt —y como gancho de venta,
 * "el apartado es la promo"— y `mensajeCobro` cobra `RESERVA`. El 20% sólo
 * existía aquí, y salía a la cara del cliente en tres lados: la ficha decía
 * "Depósito $780" para Automático, el mensaje de cierre le pedía "el depósito
 * del 20%", y la plantilla de seguimiento le dictaba ese mismo número. Se le
 * prometía una cifra y se le cobraba otra.
 */
export const APARTADO = RESERVA;

export function revisarFicha(f: Partial<Ficha>): string[] {
  const x: string[] = [];
  if (!f.studentName) x.push('nombre');
  if (!f.curso) x.push('curso');
  if (!f.opcionesFechaHora?.length) x.push('fechas');
  if (!f.depositoPagado || !(f.comprobanteURL || f.depositoRegistrado)) x.push('depósito');
  if (!f.telefono) x.push('teléfono');
  return x;
}
