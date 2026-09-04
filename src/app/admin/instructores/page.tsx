import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  getCandidatos,
  getClasesActivas,
  getRecentInscripciones,
} from '@/lib/firestore';
import type { CandidatoInstructor, EstadoCandidato, InscripcionData } from '@/lib/firestore';
import AsignarModal from './AsignarModal';
import ClasesActivasList from './ClasesActivasList';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

type InscripcionConPhone = InscripcionData & { phone: string };

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

function formatFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

const ESTADO_META: Record<EstadoCandidato, { label: string; badgeBg: string; badgeColor: string; dotColor: string }> = {
  nuevo:               { label: 'Nuevo',              badgeBg: 'rgba(100,116,139,0.12)', badgeColor: '#64748b', dotColor: '#475569' },
  calificando:         { label: 'Calificando',         badgeBg: 'rgba(245,158,11,0.12)', badgeColor: '#f59e0b', dotColor: '#f59e0b' },
  calificado:          { label: 'Calificado',          badgeBg: 'rgba(59,130,246,0.12)', badgeColor: '#60a5fa', dotColor: '#3b82f6' },
  evaluacion_agendada: { label: 'Evaluación agendada', badgeBg: 'rgba(139,92,246,0.12)', badgeColor: '#a78bfa', dotColor: '#8b5cf6' },
  activo:              { label: 'Activo',              badgeBg: 'rgba(52,211,153,0.12)', badgeColor: '#34d399', dotColor: '#10b981' },
  rechazado:           { label: 'Rechazado',           badgeBg: 'rgba(239,68,68,0.1)',   badgeColor: '#f87171', dotColor: '#ef4444' },
};

const TX_ICON: Record<string, string> = {
  estandar:   '🔧',
  automatico: '🔵',
  ambas:      '⚡',
};

const PIPELINE: EstadoCandidato[] = [
  'evaluacion_agendada', 'calificado', 'calificando', 'nuevo', 'activo', 'rechazado',
];

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

