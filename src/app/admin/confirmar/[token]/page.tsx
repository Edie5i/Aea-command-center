/**
 * Confirmar un apartado desde el teléfono, en un tap.
 *
 * El comprobante llega por WhatsApp con la imagen adjunta: ahí mismo, en el pie
 * de la foto, va la liga a esta página. Antes había que abrir el panel, buscar
 * la ficha entre todas y confirmarla; ahora se confirma donde ya estabas
 * mirando la imagen.
 *
 * Va bajo /admin a propósito: la liga lleva el token de la ficha, que también
 * tiene el alumno —es su propia liga— así que lo que autoriza no es el token
 * sino el PIN. Sin él, esta página no enseña nada.
 */

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firestore';
import { enlaceFicha } from '@/lib/ficha-enlace';
import type { Ficha } from '@/lib/ficha-reglas';
import { confirmarApartado } from '@/app/admin/reservas/actions';

export const dynamic = 'force-dynamic';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(148,163,184,0.25)',
};

async function porToken(token: string): Promise<(Ficha & { id: string }) | null> {
  const snap = await db.collection('fichas').where('fichaToken', '==', token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Ficha) };
}

export default async function ConfirmarPage({ params }: { params: Promise<{ token: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { token } = await params;
  const ficha = await porToken(token);
  if (!ficha) notFound();

  const confirmada = ficha.depositoPagado;
  // La imagen se pide por /admin/comprobante (no /api/admin/comprobante): la
  // cookie del PIN tiene path '/admin' y no alcanza las rutas bajo /api.
  const imagen = ficha.comprobanteURL?.replace('/api/admin/comprobante', '/admin/comprobante');

  return (
    <main className="min-h-screen p-4" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/reservas" className="text-sm" style={{ color: '#475569' }}>← Reservas</Link>
        </div>

        <div className="rounded-2xl p-5" style={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>
            {confirmada ? 'Apartado confirmado' : 'Confirmar apartado'}
          </p>
          <p className="text-xl font-bold mt-1" style={{ color: '#1e293b' }}>{ficha.studentName || 'Sin nombre'}</p>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {ficha.curso || 'Curso ?'} · ${ficha.precio.toLocaleString('es-MX')}
          </p>
          <p className="text-sm mt-2" style={{ color: '#334155' }}>
            Apartado: <strong>${ficha.depositoMonto.toLocaleString('es-MX')}</strong>
            {ficha.telefono ? <> · 📱 {ficha.telefono}</> : null}
          </p>
          {ficha.opcionesFechaHora.length > 0 && (
            <p className="text-xs mt-2" style={{ color: '#64748b' }}>📅 {ficha.opcionesFechaHora.join(' · ')}</p>
          )}
        </div>

        {/* El comprobante, para verlo sin salir de aquí. */}
        {imagen ? (
          <a href={imagen} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden" style={CARD}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen} alt="Comprobante" className="w-full" style={{ maxHeight: 420, objectFit: 'contain', background: '#f1f5f9' }} />
            <p className="text-xs text-center py-2" style={{ color: '#64748b' }}>Toca para abrirlo en grande</p>
          </a>
        ) : (
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-sm" style={{ color: '#b45309' }}>
              Esta ficha no tiene comprobante guardado. Confírmala sólo si ya viste el depósito en la cuenta.
            </p>
          </div>
        )}

        {confirmada ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)' }}>
            <p className="text-sm font-semibold" style={{ color: '#15803d' }}>✅ Ya quedó confirmado</p>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>El alumno lo ve así en su ficha.</p>
          </div>
        ) : (
          <form action={confirmarApartado}>
            <input type="hidden" name="id" value={ficha.id} />
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}
            >
              ✅ Confirmar apartado de ${ficha.depositoMonto.toLocaleString('es-MX')}
            </button>
          </form>
        )}

        <Link
          href={ficha.fichaToken ? enlaceFicha(ficha.fichaToken) : '/admin/reservas'}
          className="block text-center text-xs font-medium py-2"
          style={{ color: '#2563eb' }}
        >
          Ver la ficha como la ve el alumno →
        </Link>
      </div>
    </main>
  );
}
