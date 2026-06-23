import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCandidato, getClasesDeInstructor } from '@/lib/firestore';
import type { ClaseAsignada } from '@/lib/firestore';
import { ClaseActions } from './ClaseActions';

const TX_LABEL: Record<string, string> = {
  estandar: 'Estándar', automatico: 'Automático', ambas: 'Ambas',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada',
  alumno_ausente: 'Alumno ausente', cancelada: 'Cancelada',
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-emerald-100 text-emerald-700',
  completada: 'bg-gray-100 text-gray-500',
  alumno_ausente: 'bg-red-100 text-red-600',
  cancelada: 'bg-gray-100 text-gray-400 line-through',
};

function formatFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Mexico_City',
  });
}

function ClaseCard({ clase, isToday }: { clase: ClaseAsignada; isToday: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-2 ${isToday ? 'border-indigo-200 shadow-sm' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{clase.alumnoNombre}</p>
          <p className="text-sm text-gray-500">{clase.hora} · {clase.zona}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${ESTADO_COLOR[clase.estado]}`}>
          {ESTADO_LABEL[clase.estado]}
        </span>
      </div>
      <p className="text-xs text-gray-400">{TX_LABEL[clase.transmision] ?? clase.transmision} · {clase.curso}</p>
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
  const clases7dias = new Date();
  clases7dias.setDate(clases7dias.getDate() + 7);
  const limite = clases7dias.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const clasesHoy = todasLasClases.filter(c => c.fecha === hoy && c.estado !== 'cancelada');
  const proximas = todasLasClases.filter(
    (c): c is ClaseAsignada =>
      c.fecha > hoy &&
      c.fecha <= limite &&
      ['pendiente', 'confirmada'].includes(c.estado)
  );

  const nombre = candidato.nombre ?? `+${phone.slice(2)}`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 pt-10 pb-6">
        <p className="text-indigo-200 text-sm">Bienvenido,</p>
        <h1 className="text-2xl font-bold">{nombre}</h1>
        <div className="flex gap-3 mt-3 text-sm text-indigo-100">
          {candidato.zonas && <span>📍 {candidato.zonas}</span>}
          {candidato.transmisiones && <span>🔧 {TX_LABEL[candidato.transmisiones] ?? candidato.transmisiones}</span>}
          {candidato.rating && <span>⭐ {candidato.rating}</span>}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Clases de hoy */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Hoy</h2>
          {clasesHoy.length > 0 ? (
            <div className="space-y-3">
              {clasesHoy.map(c => <ClaseCard key={c.id} clase={c} isToday />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-gray-400 text-sm">
              Sin clases asignadas para hoy
            </div>
          )}
        </section>

        {/* Próximas */}
        {proximas.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos 7 días</h2>
            <div className="space-y-3">
              {proximas.map(c => (
                <div key={c.id}>
                  <p className="text-xs text-gray-400 mb-1 ml-1">{formatFecha(c.fecha)}</p>
                  <ClaseCard clase={c} isToday={false} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ayuda */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500 space-y-1">
          <p className="font-medium text-gray-700 mb-2">Comandos por WhatsApp</p>
          <p>📅 <strong>!agenda</strong> — ver clases</p>
          <p>✅ <strong>confirmada</strong> — aceptar clase</p>
          <p>🏁 <strong>llegué</strong> — marcar completada</p>
          <p>❌ <strong>no llegó</strong> — alumno ausente</p>
        </section>

        <form action="/api/portal/logout" method="POST">
          <button
            type="submit"
            className="w-full text-sm text-gray-400 py-2 hover:text-gray-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