function CandidatoCard({
  c, clasesActivas, inscripciones,
}: {
  c: CandidatoInstructor;
  clasesActivas: number;
  inscripciones: InscripcionConPhone[];
}) {
  const meta = ESTADO_META[c.estado];
  const displayPhone = c.phone.startsWith('52') && c.phone.length === 12
    ? c.phone.slice(2) : c.phone;
  const waLink = `https://wa.me/${c.phone}`;

  return (
    <div className="rounded-2xl overflow-hidden" style={CARD}>
      <div className="px-4 pt-4 pb-3 flex items-start gap-3"
        style={{ borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="font-bold text-sm" style={{ color: '#818cf8' }}>
            {(c.nombre ?? displayPhone)[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight text-white">
            {c.nombre ?? `+${displayPhone}`}
          </p>
          <a href={waLink} target="_blank" className="text-xs" style={{ color: '#60a5fa' }}>
            +{displayPhone}
          </a>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeColor}30` }}>
            {meta.label}
          </span>
          <span className="text-xs" style={{ color: '#334155' }}>{timeAgo(c.actualizadoEn)}</span>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-xs">
        {c.rating !== undefined && (
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span className="font-semibold text-white">{c.rating}</span>
            <span style={{ color: '#475569' }}>rating</span>
          </div>
        )}
        {c.aniosManejando !== undefined && (
          <div className="flex items-center gap-1">
            <span>🚗</span>
            <span className="font-semibold text-white">{c.aniosManejando}</span>
            <span style={{ color: '#475569' }}>años</span>
          </div>
        )}
        {c.transmisiones && (
          <div className="flex items-center gap-1">
            <span>{TX_ICON[c.transmisiones] ?? '🔧'}</span>
            <span className="capitalize" style={{ color: '#94a3b8' }}>{c.transmisiones}</span>
          </div>
        )}
        {c.licenciaB !== undefined && (
          <div className="flex items-center gap-1">
            <span>{c.licenciaB ? '✅' : '❌'}</span>
            <span style={{ color: '#94a3b8' }}>Licencia B</span>
          </div>
        )}
        {c.zonas && (
          <div className="col-span-2 flex items-start gap-1">
            <span>📍</span>
            <span className="truncate" style={{ color: '#64748b' }}>{c.zonas}</span>
          </div>
        )}
        {c.evaluacionFecha && (
          <div className="col-span-2 flex items-center gap-1 rounded-lg px-2 py-1.5"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <span>📅</span>
            <span className="font-semibold" style={{ color: '#a78bfa' }}>
              Evaluación: {formatFecha(c.evaluacionFecha)} · {c.evaluacionHora}
            </span>
          </div>
        )}
      </div>

      {c.estado === 'activo' && (
        <div className="px-4 pb-4">
          <AsignarModal
            instructor={c}
            inscripciones={inscripciones}
            clasesActivas={clasesActivas}
          />
        </div>
      )}
    </div>
  );
}

export default async function InstructoresPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const [todos, clases, todasInscripciones] = await Promise.all([
    getCandidatos().catch((): CandidatoInstructor[] => []),
    getClasesActivas().catch((): Awaited<ReturnType<typeof getClasesActivas>> => []),
    getRecentInscripciones(50).catch((): InscripcionConPhone[] => []),
  ]);

  const alumnosAsignados = new Set(clases.map(c => c.alumnoPhone));
  const inscripcionesDisponibles = todasInscripciones.filter(ins => !alumnosAsignados.has(ins.phone));

  const clasesCountMap = new Map<string, number>();
  for (const clase of clases) {
    clasesCountMap.set(clase.instructorPhone, (clasesCountMap.get(clase.instructorPhone) ?? 0) + 1);
  }

  const porEstado = PIPELINE.reduce<Record<EstadoCandidato, CandidatoInstructor[]>>(
    (acc, e) => ({ ...acc, [e]: [] }),
    {} as Record<EstadoCandidato, CandidatoInstructor[]>
  );
  todos.forEach(c => { if (porEstado[c.estado]) porEstado[c.estado].push(c); });

  const activos   = porEstado.activo.length;
  const enProceso = porEstado.calificando.length + porEstado.calificado.length + porEstado.nuevo.length;
  const agendados = porEstado.evaluacion_agendada.length;

  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      <header className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm transition-colors" style={{ color: '#475569' }}>← Admin</Link>
          <div>
            <h1 className="text-base font-bold text-white">Instructores UrbDriver</h1>
            <p className="text-xs" style={{ color: '#334155' }}>{todos.length} candidatos · {activos} activos</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4">
        {[
          { label: 'Activos',    value: activos,   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)' },
          { label: 'En proceso', value: enProceso, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
          { label: 'Evaluación', value: agendados, color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <ClasesActivasList clases={clases} />

      {/* Alumnos sin asignar */}
      {inscripcionesDisponibles.length > 0 && (
        <div className="mx-4 mt-4 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
            {inscripcionesDisponibles.length} alumno{inscripcionesDisponibles.length !== 1 ? 's' : ''} sin instructor asignado
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
            Toca "Asignar clase" en un instructor activo para asignarlos.
          </p>
        </div>
      )}

      <div className="px-4 pb-8 mt-4 space-y-6">
        {todos.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-3xl mb-2">🚗</p>
            <p className="text-sm font-medium" style={{ color: '#475569' }}>Sin candidatos todavía</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>
              Cuando alguien escriba "quiero ser instructor", Marco los califica aquí.
            </p>
            <div className="mt-4 rounded-xl p-3 text-left"
              style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#475569' }}>Link para ads UrbDriver:</p>
              <p className="text-xs break-all" style={{ color: '#60a5fa' }}>
                wa.me/5215563206338?text=Quiero+ser+instructor+de+manejo
              </p>
            </div>
          </div>
        )}

        {PIPELINE.filter(e => porEstado[e].length > 0).map(estado => {
          const meta = ESTADO_META[estado];
          const candidatos = porEstado[estado];
          return (
            <section key={estado}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dotColor }} />
                <h2 className="text-sm font-bold" style={{ color: '#94a3b8' }}>{meta.label}</h2>
                <span className="text-xs" style={{ color: '#334155' }}>{candidatos.length}</span>
              </div>
              <div className="space-y-3">
                {candidatos.map(c => (
                  <CandidatoCard
                    key={c.phone}
                    c={c}
                    clasesActivas={clasesCountMap.get(c.phone) ?? 0}
                    inscripciones={inscripcionesDisponibles}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
