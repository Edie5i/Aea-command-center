/**
 * Manda al alumno el enlace de su ficha por WhatsApp, desde el panel.
 *
 * Antes recibía un PDF en base64 que el navegador armaba con jsPDF y lo subía
 * a Meta como documento. Ahora manda la página: se abre en cualquier teléfono
 * sin lector de PDF, se reenvía como texto, y muestra el estado de HOY en vez
 * de una foto del día que se generó.
 *
 * ── Dos cosas que cambiaron además del formato ──────────────────────────
 *
 * 1. Pide el PIN de admin. Antes no: cualquiera con la URL podía hacer POST
 *    con un teléfono y un archivo, y mandar lo que quisiera desde el número de
 *    la escuela. La ruta hermana (`/api/ficha/pdf`) sí lo pedía.
 *
 * 2. Los datos salen de Firestore, no del cuerpo de la petición. El navegador
 *    mandaba nombre, zona y fechas; si la pestaña llevaba horas abierta, se le
 *    mandaba al alumno información vieja — y cualquiera podía inventarlos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getInscripcionData } from '@/lib/firestore';
import { enviarFicha } from '@/lib/ficha-enlace';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const { phone } = (await req.json()) as { phone?: string };
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'Falta el teléfono' }, { status: 400 });
  }

  const data = await getInscripcionData(phone);
  if (!data) {
    return NextResponse.json({ ok: false, error: 'No se encontró la ficha' }, { status: 404 });
  }

  const ficha = {
    nombre: data.nombre,
    telefono: data.telefono,
    zona: data.zona,
    curso: data.curso,
    transmision: data.transmision,
    fechas: data.fechas,
  };

  try {
    await enviarFicha(ficha, data.telefono);
  } catch (e) {
    console.error('[FICHA] error mandando el enlace al alumno:', e);
    return NextResponse.json({ ok: false, error: 'No se pudo enviar' }, { status: 502 });
  }

  // Copia al admin: antes el botón solo le mandaba al alumno y no quedaba
  // constancia de que se hubiera mandado.
  enviarFicha(ficha).catch(e => console.error('[FICHA] error en la copia al admin:', e));

  return NextResponse.json({ ok: true });
}
