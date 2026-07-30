// lib/fichaLuz.ts — Fuente ÚNICA. Ficha web (/agenda) + Luz caen aquí. Dashboard las ve TODAS.
import { db } from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';

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
  // Dirección de recogida. NO entra en revisarFicha a propósito: se vigila para
  // avisar en cuanto llega, pero no bloquea que la ficha cuente como reservada.
  zona?: string;
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

// Aviso puntual al admin: cuando cambia el estado, o cuando llega la dirección
// por primera vez. Sin spam por re-guardados: si nada de eso cambió, no manda.
async function notificarCambios(prev: Ficha | null, ficha: Ficha): Promise<void> {
  const cambioEstado = prev?.estado !== ficha.estado;
  const llegoZona = !prev?.zona && !!ficha.zona;
  if (!cambioEstado && !llegoZona) return;

  const chip = ficha.origen === 'web' ? '🌐 Web' : '💬 Luz';
  const nombre = ficha.studentName || 'Sin nombre';
  const dir = ficha.zona ? `\n📍 ${ficha.zona}` : '';

  let texto: string;
  if (cambioEstado) {
    texto =
      ficha.estado === 'reservada'
        ? `✅ *FICHA RESERVADA* — ${nombre}\n🚗 ${ficha.curso} $${ficha.precio.toLocaleString('es-MX')} · Depósito $${ficha.depositoMonto.toLocaleString('es-MX')} PAGADO${dir}\n${chip} · 📱 ${ficha.telefono}`
        : `🟡 *Ficha ${ficha.estado.toUpperCase()}* — ${nombre}\n🚗 ${ficha.curso || '¿curso?'} · Falta: ${ficha.faltantes.join(', ')}${dir}\n${chip} · 📱 ${ficha.telefono || '¿tel?'}` +
          (ficha.telefono ? `\n👉 Cerrar: ${linkCierre(ficha)}` : '');
  } else {
    // Sólo llegó la dirección: aviso corto y accionable
    texto =
      `📍 *DIRECCIÓN RECIBIDA* — ${nombre}\n${ficha.zona}\n` +
      `🚗 ${ficha.curso || '¿curso?'} · ${ficha.faltantes.length ? 'Falta: ' + ficha.faltantes.join(', ') : 'sin pendientes'}\n` +
      `${chip} · 📱 ${ficha.telefono || '¿tel?'}` +
      (ficha.telefono ? `\n👉 Cerrar: ${linkCierre(ficha)}` : '');
  }

  await notificarAdmin(texto).catch((e) => console.error('[FICHA] Error notificando cambio:', e));
}

// Web y Luz llaman ESTA función. Misma colección 'fichas'. Cero leads perdidos.
export async function guardarFicha(id: string, datos: Partial<Ficha>, origen: 'web' | 'luz') {
  const ref = db.collection('fichas').doc(id);
  const snap = await ref.get();
  const existente = snap.exists ? (snap.data() as Ficha) : null;

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
    // Se preserva igual que 'creada': un re-guardado sin dirección no debe
    // borrar la que ya se había capturado.
    zona: datos.zona ?? existente?.zona,
    // Preservar la fecha original — si no, cada re-guardado (ej. Luz llamando
    // guardarPreReserva varias veces) corre la ficha al tope de /admin/reservas.
    creada: existente?.creada ?? Date.now(),
  };
  await ref.set(ficha, { merge: true });
  await notificarCambios(existente, ficha);
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
    zona: datos.zona,
    creada: datos.creada ?? Date.now(),
  };
  await ref.set(ficha, { merge: true });
  await notificarCambios(actual as Ficha | null, ficha);
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
