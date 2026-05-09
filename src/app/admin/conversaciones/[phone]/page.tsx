import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversationMessages, getInscripcionData, getConversation, type ChatState } from '@/lib/firestore';
import Link from 'next/link';
import FichaButton from './FichaButton';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

const STATE_CONFIG: Record<ChatState, { label: string; badge: string }> = {
  tu_turno:          { label: 'Tu turno',  badge: 'bg-red-100 text-red-700 border border-red-200' },
  atascado:          { label: 'Atascado',  badge: 'bg-amber-100 text-amber-700 border border-amber-200' },
  esperando_cliente: { label: 'Esperando', badge: 'bg-blue-100 text-blue-700 border border-blue-200' },
  luz_atendiendo:    { label: 'Con Luz',   badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  frio:              { label: 'Frío',      badge: 'bg-gray-100 text-gray-500 border border-gray-200' },
  cerrado:           { label: 'Cerrado',   badge: 'bg-gray-100 text-gray-400 border border-gray-200' },
};

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
  const state = conv?.chatState ?? 'luz_atendiendo';
  const cfg = STATE_CONFIG[state];

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/conversaciones" className="text-blue-600 font-medium text-sm shrink-0">
            ← Volver
          </Link>

          <div className="flex-1 min-w-0">
            {/* Row 1: phone + state badge */}
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{dp}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
              {(conv?.chatUrgency === 'alta') && (
                <span className="text-[10px] font-bold text-red-600">⚡ urgente</span>
              )}
            </div>

            {/* Row 2: reason / course */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {conv?.chatReason && (
                <p className="text-xs text-gray-500 truncate">{conv.chatReason}</p>
              )}
              {conv?.courseInterest && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                  {conv.courseInterest}{conv.coursePrice ? ` · ${conv.coursePrice}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-xs text-gray-400">{messages.length} msgs</p>
            {inscripcion && <FichaButton data={inscripcion} />}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-2 pb-8">
        {messages.map((msg, i) => {
          const isLead = msg.role === 'user';
          return (
            <div key={i} className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  isLead
                    ? 'bg-white text-gray-900 rounded-tl-sm shadow-sm'
                    : 'bg-[#DCF8C6] text-gray-900 rounded-tr-sm shadow-sm'
                }`}
              >
                {!isLead && (
                  <p className="text-xs text-green-700 font-semibold mb-1">Luz</p>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center text-gray-400 pt-20">
            <p>No hay mensajes aún.</p>
          </div>
        )}
      </div>
    </main>
  );
}
