// Genera la ficha en PDF del lado del servidor y la sirve directo — reemplaza
// el botón "Ver Ficha" que antes generaba el PDF en el navegador (jsPDF +
// blob:), poco confiable: en algunos casos abría una pestaña en blanco.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getInscripcionData } from '@/lib/firestore';
import { generarFichaPdfBuffer } from '@/lib/ficha-pdf-server';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  if (!phone) {
    return new NextResponse('Falta el parámetro phone', { status: 400 });
  }

  const data = await getInscripcionData(phone);
  if (!data) {
    return new NextResponse('No se encontró la ficha', { status: 404 });
  }

  const buffer = await generarFichaPdfBuffer({
    nombre: data.nombre,
    telefono: data.telefono,
    zona: data.zona,
    curso: data.curso,
    transmision: data.transmision,
    fechas: data.fechas,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ficha-${data.nombre.replace(/\s+/g, '-')}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
