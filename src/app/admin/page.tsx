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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AEA Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">Auto Escuela Americana</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/conversaciones"
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold"
            >
              Conversaciones
            </Link>
            <Link
              href="/admin/agenda"
              className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold"
            >
              Agenda NLP
            </Link>
            <Link
              href="/admin/metricas"
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold"
            >
              Métricas
            </Link>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* KPIs rápidos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{fichasStats.uniqueStudents}</p>
            <p className="text-xs text-gray-400 mt-1">Alumnos</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-blue-600">{fichasStats.thisWeek}</p>
            <p className="text-xs text-gray-400 mt-1">Fichas / semana</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">{eventos.length}</p>
            <p className="text-xs text-gray-400 mt-1">Clases próximas</p>
          </div>
        </div>

        {/* Leads pipeline (si hay métricas) */}
        {metricas && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Pipeline Luz</p>
              <Link href="/admin/metricas" className="text-xs text-blue-600">Ver todo →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Tu turno', value: metricas.byState['tu_turno'] ?? 0, color: 'text-red-600' },
                { label: 'Con Luz', value: metricas.byState['luz_atendiendo'] ?? 0, color: 'text-emerald-600' },
                { label: 'Inscritos', value: metricas.closedGanado, color: 'text-blue-600' },
              ].map(item => (
                <div key={item.label}>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximas clases */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-gray-700">Próximas clases (30 días)</p>
            <span className="text-xs text-gray-400">{eventos.length} agendadas</span>
          </div>

          {eventos.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-gray-400 text-sm">
              Sin clases en los próximos 7 días
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {eventos.map(ev => (
                <div key={ev.id} className="px-4 py-3 flex items-start gap-3">
                  {/* Fecha */}
                  <div className="shrink-0 bg-blue-50 rounded-xl px-2.5 py-2 text-center min-w-[52px]">
                    <p className="text-xs text-blue-400 font-semibold uppercase">
                      {formatDate(ev.inicio).split(' ')[0]}
                    </p>
                    <p className="text-lg font-bold text-blue-700 leading-tight">
                      {new Date(ev.inicio).toLocaleDateString('es-MX', {
                        timeZone: 'America/Mexico_City',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{ev.alumno}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(ev.inicio)} – {formatTime(ev.fin)}
                    </p>
                    {ev.ubicacion && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {ev.ubicacion}</p>
                    )}
                  </div>
                  {/* Link a notas */}
                  {ev.telefono && (
                    <Link
                      href={`/notas-alumno`}
                      className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Notas
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fichas recientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-gray-700">Fichas recientes</p>
            <Link href="/admin/alumnos" className="text-xs text-blue-600">Ver alumnos →</Link>
          </div>

          {recentFichas.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-gray-400 text-sm">
              Aún no hay fichas guardadas
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentFichas.map(f => {
                const completionPct = pct(f.completedCount, f.totalTopics);
                return (
                  <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0">
                      {f.studentName.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{f.studentName}</p>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(f.dateMillis)}</span>
                      </div>
                      {/* Barra de progreso */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">
                          {f.completedCount}/{f.totalTopics}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Importar ficha — botón prominente para móvil */}
        <Link
          href="/admin/importar"
          className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl p-4 shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <span className="text-2xl">📥</span>
          <div className="text-left">
            <p className="font-bold text-base leading-tight">Importar ficha</p>
            <p className="text-blue-200 text-xs mt-0.5">Sube foto o PDF → Calendar automático</p>
          </div>
          <span className="ml-auto text-white/60 text-xl">→</span>
        </Link>

        {/* Nav rápida */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/notas-alumno"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 transition-colors"
          >
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm font-semibold text-gray-700">Notas de alumno</p>
          </Link>
          <Link
            href="/admin/alumnos"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 transition-colors"
          >
            <p className="text-2xl mb-1">👥</p>
            <p className="text-sm font-semibold text-gray-700">Historial alumnos</p>
          </Link>
          <Link
            href="/agenda"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 transition-colors"
          >
            <p className="text-2xl mb-1">📅</p>
            <p className="text-sm font-semibold text-gray-700">Agendar clase</p>
          </Link>
          <Link
            href="/admin/conversaciones"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 transition-colors"
          >
            <p className="text-2xl mb-1">💬</p>
            <p className="text-sm font-semibold text-gray-700">Conversaciones</p>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          Auto Escuela Americana · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
