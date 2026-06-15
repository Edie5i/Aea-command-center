import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversationMessages, getInscripcionData, getConversation } from '@/lib/firestore';
import Link from 'next/link';
import FichaButton from './FichaButton';
import ReplyBox from './ReplyBox';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function displayPhone(phone: string): string {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { phone } = await params;
  const [messages, inscripcion, conv] = await Promise.all([
    getConversationMessages(phone),
    getInscripcionData(phone),
    getConversation(phone),
  ]);

  const dp = displayPhone(phone);
  const name = conv?.contactName || dp;
  const state = conv?.chatState ?? 'luz_atendiendo';
  const needsAttention = state === 'tu_turno' || state === 'atascado';

  return (
    <main className="min-h-screen bg-[#e5ddd5] flex flex-col">
      {/* Header */}
      <header className="bg-[#075e54] text-white px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/conversaciones"
            className="text-white/80 hover:text-white transition-colors text-2xl leading-none shrink-0"
            aria-label="Volver"
          >
            ←
          </Link>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate">{name}</p>
            <p className="text-white/60 text-sm leading-none mt-0.5">{dp}</p>
          </div>

          {/* Ficha button in header */}
          {inscripcion && (
            <div className="shrink-0">
              <FichaButton data={inscripcion} />
            </div>
          )}
        </div>

        {/* Attention banner */}
        {needsAttention && (
          <div className="mt-2 bg-red-500/90 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <p className="text-sm font-semibold text-white">{conv?.chatReason ?? 'Requiere tu atención'}</p>
          </div>
        )}

        {/* Inscrito banner */}
        {inscripcion && (
          <div className="mt-2 bg-green-600/80 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div>
              <p className="text-sm font-bold text-white">Alumno inscrito</p>
              <p className="text-xs text-white/80">
                {inscripcion.nombre} · {inscripcion.transmision} · {inscripcion.zona}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto pb-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 pt-20">
            <p className="text-5xl mb-3">💬</p>
            <p>No hay mensajes aún.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLead = msg.role === 'user';
          return (
            <div key={i} className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[82%] rounded-2xl shadow-sm overflow-hidden ${
                  isLead
                    ? 'bg-white text-gray-900 rounded-tl-sm'
                    : 'bg-[#d9fdd3] text-gray-900 rounded-tr-sm'
                }`}
              >
                {msg.mediaType === 'image' && msg.mediaId && msg.mediaId !== 'unknown' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${msg.mediaId}`}
                    alt="Comprobante de pago"
                    className="max-w-full max-h-72 object-contain bg-gray-100"
                  />
                ) : (
                  <div className="px-4 py-3 text-xl leading-relaxed whitespace-pre-wrap">
                    {!isLead && (
                      <p className="text-xs text-[#128c7e] font-bold mb-1">Luz</p>
                    )}
                    {msg.text}
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
