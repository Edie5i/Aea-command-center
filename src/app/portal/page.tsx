import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCandidato, getClasesDeInstructor } from '@/lib/firestore';
import type { ClaseAsignada } from '@/lib/firestore';
import { ClaseActions } from './ClaseActions';
import { LogoutButton } from './LogoutButton';

const TX_LABEL: Record<string, string> = {
  estandar: 'Estándar', automatico: 'Automático', ambas: 'Ambas',
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente:      { label: 'Pendiente',      color: '#f59e0b' },
  confirmada:     { label: 'Confirmada',     color: '#34d399' },
  completada:     { label: 'Completada',     color: '#475569' },
  alumno_ausente: { label: 'Alumno ausente', color: '#f87171' },
  cancelada:      { label: 'Cancelada',      color: '#334155'  },
};

function formatFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Mexico_City',
  });
}

function ClaseCard({ clase }: { clase: ClaseAsignada }) {
  const cfg = ESTADO_CONFIG[clase.estado] ?? ESTADO_CONFIG.pendiente;

  return (
    <div className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-white text-base">{clase.alumnoNombre}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{clase.hora} · {clase.zona}</p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
          <span className="text-xs" style={{ color: '#475569' }}>{cfg.label}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
          {TX_LABEL[clase.transmision] ?? clase.transmision}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(148,163,184,0.06)', color: '#64748b', border: '1px solid rgba(148,163,184,0.1)' }}>
          {clase.curso}
        </span>
      </div>
      <ClaseActions clase={clase} />
    </div>
  );
}

export default async function PortalPage() {
  const phone = cookies().get('instructor_phone')?.value;
  if (!phone) redirect('/portal/login');

  const [candidato, todasLasClases] = await Promise.all([
    getCandidato(phone),
    getClasesDeInstructor(phone),
  ]);

  if (!candidato || candidato.estado !== 'activo') redirect('/portal/login');

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const limite = new Date();
  limite.setDate(limite.getDate() + 7);
  const limiteStr = limite.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const clasesHoy = todasLasClases.filter(c => c.fecha === hoy && c.estado !== 'cancelada');
  const proximas = todasLasClases.filter(
    (c): c is ClaseAsignada =>
      c.fecha > hoy && c.fecha <= limiteStr && ['pendiente', 'confirmada'].includes(c.estado)
  );

  const nombre = candidato.nombre ?? `+${phone.slice(2)}`;
  const inicial = nombre[0].toUpperCase();

  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-12 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl text-white"
              style={{
                background: 'conic-gradient(from 0deg, #334155, #64748b, #e2e8f0, #94a3b8, #334155)',
                padding: 2,
                borderRadius: 16,
              }}>
              <div className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 14 }}>
                <span className="text-xl font-bold text-white">{inicial}</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>Instructor activo</p>
              <h1 className="text-lg font-bold text-white">{nombre}</h1>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {candidato.zonas && (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                📍 {candidato.zonas}
              </span>
            )}
            {candidato.transmisiones && (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                🔧 {TX_LABEL[candidato.transmisiones] ?? candidato.transmisiones}
              </span>
            )}
            {candidato.rating && (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}>
                ⭐ {candidato.rating}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="text-3xl font-bold text-white">{clasesHoy.length}</p>
              <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Clases hoy</p>
            </div>
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
              <p className="text-3xl font-bold text-white">{proximas.length}</p>
              <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Esta semana</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-lg mx-auto">

        {/* Hoy */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#334155' }}>Hoy</p>
          {clasesHoy.length > 0 ? (
            <div className="space-y-3">
              {clasesHoy.map(c => <ClaseCard key={c.id} clase={c} />)}
            </div>
          ) : (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(148,163,184,0.03)', border: '1px solid rgba(148,163,184,0.07)' }}>
              <p className="text-sm" style={{ color: '#334155' }}>Sin clases asignadas hoy</p>
            </div>
          )}
        </section>

        {/* Próximas */}
        {proximas.length > 0 && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#334155' }}>Próximos 7 días</p>
            <div className="space-y-4">
              {proximas.map(c => (
                <div key={c.id}>
                  <p className="text-xs mb-2 ml-1 capitalize" style={{ color: '#334155' }}>{formatFecha(c.fecha)}</p>
                  <ClaseCard clase={c} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comandos WA */}
        <section className="rounded-2xl p-4"
          style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid rgba(148,163,184,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#334155' }}>Comandos WhatsApp</p>
          <div className="space-y-2 text-sm">
            <p style={{ color: '#475569' }}>📅 <span className="font-medium" style={{ color: '#94a3b8' }}>!agenda</span> — ver clases</p>
            <p style={{ color: '#475569' }}>✅ <span className="font-medium" style={{ color: '#94a3b8' }}>confirmada</span> — aceptar clase</p>
            <p style={{ color: '#475569' }}>🏁 <span className="font-medium" style={{ color: '#94a3b8' }}>llegué</span> — marcar completada</p>
            <p style={{ color: '#475569' }}>❌ <span className="font-medium" style={{ color: '#94a3b8' }}>no llegó</span> — alumno ausente</p>
          </div>
        </section>

        <LogoutButton />
      </div>
    </main>
  );
}
