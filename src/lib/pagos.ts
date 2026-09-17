/**
 * Cuánto se cobra y cómo, en un solo lugar.
 *
 * Estas cifras vivían únicamente dentro del prompt de Luz, como texto suelto.
 * Ahí nadie las puede revisar ni probar: el 2026-09-16 se descubrió que el
 * monto de Openpay del Curso Intermedio ($2,210) es exactamente el saldo sin
 * recargo, mientras todos los demás llevan ~9% por los 3 meses sin intereses.
 * Está marcado abajo; se conserva tal cual hasta que se decida si es error.
 *
 * Con los datos aquí, `pagos.test.ts` verifica en cada corrida que el recargo
 * sea consistente. Una cifra mal escrita revienta en las pruebas y no en la
 * comisión de una venta.
 */

import { CUENTA, TIENDAS, tarjetaConEspacios } from './cuenta';

/** Lo que aparta el lugar. Siempre por transferencia o depósito. */
export const RESERVA = 690;

export interface Curso {
  /** Como lo nombra la ficha del alumno. */
  nombre: string;
  /** Precio completo del curso, con IVA. */
  total: number;
  /** Saldo a 3 MSI por liga de Openpay, ya con su recargo. */
  openpay: number;
}

export const CURSOS: Curso[] = [
  { nombre: 'Avanzado',       total: 1900, openpay: 1319 },
  // ⚠️ Sin recargo, a diferencia de todos los demás. Ver el encabezado.
  { nombre: 'Intermedio',     total: 2900, openpay: 2210 },
  { nombre: 'Estándar',       total: 3400, openpay: 2955 },
  { nombre: 'Automático',     total: 3900, openpay: 3500 },
  { nombre: 'Moto',           total: 4300, openpay: 3936 },
  { nombre: 'English Drive',  total: 4800, openpay: 4482 },
  { nombre: 'Nerviosas',      total: 5600, openpay: 5362 },
  { nombre: 'Intensivo',      total: 5600, openpay: 5362 },
  { nombre: 'Mixto',          total: 5600, openpay: 5362 },
];

/** Recargo nominal de los 3 MSI, para comprobar que la tabla sea coherente. */
export const RECARGO_MSI = 0.09;

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Encuentra el curso por como venga escrito en la ficha.
 *
 * La ficha trae textos como "Curso Principiante (Automático)" o "automatico",
 * según cómo lo haya capturado Luz. Se busca por contención para no depender
 * de una coincidencia exacta.
 */
export function buscarCurso(texto: string | undefined): Curso | null {
  if (!texto) return null;
  const t = normalizar(texto);
  return CURSOS.find(c => t.includes(normalizar(c.nombre))) ?? null;
}

/** Pesos con separador de miles, como se escriben en un mensaje. */
export function pesos(n: number): string {
  return `$${n.toLocaleString('es-MX')}`;
}

/**
 * El mensaje de cobro listo para pegar en WhatsApp.
 *
 * Se arma aquí y no en el componente para poder probarlo: es un texto que
 * lleva cantidades y un número de tarjeta, y se le manda a un cliente que va a
 * depositar con base en él.
 *
 * Solo trae lo que se puede afirmar. Si no se reconoce el curso de la ficha,
 * no se inventa un monto: se mandan los datos de pago sin cifras.
 */
export function mensajeCobro(nombre: string, curso: string | undefined): string {
  const pila = nombre.trim().split(/\s+/)[0] || 'Hola';
  const c = buscarCurso(curso);

  const lineas = [`Hola ${pila}, te paso los datos para tu pago:`, ''];

  if (c) {
    lineas.push(
      `Curso ${c.nombre} — ${pesos(c.total)}`,
      `Para apartar tu lugar: ${pesos(RESERVA)}`,
      `Saldo restante: ${pesos(c.total - RESERVA)}`,
      ''
    );
  }

  lineas.push(
    `${CUENTA.banco} | ${CUENTA.titular}`,
    `Cuenta: ${CUENTA.numero}`,
    `CLABE: ${CUENTA.clabe}`,
    '',
    `(También se recibe en ${TIENDAS} con la tarjeta ${tarjetaConEspacios()})`,
    '',
    'En el concepto pon tu nombre completo y mándame el comprobante por aquí.'
  );

  if (c) {
    lineas.push(
      '',
      `Si prefieres a 3 meses sin intereses, el saldo queda en ${pesos(c.openpay)} por liga de Openpay. Pídemela y te la mando.`
    );
  }

  return lineas.join('\n');
}
