import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateClaseEstado, getClasesDeInstructor } from '@/lib/firestore';
import type { EstadoClase } from '@/lib/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const phone = (await cookies()).get('instructor_phone')?.value;
  if (!phone) return new NextResponse('Unauthorized', { status: 401 });

  const { estado } = (await request.json()) as { estado: EstadoClase };

  const clases = await getClasesDeInstructor(phone);
  if (!clases.find(c => c.id === params.id)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  await updateClaseEstado(params.id, estado);
  return new NextResponse('OK', { status: 200 });
}
