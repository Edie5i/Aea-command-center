import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCandidato, getClasesDeInstructor } from '@/lib/firestore';
import type { ClaseAsignada } from '@/lib/firestore';
import { ClaseActions } from './ClaseActions';
import { LogoutButton } from './LogoutButton';

const TX_LABEL: Record<string, string> = {
  estandar: 'Estándar', automatico: 'Automático', ambas: 'Ambas',
};

const ESTADO_CONFIG: Record<string, { label: string; dot: string; border: string }> = {
  pendiente:      { label: 'Pendiente',       dot: 'bg-yellow-400', border: 'border-l-yellow-500' },
  confirmada:     { label: 'Confirmada',      dot: 'bg-emerald-400', border: 'border-l-emerald-500' },
  completada:     { label: 'Completada',      dot: 'bg-gray-600',   border: 'border-l-gray-600' },
  alumno_ausente: { label: 'Alumno ausente',  dot: 'bg-red-500',    border: 'border-l-red-500' },
  cancelada:      { label: 'Cancelada',       dot: 'bg-gray-700',   border: 'border-l-gray-700' },
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
    <div className={`bg-gray-900 rounded-2xl border border-gray-800 border-l-4 ${cfg.border} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-white text-base">{clase.alumnoNombre}</p>
          <p className="text-gray-400 text-sm mt-0.5">{clase.hora} · {clase.zona}</p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="text-xs text-gray-500">{cfg.label}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">
          {TX_LABEL[clase.transmision] ?? clase.transmision}
        </span>
        <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">
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
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-950 to-gray-950 px-5 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
            <span className="text-2xl font-bold text-white">{inicial}</span>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-0.5">Instructor activo</p>
            <h1 className="text-xl font-bold text-white">{nombre}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {candidato.zonas && (
            <span className="text-xs bg-white/10 text-gray-300 px-3 py-1.5 rounded-full">
              📍 {candidato.zonas}
            </span>
          )}
          {candidato.transmisiones && (
            <span className="text-xs bg-white/10 text-gray-300 px-3 py-1.5 rounded-full">
              🔧 {TX_LABEL[candidato.transmisiones] ?? candidato.transmisiones}
            </span>
          )}
          {candidato.rating && (
            <span className="text-xs bg-white/10 text-gray-300 px-3 py-1.5 rounded-full">
              ⭐ {candidato.rating}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-3xl font-bold text-white">{clasesHoy.length}</p>
            <p className="text-gray-500 text-sm mt-0.5">Clases hoy</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-3xl font-bold text-white">{proximas.length}</p>
            <p className="text-gray-500 text-sm mt-0.5">Esta semana</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-lg mx-auto">
        {/* Hoy */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Hoy</p>
          {clasesHoy.length > 0 ? (
            <div className="space-y-3">
              {clasesHoy.map(c => <ClaseCard key={c.id} clase={c} />)}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm">Sin clases asignadas hoy</p>
            </div>
          )}
        </section>

        {/* Próximas */}
        {proximas.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Próximos 7 días</p>
            <div className="space-y-4">
              {proximas.map(c => (
                <div key={c.id}>
                  <p className="text-xs text-gray-600 mb-2 ml-1 capitalize">{formatFecha(c.fecha)}</p>
                  <ClaseCard clase={c} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comandos WA */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Comandos WhatsApp</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>📅 <span className="text-gray-300 font-medium">!agenda</span> — ver clases</p>
            <p>✅ <span className="text-gray-300 font-medium">confirmada</span> — aceptar clase</p>
            <p>🏁 <span className="text-gray-300 font-medium">llegué</span> — marcar completada</p>
            <p>❌ <span className="text-gray-300 font-medium">no llegó</span> — alumno ausente</p>
          </div>
        </section>

        <LogoutButton />
      </div>
    </main>
  );
}
