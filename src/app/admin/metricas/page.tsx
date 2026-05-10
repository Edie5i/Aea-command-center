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
  tu_turno:          'bg-red-500',
  atascado:          'bg-amber-500',
  esperando_cliente: 'bg-blue-400',
  luz_atendiendo:    'bg-emerald-500',
  frio:              'bg-gray-300',
  cerrado:           'bg-gray-200',
};

const PIPELINE_ORDER: ChatState[] = [
  'tu_turno', 'atascado', 'esperando_cliente', 'luz_atendiendo', 'frio', 'cerrado',
];

// Precio promedio estimado por curso (para estimado de ingresos)
const COURSE_PRICES: Record<string, number> = {
  'Estándar': 3400, 'Automático': 3900, 'Intermedio': 2600, 'Avanzado': 1900,
  'Reforzamiento': 1800, 'Personas Nerviosas': 5100, 'Intensivo': 5100,
  'Mixto': 5100, 'English Drive': 4800, 'Moto': 4300, 'Coche Propio': 3900,
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

  // Estimado de ingresos: ganados × $3,400 promedio (sin datos de curso → promedio)
  const avgPrice = 3400;
  const revenueEst = m.closedGanado * avgPrice;

  // Fuentes ordenadas por volumen
  const sources = Object.entries(m.bySource).sort((a, b) => b[1] - a[1]);
  const maxSource = sources[0]?.[1] ?? 1;

  // Cursos ordenados por volumen
  const courses = Object.entries(m.byCourse).sort((a, b) => b[1] - a[1]);
  const maxCourse = courses[0]?.[1] ?? 1;

  // Pipeline activo (excluye cerrado)
  const activeTotal = m.totalLeads - (m.byState['cerrado'] ?? 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/conversaciones" className="text-blue-600 font-medium text-sm">
            ← Conversaciones
          </Link>
          <h1 className="text-base font-bold text-gray-900">Métricas</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Total leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{m.totalLeads}</p>
            <p className="text-xs text-gray-400 mt-1">{m.activeToday} hoy · {m.activeThisWeek} esta semana</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Inscritos</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{m.closedGanado}</p>
            <p className="text-xs text-gray-400 mt-1">{convRate}% conversión</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Ingreso estimado</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${(revenueEst).toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-gray-400 mt-1">~$3,400 por inscripción</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Pipeline activo</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{activeTotal}</p>
            <p className="text-xs text-gray-400 mt-1">{m.closedPerdido} perdidos</p>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Embudo de conversión</p>
          <div className="space-y-2">
            {[
              { label: 'Leads totales', value: m.totalLeads, color: 'bg-blue-500' },
              { label: 'Llegaron a "Tu turno"', value: (m.byState['tu_turno'] ?? 0) + (m.closedGanado) + (m.closedPerdido), color: 'bg-amber-500' },
              { label: 'Inscritos (ganado)', value: m.closedGanado, color: 'bg-emerald-500' },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{row.label}</span>
                  <span className="font-semibold text-gray-700">{row.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all`}
                    style={{ width: m.totalLeads > 0 ? `${(row.value / m.totalLeads) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline actual */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pipeline actual</p>
          <div className="space-y-2">
            {PIPELINE_ORDER.map(state => {
              const count = m.byState[state] ?? 0;
              const pct = m.totalLeads > 0 ? (count / m.totalLeads) * 100 : 0;
              return (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{STATE_LABEL[state]}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STATE_COLOR[state]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por fuente */}
        {sources.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Por fuente</p>
            <div className="space-y-2">
              {sources.map(([src, count]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 flex-1 truncate">{src}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(count / maxSource) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Por curso */}
        {courses.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Interés por curso</p>
            <div className="space-y-2">
              {courses.map(([course, count]) => (
                <div key={course} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 flex-1 truncate">{course}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(count / maxCourse) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Datos en tiempo real desde Firestore
        </p>
      </div>
    </main>
  );
}
