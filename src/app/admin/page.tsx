import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMetricsData, getAvisosAdminRecientes, getConstanciasPendientes } from '@/lib/firestore';
import { getEventosProximos } from '@/services/calendarService';
import { traerFichas } from '@/lib/fichaLuz';

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
  background: 'white',
  border: '1px solid rgba(148,163,184,0.2)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const DIVIDER = '1px solid rgba(148,163,184,0.2)';

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

  const [fichas, metricas, eventos, avisos, constancias] = await Promise.all([
    traerFichas().catch(() => []),
    getMetricsData().catch(() => null),
    getEventosProximos(30).catch(() => []),
    getAvisosAdminRecientes(8).catch(() => []),
    getConstanciasPendientes().catch(() => []),
  ]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const uniqueStudents = new Set(fichas.map(f => f.telefono || f.studentName)).size;
  const fichasThisWeek = fichas.filter(f => f.creada >= weekAgo).length;
  const recentFichas = fichas.slice(0, 8);

  return (
    <main className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-wide">AEA Admin</h1>
          <p className="text-[11px] mt-0.5 text-slate-500">Auto Escuela Americana</p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600">
          <span className="text-sm">AE</span>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Avisos recientes — respaldo si WhatsApp no entrega (ver adminNotify.ts) */}
        {avisos.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-sm font-bold text-slate-800">🔔 Avisos recientes</p>
              <span className="text-xs text-slate-400">por si WhatsApp no llegó</span>
            </div>
            <div>
              {avisos.map((a, i) => (
                <div key={a.id} className="px-4 py-3"
                  style={{ borderTop: i > 0 ? DIVIDER : undefined }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs shrink-0 text-slate-500">{timeAgo(a.at)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-line mt-1 text-slate-700 font-medium">
                    {a.texto.replace(/[*_~`]/g, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: uniqueStudents,   label: 'Alumnos',       color: '#1e293b' },
            { value: fichasThisWeek,   label: 'Fichas / sem',  color: '#2563eb' },
            { value: eventos.length,   label: 'Próx. clases',  color: '#059669' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={CARD}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-[11px] mt-1 font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Luz */}
        {metricas && (
          <div className="rounded-2xl p-4" style={CARD}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800">Pipeline Luz</p>
              <Link href="/admin/metricas" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Ver todo →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Tu turno',  value: metricas.byState['tu_turno'] ?? 0,       color: '#dc2626' },
                { label: 'Con Luz',   value: metricas.byState['luz_atendiendo'] ?? 0,  color: '#059669' },
                { label: 'Inscritos', value: metricas.closedGanado,                     color: '#2563eb' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constancias que se deben. Solo aparece si hay alguna: no vale la pena
            ocupar espacio en el tablero para decir que no hay pendientes. */}
        {constancias.length > 0 && (
          <div className="rounded-2xl p-4" style={CARD}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800">📜 Constancias pendientes</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {constancias.length}
              </span>
            </div>
            <div className="space-y-2">
              {constancias.map(c => (
                <div key={c.phone} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.nombre || '—'}</p>
                    <p className="text-xs text-slate-500">
                      {c.edadAlumno ? `${c.edadAlumno} años · ` : ''}SEMOVI · $500
                    </p>
                  </div>
                  <Link
                    href={`/admin/conversaciones/${c.phone}`}
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Ver →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximas clases */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-bold text-slate-800">Próximas clases</p>
            <span className="text-xs font-medium text-slate-400">{eventos.length} agendadas</span>
          </div>

          {eventos.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-sm text-slate-400">
              Sin clases en los próximos 30 días
            </div>
          ) : (
            <div>
              {eventos.map((ev, i) => (
                <div key={ev.id} className="px-4 py-3 flex items-start gap-3"
                  style={{ borderTop: i > 0 ? DIVIDER : undefined }}>
                  <div className="shrink-0 rounded-xl px-2.5 py-2 text-center min-w-[52px] bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-bold uppercase text-blue-600">
                      {formatDate(ev.inicio).split(' ')[0]}
                    </p>
                    <p className="text-lg font-black leading-tight text-blue-700">
                      {new Date(ev.inicio).toLocaleDateString('es-MX', {
                        timeZone: 'America/Mexico_City',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-slate-700">{ev.alumno}</p>
                    <p className="text-xs mt-0.5 font-medium text-slate-500">
                      {formatTime(ev.inicio)} – {formatTime(ev.fin)}
                    </p>
                    {ev.ubicacion && (
                      <p className="text-xs mt-0.5 truncate text-slate-500">📍 {ev.ubicacion}</p>
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
            <p className="text-sm font-bold text-slate-800">Fichas recientes</p>
            <Link href="/admin/reservas" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Ver reservas →</Link>
          </div>

          {recentFichas.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center text-sm text-slate-400">
              Aún no hay fichas guardadas
            </div>
          ) : (
            <div>
              {recentFichas.map((f, i) => {
                const reservada = f.faltantes.length === 0;
                return (
                  <div key={f.id} className="px-4 py-3 flex items-center gap-3"
                    style={{ borderTop: i > 0 ? DIVIDER : undefined }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-slate-100 border border-slate-200 text-slate-500">
                      {(f.studentName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-bold text-sm truncate text-slate-700">{f.studentName || 'Sin nombre'}</p>
                        <span className="text-xs shrink-0 text-slate-400">{timeAgo(f.creada)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs truncate text-slate-500">
                          {f.curso || 'Curso ?'} · {f.origen === 'luz' ? '💬 Luz' : '🌐 Web'}
                        </span>
                        <span className="text-xs shrink-0 font-bold" style={{ color: reservada ? '#059669' : '#d97706' }}>
                          {reservada ? '✅ Reservada' : `Falta: ${f.faltantes.join(', ')}`}
                        </span>
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
              className="rounded-2xl p-4 text-center transition-transform active:scale-95 bg-white border shadow-sm hover:shadow-md hover:bg-slate-50"
              style={{
                border: `1px solid ${accent}40`,
              }}
            >
              <p className="text-2xl mb-2 drop-shadow-sm">{icon}</p>
              <p className="text-xs font-bold leading-tight text-slate-600">{label}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-[11px] pb-4 font-medium text-slate-400">
          Auto Escuela Americana · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
