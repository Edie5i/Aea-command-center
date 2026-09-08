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
