import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCandidato, getClasesDeInstructor } from '@/lib/firestore';
import type { ClaseAsignada } from '@/lib/firestore';
import { ClaseActions } from './ClaseActions';
import { LogoutButton } from './LogoutButton';

const TX_LABEL: Record<string, string> = {
  estandar: 'Estándar', automatico: 'Automático', ambas: 'Ambas',
};

const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  pendiente:      { label: 'Pendiente',      dot: 'bg-amber-400' },
  confirmada:     { label: 'Confirmada',     dot: 'bg-emerald-500' },
  completada:     { label: 'Completada',     dot: 'bg-gray-300' },
  alumno_ausente: { label: 'Alumno ausente', dot: 'bg-red-400' },
  cancelada:      { label: 'Cancelada',      dot: 'bg-gray-200' },
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-base">{clase.alumnoNombre}</p>
          <p className="text-gray-500 text-sm mt-0.5">{clase.hora} · {clase.zona}</p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="text-xs text-gray-400">{cfg.label}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
          {TX_LABEL[clase.transmision] ?? clase.transmision}
        </span>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
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
    <main className="min-h-screen bg-gray-100">
      {/* Header negro */}
      <div className="bg-gray-900 px-5 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-white">{inicial}</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Instructor activo</p>
            <h1 className="text-xl font-bold text-white">{nombre}</h1>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {candidato.zonas && (
            <span className="text-xs bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-full">
              📍 {candidato.zonas}
            </span>
          )}
          {candidato.transmisiones && (
            <span className="text-xs bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-full">
              🔧 {TX_LABEL[candidato.transmisiones] ?? candidato.transmisiones}
            </span>
          )}
          {candidato.rating && (
            <span className="text-xs bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-full">
              ⭐ {candidato.rating}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-3xl font-bold text-white">{clasesHoy.length}</p>
            <p className="text-gray-500 text-sm mt-0.5">Clases hoy</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-3xl font-bold text-white">{proximas.length}</p>
            <p className="text-gray-500 text-sm mt-0.5">Esta semana</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-lg mx-auto">
        {/* Hoy */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Hoy</p>
          {clasesHoy.length > 0 ? (
            <div className="space-y-3">
              {clasesHoy.map(c => <ClaseCard key={c.id} clase={c} />)}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">Sin clases asignadas hoy</p>
            </div>
          )}
        </section>

        {/* Próximas */}
        {proximas.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Próximos 7 días</p>
            <div className="space-y-4">
              {proximas.map(c => (
                <div key={c.id}>
                  <p className="text-xs text-gray-400 mb-2 ml-1 capitalize">{formatFecha(c.fecha)}</p>
                  <ClaseCard clase={c} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comandos WA */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Comandos WhatsApp</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📅 <span className="text-gray-800 font-medium">!agenda</span> — ver clases</p>
            <p>✅ <span className="text-gray-800 font-medium">confirmada</span> — aceptar clase</p>
            <p>🏁 <span className="text-gray-800 font-medium">llegué</span> — marcar completada</p>
            <p>❌ <span className="text-gray-800 font-medium">no llegó</span> — alumno ausente</p>
          </div>
        </section>

        <LogoutButton />
      </div>
    </main>
  );
}
