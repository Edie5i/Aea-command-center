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

const ESTADO_META: Record<EstadoCandidato, { label: string; color: string; dot: string }> = {
  nuevo:               { label: 'Nuevo',              color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  calificando:         { label: 'Calificando',         color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  calificado:          { label: 'Calificado',          color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  evaluacion_agendada: { label: 'Evaluación agendada', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  activo:              { label: 'Activo',              color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rechazado:           { label: 'Rechazado',           color: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
};

const TX_ICON: Record<string, string> = {
  estandar:  '🔧',
  automatico: '🔵',
  ambas:     '⚡',
};

const PIPELINE: EstadoCandidato[] = [
  'evaluacion_agendada',
  'calificado',
  'calificando',
  'nuevo',
  'activo',
  'rechazado',
];

function CandidatoCard({
  c,
  clasesActivas,
  inscripciones,
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 border-b border-gray-50">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-indigo-600 font-bold text-sm">
            {(c.nombre ?? displayPhone)[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">
            {c.nombre ?? `+${displayPhone}`}
          </p>
          <a href={waLink} target="_blank" className="text-xs text-blue-500">
            +{displayPhone}
          </a>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(c.actualizadoEn)}</span>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        {c.rating !== undefined && (
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span className="font-semibold text-gray-800">{c.rating}</span>
            <span className="text-gray-400">rating</span>
          </div>
        )}
        {c.aniosManejando !== undefined && (
          <div className="flex items-center gap-1">
            <span>🚗</span>
            <span className="font-semibold text-gray-800">{c.aniosManejando}</span>
            <span className="text-gray-400">años</span>
          </div>
        )}
        {c.transmisiones && (
          <div className="flex items-center gap-1">
            <span>{TX_ICON[c.transmisiones] ?? '🔧'}</span>
            <span className="capitalize text-gray-700">{c.transmisiones}</span>
          </div>
        )}
        {c.licenciaB !== undefined && (
          <div className="flex items-center gap-1">
            <span>{c.licenciaB ? '✅' : '❌'}</span>
            <span className="text-gray-700">Licencia B</span>
          </div>
        )}
        {c.zonas && (
          <div className="col-span-2 flex items-start gap-1">
            <span>📍</span>
            <span className="text-gray-600 truncate">{c.zonas}</span>
          </div>
        )}
        {c.evaluacionFecha && (
          <div className="col-span-2 flex items-center gap-1 bg-purple-50 rounded-lg px-2 py-1.5">
            <span>📅</span>
            <span className="font-semibold text-purple-700">
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

  // Phones de alumnos que ya tienen clase activa asignada
  const alumnosAsignados = new Set(clases.map(c => c.alumnoPhone));

  // Inscripciones disponibles para asignar (sin instructor activo)
  const inscripcionesDisponibles = todasInscripciones.filter(
    ins => !alumnosAsignados.has(ins.phone)
  );

  // Clases activas por instructor
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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 font-medium text-sm">← Admin</Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">Instructores UrbDriver</h1>
            <p className="text-xs text-gray-400">{todos.length} candidatos · {activos} activos</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4">
        {[
          { label: 'Activos',    value: activos,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En proceso', value: enProceso, color: 'text-yellow-600',  bg: 'bg-yellow-50' },
          { label: 'Evaluación', value: agendados, color: 'text-purple-600',  bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alumnos disponibles para asignar */}
      {inscripcionesDisponibles.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">
            {inscripcionesDisponibles.length} alumno{inscripcionesDisponibles.length !== 1 ? 's' : ''} sin instructor asignado
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Toca "Asignar clase" en un instructor activo para asignarlos.
          </p>
        </div>
      )}

      <div className="px-4 pb-8 mt-4 space-y-6">
        {todos.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-3xl mb-2">🚗</p>
            <p className="text-gray-400 text-sm font-medium">Sin candidatos todavía</p>
            <p className="text-gray-300 text-xs mt-1">
              Cuando alguien escriba "quiero ser instructor", Marco los califica aquí.
            </p>
            <div className="mt-4 bg-gray-50 rounded-xl p-3 text-left">
              <p className="text-xs text-gray-500 font-semibold mb-1">Link para ads UrbDriver:</p>
              <p className="text-xs text-blue-500 break-all">
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
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <h2 className="text-sm font-bold text-gray-700">{meta.label}</h2>
                <span className="text-xs text-gray-400 ml-1">{candidatos.length}</span>
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
