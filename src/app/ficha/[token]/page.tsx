import { notFound } from 'next/navigation';
import { db } from '@/lib/firestore';
import type { Ficha } from '@/lib/fichaLuz';

export const dynamic = 'force-dynamic';

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatearFecha(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ');
  if (!fecha || !hora) return fechaHora;
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const [hh, mm] = hora.split(':').map(Number);
  const ampm = hh >= 12 ? 'p.m.' : 'a.m.';
  const hora12 = hh % 12 || 12;
  return `${DIAS_ES[dt.getDay()]} ${d} de ${MESES_ES[m - 1]} · ${hora12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

async function getFichaPorToken(token: string): Promise<(Ficha & { id: string }) | null> {
  const snap = await db.collection('fichas').where('fichaToken', '==', token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Ficha) };
}

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

export default async function FichaPublicaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ficha = await getFichaPorToken(token);
  if (!ficha) notFound();

  const folio = `AEA-${new Date(ficha.creada).getFullYear()}-${String(ficha.creada).slice(-4)}`;
  const fechaEmision = new Date(ficha.creada).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  const reservada = ficha.estado === 'reservada';
  const perdida = ficha.estado === 'perdida';

  return (
    <main className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      <div className="max-w-xl mx-auto space-y-4">

        {/* Encabezado */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div style={{ background: 'linear-gradient(90deg, #004aad, #1d4ed8)', height: 5 }} />
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: '#004aad' }}>A</div>
              <div>
                <p className="font-bold text-white leading-tight">AUTO ESCUELA<br />AMERICANA</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>APRENDE A MANEJAR · CDMX</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold" style={{ color: '#3b82f6' }}>FOLIO</p>
              <p className="text-sm font-mono" style={{ color: '#e2e8f0' }}>{folio}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#3b82f6' }}>FECHA</p>
              <p className="text-sm font-mono" style={{ color: '#e2e8f0' }}>{fechaEmision}</p>
            </div>
          </div>
        </div>

        {/* Estatus */}
        <div className="rounded-2xl p-4 text-center font-semibold text-sm" style={{
          background: perdida ? 'rgba(100,116,139,0.12)' : reservada ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${perdida ? 'rgba(100,116,139,0.3)' : reservada ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          color: perdida ? '#94a3b8' : reservada ? '#4ade80' : '#fbbf24',
        }}>
          {perdida ? '❌ Este apartado ya no está vigente' : reservada ? '✅ Lugar confirmado — depósito recibido' : '⏳ Pendiente de depósito para confirmar tu lugar'}
        </div>

        {/* Datos del alumno */}
        <div className="rounded-2xl p-5 space-y-4" style={CARD}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>01 · Datos del alumno</p>
            <div className="mt-2 pb-2" style={{ borderBottom: '1px dashed rgba(148,163,184,0.2)' }}>
              <p className="text-xs" style={{ color: '#64748b' }}>NOMBRE</p>
              <p className="text-white font-medium">{ficha.studentName || '—'}</p>
            </div>
            {ficha.zona && (
              <div className="mt-2">
                <p className="text-xs" style={{ color: '#64748b' }}>DIRECCIÓN / PUNTO DE ENCUENTRO</p>
                <p className="text-white text-sm">{ficha.zona}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>02 · Curso elegido</p>
            <div className="mt-2 rounded-xl p-3" style={{ background: 'rgba(0,74,173,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <p className="text-white font-bold">{ficha.curso || '—'}</p>
              <p className="text-sm mt-0.5" style={{ color: '#93c5fd' }}>
                ${ficha.precio.toLocaleString('es-MX')} · Depósito ${ficha.depositoMonto.toLocaleString('es-MX')}
              </p>
            </div>
          </div>

          {ficha.opcionesFechaHora.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>03 · Fechas y horarios</p>
              <div className="mt-2 space-y-1.5">
                {ficha.opcionesFechaHora.map((f, i) => (
                  <div key={i} className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(148,163,184,0.06)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.1)' }}>
                    {i + 1}. {formatearFecha(f)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pago (solo si falta) */}
        {!reservada && !perdida && (
          <div className="rounded-2xl p-5" style={CARD}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#fbbf24' }}>Datos para tu depósito</p>
            <p className="text-sm" style={{ color: '#cbd5e1' }}>
              BBVA · Eduardo W. Czaplewski (cuenta PYME)<br />
              Cuenta: 048 469 5739<br />
              CLABE: 012 180 00484695739 9<br />
              <span style={{ color: '#94a3b8' }}>(También se recibe en Oxxo, Walmart o 7-Eleven con la tarjeta 4152 3144 0428 8527)</span>
            </p>
            <p className="text-xs mt-3" style={{ color: '#64748b' }}>
              En el concepto pon tu nombre completo y manda el comprobante por WhatsApp a Luz. Este link se actualiza solo — no hace falta que te mandemos nada más.
            </p>
          </div>
        )}

        {/* Términos */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-xs font-semibold text-white mb-1">Al confirmar esta ficha, el alumno acepta los Términos y Condiciones de AEA:</p>
          <a href="https://autoescuelaamericana.com/terminos" className="text-xs font-mono" style={{ color: '#60a5fa' }}>autoescuelaamericana.com/terminos</a>
          <p className="text-xs mt-2 italic" style={{ color: '#64748b' }}>
            El apartado garantiza el lugar y fecha de inicio. Cancelaciones con menos de 24 hrs de anticipación no son reembolsables. Documento generado electrónicamente.
          </p>
        </div>

        <p className="text-center text-xs" style={{ color: '#334155' }}>
          Torreón 49, Roma Sur, CDMX · 56 3443 3212 · app.autoescuelaamericana.com
        </p>
      </div>
    </main>
  );
}
