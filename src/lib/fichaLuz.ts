// lib/fichaLuz.ts — Fuente ÚNICA. Ficha web (/agenda) + Luz caen aquí. Dashboard las ve TODAS.
import { db } from '@/lib/firestore';

export type Ficha = {
  studentName: string;
  curso: string;
  precio: number;
  opcionesFechaHora: string[];
  depositoMonto: number; // 20% del curso, mín $690
  depositoPagado: boolean;
  comprobanteURL: string | null;
  origen: 'web' | 'luz'; // orgánico o WhatsApp — para que ninguno sea invisible
  estado: 'nueva' | 'pendiente' | 'reservada';
  faltantes: string[];
  telefono: string;
  creada: number;
};

export const calcularDeposito = (p: number) => Math.max(Math.round(p * 0.2), 690);

export function revisarFicha(f: Partial<Ficha>): string[] {
  const x: string[] = [];
  if (!f.studentName) x.push('nombre');
  if (!f.curso) x.push('curso');
  if (!f.opcionesFechaHora?.length) x.push('fechas');
  if (!f.depositoPagado || !f.comprobanteURL) x.push('depósito');
  if (!f.telefono) x.push('teléfono');
  return x;
}

// Web y Luz llaman ESTA función. Misma colección 'fichas'. Cero leads perdidos.
export async function guardarFicha(id: string, datos: Partial<Ficha>, origen: 'web' | 'luz') {
  const precio = datos.precio ?? 0;
  const faltantes = revisarFicha(datos);
  const ficha: Ficha = {
    studentName: datos.studentName ?? '',
    curso: datos.curso ?? '',
    precio,
    opcionesFechaHora: datos.opcionesFechaHora ?? [],
    depositoMonto: calcularDeposito(precio),
    depositoPagado: datos.depositoPagado ?? false,
    comprobanteURL: datos.comprobanteURL ?? null,
    origen,
    estado: faltantes.length === 0 ? 'reservada' : faltantes.length >= 3 ? 'nueva' : 'pendiente',
    faltantes,
    telefono: datos.telefono ?? '',
    creada: Date.now(),
  };
  await db.collection('fichas').doc(id).set(ficha, { merge: true });
  return ficha;
}

// Actualización parcial: lee la ficha existente, fusiona el patch y recalcula
// depósito/estado/faltantes. (guardarFicha con datos parciales pisaría campos con vacíos.)
export async function actualizarFicha(id: string, patch: Partial<Ficha>): Promise<Ficha> {
  const ref = db.collection('fichas').doc(id);
  const snap = await ref.get();
  const actual = (snap.exists ? snap.data() : {}) as Partial<Ficha>;
  const datos = { ...actual, ...patch };
  const precio = datos.precio ?? 0;
  const faltantes = revisarFicha(datos);
  const ficha: Ficha = {
    studentName: datos.studentName ?? '',
    curso: datos.curso ?? '',
    precio,
    opcionesFechaHora: datos.opcionesFechaHora ?? [],
    depositoMonto: calcularDeposito(precio),
    depositoPagado: datos.depositoPagado ?? false,
    comprobanteURL: datos.comprobanteURL ?? null,
    origen: datos.origen ?? 'luz',
    estado: faltantes.length === 0 ? 'reservada' : faltantes.length >= 3 ? 'nueva' : 'pendiente',
    faltantes,
    telefono: datos.telefono ?? '',
    creada: datos.creada ?? Date.now(),
  };
  await ref.set(ficha, { merge: true });
  return ficha;
}

// El dashboard llama esto: TODO (web + Luz), lo más caliente arriba.
export async function traerFichas() {
  const snap = await db.collection('fichas').orderBy('creada', 'desc').get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Ficha) }));
}

// Link de WhatsApp pre-armado para que TÚ cierres manual, con tu escasez.
export const linkCierre = (f: Ficha) =>
  `https://wa.me/52${f.telefono}?text=${encodeURIComponent(
    `Hola ${f.studentName}, vi tu solicitud de clases. Te aparto tu lugar con el depósito del 20% ($${f.depositoMonto}). ¿Te va?`
  )}`;
