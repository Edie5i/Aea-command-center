import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentFichas, getFichasStats, getMetricsData } from '@/lib/firestore';
import { getEventosProximos } from '@/services/calendarService';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
};

const DIVIDER = '1px solid rgba(148,163,184,0.07)';

const navItems = [
  { href: '/admin/conversaciones', icon: '💬', label: 'Conversaciones', accent: '#3b82f6' },
  { href: '/ficha',                icon: '📋', label: 'Nueva ficha',     accent: '#1d4ed8' },
  { href: '/admin/fichas',         icon: '🗂️', label: 'Fichas',          accent: '#10b981' },
  { href: '/admin/metricas',       icon: '📊', label: 'Métricas',        accent: '#8b5cf6' },
  { href: '/admin/alumnos',        icon: '👥', label: 'Alumnos',         accent: '#6366f1' },
  { href: '/notas-alumno',         icon: '📝', label: 'Notas alumno',    accent: '#14b8a6' },
  { href: '/admin/importar',       icon: '📥', label: 'Importar ficha',  accent: '#f97316' },
  { href: '/admin/agenda',         icon: '🗓️', label: 'Agenda NLP',      accent: '#a855f7' },
  { href: '/admin/instructores',   icon: '🚗', label: 'Instructores',    accent: '#64748b' },
  { href: '/agenda',               icon: '📅', label: 'Agendar clase',   accent: '#06b6d4' },
  { href: '/admin/links',          icon: '🔗', label: 'Links equipo',    accent: '#475569' },
  { href: '/chatbot',              icon: '🤖', label: 'Chatbot Luz',     accent: '#ec4899' },
];

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const [fichasStats, recentFichas, metricas, eventos] = await Promise.all([
    getFichasStats().catch(() => ({ total: 0, thisWeek: 0, uniqueStudents: 0 })),
    getRecentFichas(8).catch(() => []),
    getMetricsData().catch(() => null),
    getEventosProximos(30).catch(() => []),
  ]);

  const pct = (n: number, total: number) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Header metálico */}
      <header className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">AEA Admin</h1>
          <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>Auto Escuela Americana</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #334155, #1e293b)', border: '1px solid rgba(148,163,184,0.18)' }}>
          🔑
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: fichasStats.uniqueStudents, label: 'Alumnos',       color: '#e2e8f0' },
            { value: fichasStats.thisWeek,        label: 'Fichas / sem',  color: '#60a5fa' },
            { value: eventos.length,              label: 'Próx. clases',  color: '#34d399' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={CARD}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-[11px] mt-1" style={{ color: '#475569' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Luz */}
        {metricas && (
          <div className="rounded-2xl p-4" style={CARD}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Pipeline Luz</p>
              <Link href="/admin/metricas" className="text-xs" style={{ color: '#60a5fa' }}>Ver todo →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Tu turno',  value: metricas.byState['tu_turno'] ?? 0,       color: '#f87171' },
                { label: 'Con Luz',   value: metricas.byState['luz_atendiendo'] ?? 0,  color: '#34d399' },
                { label: 'Inscritos', value: metricas.closedGanado,                     color: '#60a5fa' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[11px]" style={{ color: '#475569' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximas clases */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Próximas clases</p>
            <span className="text-xs" style={{ color: '#475569' }}>{eventos.length} agendadas</span>
          </div>

          {eventos.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-sm" style={{ color: '#475569' }}>
              Sin clases en los próximos 30 días
            </div>
          ) : (
            <div>
              {eventos.map((ev, i) => (
                <div key={ev.id} className="px-4 py-3 flex items-start gap-3"
                  style={{ borderTop: i > 0 ? DIVIDER : undefined }}>
                  <div className="shrink-0 rounded-xl px-2.5 py-2 text-center min-w-[52px]"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: '#60a5fa' }}>
                      {formatDate(ev.inicio).split(' ')[0]}
                    </p>
                    <p className="text-lg font-bold leading-tight" style={{ color: '#93c5fd' }}>
                      {new Date(ev.inicio).toLocaleDateString('es-MX', {
                        timeZone: 'America/Mexico_City',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#e2e8f0' }}>{ev.alumno}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      {formatTime(ev.inicio)} – {formatTime(ev.fin)}
                    </p>
                    {ev.ubicacion && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>📍 {ev.ubicacion}</p>
                    )}
                  </div>
                  {ev.telefono && (
                    <Link href="/notas-alumno"
                      className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg"
                      style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.12)' }}>
                      Notas
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fichas recientes */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Fichas recientes</p>
            <Link href="/admin/alumnos" className="text-xs" style={{ color: '#60a5fa' }}>Ver alumnos →</Link>
          </div>

          {recentFichas.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-sm" style={{ color: '#475569' }}>
              Aún no hay fichas guardadas
            </div>
          ) : (
            <div>
              {recentFichas.map((f, i) => {
                const completionPct = pct(f.completedCount, f.totalTopics);
                return (
                  <div key={f.id} className="px-4 py-3 flex items-center gap-3"
                    style={{ borderTop: i > 0 ? DIVIDER : undefined }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #334155, #1e293b)', border: '1px solid rgba(148,163,184,0.18)', color: '#94a3b8' }}>
                      {f.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color: '#e2e8f0' }}>{f.studentName}</p>
                        <span className="text-xs shrink-0" style={{ color: '#475569' }}>{timeAgo(f.dateMillis)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
                        </div>
                        <span className="text-xs shrink-0" style={{ color: '#475569' }}>{f.completedCount}/{f.totalTopics}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nav cuadrícula */}
        <div className="grid grid-cols-3 gap-3">
          {navItems.map(({ href, icon, label, accent }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-4 text-center transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))',
                border: `1px solid ${accent}30`,
              }}
            >
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xs font-semibold leading-tight" style={{ color: '#94a3b8' }}>{label}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-[11px] pb-4" style={{ color: '#334155' }}>
          Auto Escuela Americana · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
