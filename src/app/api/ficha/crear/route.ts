/**
 * Crea una ficha desde la captura de mostrador y devuelve su enlace.
 *
 * Reemplaza a `public/ficha.html`, que armaba un PDF con jsPDF en el navegador
 * y lo bajaba como blob. Ese PDF no existía en ningún lado: no aparecía en el
 * panel, no se podía volver a abrir, y quedaba congelado el día que se generó.
 * Una ficha capturada aquí es la misma ficha que crea Luz y la misma que crea
 * /agenda — misma colección, mismo enlace, mismo formato para el alumno.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { normalizePhone } from '@/lib/phone';
import { guardarFicha, calcularDeposito } from '@/lib/fichaLuz';
import { enlaceFicha } from '@/lib/ficha-enlace';
import { buscarCurso } from '@/lib/pagos';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

type Body = {
  nombre?: string;
  telefono?: string;
  zona?: string;
  curso?: string;
  fechas?: { date?: string; time?: string }[];
  apartado?: number | string;
  nota?: string;
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const nombre = (body.nombre ?? '').trim();
  const telefono = normalizePhone(body.telefono ?? '');
  const zona = (body.zona ?? '').trim();
  const curso = buscarCurso(body.curso);
  const fechas = (body.fechas ?? []).filter((f): f is { date: string; time: string } => !!f.date && !!f.time);

  if (!nombre) return NextResponse.json({ ok: false, error: 'Falta el nombre' }, { status: 400 });
  if (telefono.length !== 12) {
    return NextResponse.json({ ok: false, error: 'El teléfono debe ser de 10 dígitos' }, { status: 400 });
  }
  if (!curso) return NextResponse.json({ ok: false, error: 'Falta el curso' }, { status: 400 });
  if (!fechas.length) {
    return NextResponse.json({ ok: false, error: 'Falta al menos una sesión con fecha y hora' }, { status: 400 });
  }

  // Lo que ya pagó por transferencia o depósito en tienda, confirmado a mano.
  // Sólo cuenta como apartado si alcanza el depósito del curso: si entró menos,
  // la ficha sigue pendiente y el panel lo enseña así.
  const apartado = Number(body.apartado ?? 0) || 0;
  const deposito = calcularDeposito(curso.total);
  const cubreDeposito = apartado >= deposito;

  const ficha = await guardarFicha(
    telefono,
    {
      studentName: nombre,
      curso: curso.nombre,
      precio: curso.total,
      opcionesFechaHora: fechas.map((f) => `${f.date} ${f.time}`),
      zona,
      // linkCierre arma wa.me/52{telefono}: se guarda a 10 dígitos, igual que
      // en el flujo de Luz.
      telefono: telefono.slice(2),
      ...(cubreDeposito ? { depositoPagado: true, depositoRegistrado: apartado } : {}),
      ...(body.nota?.trim() ? { nota: body.nota.trim() } : {}),
    },
    'mostrador'
  );

  // guardarFicha ya le mandó el enlace al alumno por WhatsApp (ficha nueva).
  return NextResponse.json({
    ok: true,
    url: ficha.fichaToken ? enlaceFicha(ficha.fichaToken) : null,
    estado: ficha.estado,
    faltantes: ficha.faltantes,
    deposito,
    apartado: cubreDeposito ? apartado : 0,
  });
}
