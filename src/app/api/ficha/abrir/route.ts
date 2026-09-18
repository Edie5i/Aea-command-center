/**
 * Abre la ficha de un alumno en HTML, desde el panel.
 *
 * Reemplaza a `/api/ficha/pdf`. La ficha ya vive como página —`/ficha/[token]`—
 * y esa es la que se le manda al alumno: se abre en el navegador de cualquier
 * teléfono, sin depender de un lector de PDF, y refleja el estado actual en vez
 * de una foto congelada del día que se generó.
 *
 * Esta ruta existe porque el panel conoce al alumno por su teléfono, no por su
 * token, y el token no puede resolverse desde el navegador: quien lo tenga
 * puede ver la ficha. Por eso la traducción ocurre aquí, detrás del PIN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { tokenDeFicha, enlaceFicha } from '@/lib/ficha-enlace';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  if (!phone) return new NextResponse('Falta el parámetro phone', { status: 400 });

  // Genera el token si la ficha es vieja y no tenía.
  const token = await tokenDeFicha(phone);
  if (!token) return new NextResponse('No se encontró la ficha', { status: 404 });

  return NextResponse.redirect(new URL(enlaceFicha(token)), {
    // 302 y sin caché: el token puede acabar de crearse, y un 301 guardado en
    // el navegador dejaría clavada una redirección que quizá cambie.
    status: 302,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
