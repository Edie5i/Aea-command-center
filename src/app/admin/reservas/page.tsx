import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { traerFichas, linkCierre, type Ficha } from '@/lib/fichaLuz';

export const dynamic = 'force-dynamic';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

const ORIGEN_CHIP: Record<Ficha['origen'], { label: string; color: string }> = {
  web: { label: '🌐 Web', color: '#3b82f6' },
  luz: { label: '💬 Luz', color: '#22c55e' },
};

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

function badge(f: Ficha): { texto: string; color: string } {
  return f.faltantes.length === 0
    ? { texto: '✅ RESERVADA', color: '#22c55e' }
    : { texto: `⚠️ FALTA: ${f.faltantes.join(', ')}`, color: '#f59e0b' };
}

export default async function ReservasPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const fichas = await traerFichas().catch((): (Ficha & { id: string })[] => []);

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
          <h1 className="text-base font-bold text-white">Reservas (web + Luz)</h1>
          <span className="ml-auto text-xs" style={{ color: '#475569' }}>{fichas.length} fichas</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {fichas.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: '#64748b' }}>Aún no hay fichas.</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>
              Aparecen aquí cuando alguien llena la agenda web o Luz arma una ficha por WhatsApp.
            </p>
          </div>
        )}

        {fichas.map((f) => {
          const b = badge(f);
          const chip = ORIGEN_CHIP[f.origen] ?? ORIGEN_CHIP.web;
          return (
            <div key={f.id} className="rounded-2xl p-4" style={CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white truncate">{f.studentName || 'Sin nombre'}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: chip.color, border: `1px solid ${chip.color}44` }}>
                      {chip.label}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {f.curso || 'Curso ?'} · ${f.precio.toLocaleString('es-MX')} · Depósito ${f.depositoMonto.toLocaleString('es-MX')}
                  </p>
                  {f.opcionesFechaHora.length > 0 && (
                    <p className="text-xs mt-1 truncate" style={{ color: '#475569' }}>
                      📅 {f.opcionesFechaHora.join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: '#475569' }}>{timeAgo(f.creada)}</span>
              </div>

              <div className="flex items-center justify-between gap-3 mt-3">
                <span className="text-xs font-semibold" style={{ color: b.color }}>{b.texto}</span>
                {f.comprobanteURL && (
                  <a
                    href={f.comprobanteURL.replace('/api/admin/comprobante', '/admin/comprobante')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    📎 Ver comprobante
                  </a>
                )}
                {f.telefono && (
                  <a
                    href={linkCierre(f)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    Cerrar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
