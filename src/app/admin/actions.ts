'use server';

import { db } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

/**
 * Marca la constancia de SEMOVI como entregada y la saca de los pendientes.
 *
 * Se guarda la fecha y no un booleano: al reclamar una constancia entregada
 * hace meses, "sí se entregó" no sirve de nada sin saber cuándo.
 */
export async function marcarConstanciaEntregada(phone: string): Promise<void> {
  await db.collection('conversations').doc(phone).set(
    { inscripcion: { constanciaEntregadaAt: Timestamp.now() } },
    { merge: true }
  );
  revalidatePath('/admin');
}

/** Deshace lo anterior: la lista de pendientes es el único registro que hay,
 *  así que un clic de más no puede perder el pendiente para siempre. */
export async function deshacerConstanciaEntregada(phone: string): Promise<void> {
  await db.collection('conversations').doc(phone).set(
    { inscripcion: { constanciaEntregadaAt: null } },
    { merge: true }
  );
  revalidatePath('/admin');
}

/**
 * Marca a mano que un alumno necesita la constancia de SEMOVI.
 *
 * Luz la detecta sola cuando la edad sale en la conversación, pero eso solo
 * aplica de aquí en adelante: los menores ya inscritos no tienen edad guardada
 * y no aparecerían nunca en los pendientes. También cubre el caso de que la
 * edad no se haya mencionado.
 */
export async function marcarRequiereConstancia(phone: string, requiere: boolean): Promise<void> {
  await db.collection('conversations').doc(phone).set(
    { inscripcion: { requiereConstancia: requiere } },
    { merge: true }
  );
  revalidatePath('/admin');
  revalidatePath(`/admin/conversaciones/${phone}`);
}
