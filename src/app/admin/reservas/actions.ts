'use server';

/**
 * Confirmar el apartado a mano.
 *
 * Existe porque el webhook ya no marca el depósito con la llegada de una imagen:
 * por ahí entra cualquier foto. Quien mira el comprobante y ve el monto y el
 * banco es una persona, y este es el botón de esa persona.
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { actualizarFicha } from '@/lib/fichaLuz';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function confirmarApartado(formData: FormData): Promise<void> {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  // actualizarFicha recalcula estado y faltantes, y avisa al admin del cambio a
  // 'reservada' — el mismo aviso que antes salía solo con recibir la foto, ahora
  // cuando de verdad está confirmado.
  await actualizarFicha(id, { depositoPagado: true });
  revalidatePath('/admin/reservas');
  // Se confirma desde dos lados: el panel y la liga que llega por WhatsApp.
  const token = String(formData.get('token') ?? '');
  if (token) revalidatePath(`/admin/confirmar/${token}`);
}
