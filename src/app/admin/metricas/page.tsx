import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMetricsData, type ChatState } from '@/lib/firestore';
import Link from 'next/link';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

const STATE_LABEL: Record<ChatState, string> = {
  tu_turno:          'Tu turno',
  atascado:          'Atascado',
  esperando_cliente: 'Esperando',
  luz_atendiendo:    'Con Luz',
  frio:              'Frío',
  cerrado:           'Cerrado',
};

const STATE_COLOR: Record<ChatState, string> = {
  tu_turno:          '#ef4444',
  atascado:          '#f59e0b',
  esperando_cliente: '#60a5fa',
  luz_atendiendo:    '#34d399',
  frio:              '#475569',
  cerrado:           '#1e293b',
};

const PIPELINE_ORDER: ChatState[] = [
  'tu_turno', 'atascado', 'esperando_cliente', 'luz_atendiendo', 'frio', 'cerrado',
];

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
};

export default async function MetricasPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const m = await getMetricsData();

  const convRate = m.totalLeads > 0
    ? ((m.closedGanado / m.totalLeads) * 100).toFixed(1)
    : '0.0';

  const avgPrice = 3400;
  const revenueEst = m.closedGanado * avgPrice;

  const sources = Object.entries(m.bySource).sort((a, b) => b[1] - a[1]);
  const maxSource = sources[0]?.[1] ?? 1;

  const courses = Object.entries(m.byCourse).sort((a, b) => b[1] - a[1]);
  const maxCourse = courses[0]?.[1] ?? 1;

  const activeTotal = m.totalLeads - (m.byState['cerrado'] ?? 0);

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
        <h1 className="text-base font-bold text-white">Métricas</h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total leads',       value: m.totalLeads,    color: '#e2e8f0', sub: `${m.activeToday} hoy · ${m.activeThisWeek} esta semana` },
            { label: 'Inscritos',         value: m.closedGanado,  color: '#34d399', sub: `${convRate}% conversión` },
            { label: 'Ingreso estimado',  value: `$${revenueEst.toLocaleString('es-MX')}`, color: '#e2e8f0', sub: '~$3,400 por inscripción', large: false },
            { label: 'Pipeline activo',   value: activeTotal,     color: '#60a5fa', sub: `${m.closedPerdido} perdidos` },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="rounded-2xl p-4" style={CARD}>
              <p className="text-xs font-medium" style={{ color: '#475569' }}>{label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Embudo */}
        <div className="rounded-2xl p-4" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#cbd5e1' }}>Embudo de conversión</p>
          <div className="space-y-3">
            {[
              { label: 'Leads totales',          value: m.totalLeads,   color: '#3b82f6' },
              { label: 'Llegaron a "Tu turno"',  value: (m.byState['tu_turno'] ?? 0) + (m.closedGanado) + (m.closedPerdido), color: '#f59e0b' },
              { label: 'Inscritos',              value: m.closedGanado, color: '#34d399' },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: '#64748b' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: '#cbd5e1' }}>{row.value}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: m.totalLeads > 0 ? `${(row.value / m.totalLeads) * 100}%` : '0%', background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl p-4" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#cbd5e1' }}>Pipeline actual</p>
          <div className="space-y-2.5">
            {PIPELINE_ORDER.map(state => {
              const count = m.byState[state] ?? 0;
              const pct = m.totalLeads > 0 ? (count / m.totalLeads) * 100 : 0;
              return (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0" style={{ color: '#64748b' }}>{STATE_LABEL[state]}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATE_COLOR[state] }} />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right" style={{ color: '#94a3b8' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por fuente */}
        {sources.length > 0 && (
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#cbd5e1' }}>Por fuente</p>
            <div className="space-y-2.5">
              {sources.map(([src, count]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-xs flex-1 truncate" style={{ color: '#64748b' }}>{src}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / maxSource) * 100}%`, background: '#3b82f6' }} />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right" style={{ color: '#94a3b8' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Por curso */}
        {courses.length > 0 && (
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#cbd5e1' }}>Interés por curso</p>
            <div className="space-y-2.5">
              {courses.map(([course, count]) => (
                <div key={course} className="flex items-center gap-3">
                  <span className="text-xs flex-1 truncate" style={{ color: '#64748b' }}>{course}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / maxCourse) * 100}%`, background: '#8b5cf6' }} />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right" style={{ color: '#94a3b8' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] pb-4" style={{ color: '#334155' }}>
          Datos en tiempo real desde Firestore
        </p>
      </div>
    </main>
  );
}
