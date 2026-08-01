import { nombreLead } from '@/lib/nombre-lead';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversationMessages, getInscripcionData, getConversation } from '@/lib/firestore';
import Link from 'next/link';
import FichaButton from './FichaButton';
import ReplyBox from './ReplyBox';
import StateActions from './StateActions';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function displayPhone(phone: string): string {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

const TABS_VALIDOS = ['atencion', 'activas', 'inscritos'] as const;

export default async function ConversacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { phone } = await params;
  const { tab } = await searchParams;
  // La lista nos pasa de qué pestaña venimos para poder devolver ahí al volver.
  // Se valida contra la lista blanca: sin esto, un ?tab= manipulado se colaría
  // tal cual en el href de regreso.
  const volverA = TABS_VALIDOS.includes(tab as typeof TABS_VALIDOS[number])
    ? `/admin/conversaciones?tab=${tab}`
    : '/admin/conversaciones';
  const [messages, inscripcion, conv] = await Promise.all([
    getConversationMessages(phone),
    getInscripcionData(phone),
    getConversation(phone),
  ]);

  const dp = displayPhone(phone);
  const name = nombreLead(conv ?? {}, phone).nombre;
  const state = conv?.chatState ?? 'luz_atendiendo';
  const needsAttention = state === 'tu_turno' || state === 'atascado';

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="flex items-center gap-3">
          <Link
            href={volverA}
            className="text-xl leading-none shrink-0 transition-colors"
            style={{ color: '#475569' }}
            aria-label="Volver"
          >
            ←
          </Link>

          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0"
            style={needsAttention
              ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
              : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.12)' }}>
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate text-white">{name}</p>
            <p className="text-sm leading-none mt-0.5" style={{ color: '#475569' }}>{dp}</p>
          </div>

          {inscripcion && (
            <div className="shrink-0">
              <FichaButton data={inscripcion} />
            </div>
          )}
        </div>

        {needsAttention && (
          <div className="mt-2 rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-base">⚡</span>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>{conv?.chatReason ?? 'Requiere tu atención'}</p>
          </div>
        )}

        <div className="mt-2">
          <StateActions phone={phone} state={state} />
        </div>

        {inscripcion && (
          <div className="mt-2 rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="text-base">🎉</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#34d399' }}>Alumno inscrito</p>
              <p className="text-xs" style={{ color: '#64748b' }}>
                {inscripcion.nombre} · {inscripcion.transmision} · {inscripcion.zona}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto pb-6">
        {messages.length === 0 && (
          <div className="text-center pt-20" style={{ color: '#475569' }}>
            <p className="text-5xl mb-3">💬</p>
            <p>No hay mensajes aún.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLead = msg.role === 'user';
          return (
            <div key={i} className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[82%] rounded-2xl overflow-hidden shadow-sm"
                style={isLead
                  ? { background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderTopLeftRadius: 4 }
                  : { background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.2)', borderTopRightRadius: 4 }}>
                {msg.mediaType === 'image' && msg.mediaId && msg.mediaId !== 'unknown' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${msg.mediaId}`}
                    alt="Comprobante de pago"
                    className="max-w-full max-h-72 object-contain"
                    style={{ background: 'rgba(15,23,42,0.6)' }}
                  />
                ) : (
                  <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {!isLead && (
                      <p className="text-xs font-bold mb-1" style={{ color: '#60a5fa' }}>Luz</p>
                    )}
                    <span style={{ color: isLead ? '#cbd5e1' : '#e2e8f0' }}>{msg.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ReplyBox phone={phone} botPaused={conv?.botPaused ?? false} />
    </main>
  );
}
