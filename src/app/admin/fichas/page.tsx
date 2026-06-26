import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentInscripciones } from '@/lib/firestore';
import type { InscripcionData } from '@/lib/firestore';
import FichaButton from '@/app/admin/conversaciones/[phone]/FichaButton';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mes`;
}

const TX_COLORS: Record<string, string> = {
  'Automático': 'bg-blue-100 text-blue-700',
  'Estándar': 'bg-purple-100 text-purple-700',
  'Moto': 'bg-orange-100 text-orange-700',
  'Mixto': 'bg-teal-100 text-teal-700',
};

export default async function FichasPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const inscripciones = await getRecentInscripciones(60).catch((): (InscripcionData & { phone: string })[] => []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 font-medium text-sm">← Admin</Link>
          <h1 className="text-base font-bold text-gray-900">Fichas de Inscripción</h1>
          <span className="ml-auto text-xs text-gray-400">{inscripciones.length} registros</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {inscripciones.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">Aún no hay inscripciones registradas.</p>
            <p className="text-gray-300 text-xs mt-1">Aparecen aquí cuando Luz cierra una venta por WhatsApp.</p>
          </div>
        )}

        {inscripciones.map((ins) => {
          const displayPhone = ins.telefono.startsWith('52') && ins.telefono.length === 12
            ? ins.telefono.slice(2) : ins.telefono;
          const txColor = TX_COLORS[ins.transmision] ?? 'bg-gray-100 text-gray-600';
          const primerFecha = ins.fechas[0];
          const esPreReserva = ins.status === 'pre_reserva';

          return (
            <div key={ins.phone} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${esPreReserva ? 'border-amber-200' : 'border-gray-100'}`}>
              {esPreReserva && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-2">
                  <span className="text-amber-600 text-xs font-semibold">⏳ Pre-reserva — pendiente de pago</span>
                </div>
              )}
              {/* Header de la tarjeta */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3 border-b">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-base leading-tight">{ins.nombre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{displayPhone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${txColor}`}>
                    {ins.transmision}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(ins.fechaConfirmacion)}</span>
                </div>
              </div>

              {/* Dirección */}
              {ins.zona && (
                <div className="px-4 py-2 border-b bg-gray-50">
                  <p className="text-xs text-gray-500">📍 {ins.zona}</p>
                </div>
              )}

              {/* Fechas */}
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {ins.fechas.length} sesion{ins.fechas.length !== 1 ? 'es' : ''}
                  {primerFecha ? ` · empieza ${formatDate(primerFecha.date)} ${primerFecha.time}` : ''}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {ins.fechas.map((f, i) => (
                    <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                      <span className="font-medium text-gray-400 mr-1">{i + 1}.</span>
                      {formatDate(f.date)} · {f.time}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="px-4 pb-4 space-y-2">
                <div className="bg-gray-50 rounded-xl p-2">
                  <FichaButton data={ins} />
                </div>
                <Link
                  href={`/admin/conversaciones/${ins.phone}`}
                  className="block text-center text-xs text-blue-600 font-medium py-1 hover:underline"
                >
                  Ver conversación →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
