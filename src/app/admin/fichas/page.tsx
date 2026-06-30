import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentInscripciones } from '@/lib/firestore';
import type { InscripcionData } from '@/lib/firestore';
import FichaButton from '@/app/admin/conversaciones/[phone]/FichaButton';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mes`;
}

const TX_ACCENT: Record<string, string> = {
  'Automático': '#3b82f6',
  'Estándar':   '#8b5cf6',
  'Moto':       '#f97316',
  'Mixto':      '#14b8a6',
};

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

export default async function FichasPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const inscripciones = await getRecentInscripciones(60).catch((): (InscripcionData & { phone: string })[] => []);

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      <header className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
          <h1 className="text-base font-bold text-white">Fichas de Inscripción</h1>
          <span className="ml-auto text-xs" style={{ color: '#475569' }}>{inscripciones.length} registros</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {inscripciones.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: '#64748b' }}>Aún no hay inscripciones registradas.</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>Aparecen aquí cuando Luz cierra una venta por WhatsApp.</p>
          </div>
        )}

        {inscripciones.map((ins) => {
          const displayPhone = ins.telefono.startsWith('52') && ins.telefono.length === 12
            ? ins.telefono.slice(2) : ins.telefono;
          const txAccent = TX_ACCENT[ins.transmision] ?? '#64748b';
          const primerFecha = ins.fechas[0];
          const esPreReserva = ins.status === 'pre_reserva';

          return (
            <div key={ins.phone} className="rounded-2xl overflow-hidden" style={{
              ...CARD,
              border: esPreReserva ? '1px solid rgba(245,158,11,0.3)' : CARD.border,
            }}>
              {esPreReserva && (
                <div className="px-4 py-1.5 flex items-center gap-2"
                  style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>⏳ Pre-reserva — pendiente de pago</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base leading-tight" style={{ color: '#e2e8f0' }}>{ins.nombre}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{displayPhone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${txAccent}18`, color: txAccent, border: `1px solid ${txAccent}30` }}>
                    {ins.transmision}
                  </span>
                  <span className="text-xs" style={{ color: '#475569' }}>{timeAgo(ins.fechaConfirmacion)}</span>
                </div>
              </div>

              {/* Zona */}
              {ins.zona && (
                <div className="px-4 py-2"
                  style={{ borderBottom: '1px solid rgba(148,163,184,0.07)', background: 'rgba(148,163,184,0.03)' }}>
                  <p className="text-xs" style={{ color: '#64748b' }}>📍 {ins.zona}</p>
                </div>
              )}

              {/* Fechas */}
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#475569' }}>
                  {ins.fechas.length} sesión{ins.fechas.length !== 1 ? 'es' : ''}
                  {primerFecha ? ` · empieza ${formatDate(primerFecha.date)} ${primerFecha.time}` : ''}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {ins.fechas.map((f, i) => (
                    <div key={i} className="text-xs rounded-lg px-2 py-1.5"
                      style={{ background: 'rgba(148,163,184,0.06)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <span className="font-medium mr-1" style={{ color: '#475569' }}>{i + 1}.</span>
                      {formatDate(f.date)} · {f.time}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="px-4 pb-4 space-y-2">
                <div className="rounded-xl p-2" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.07)' }}>
                  <FichaButton data={ins} />
                </div>
                <Link
                  href={`/admin/conversaciones/${ins.phone}`}
                  className="block text-center text-xs font-medium py-1"
                  style={{ color: '#60a5fa' }}
                >
                  Ver conversación →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
