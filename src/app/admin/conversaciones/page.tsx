import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversations, type Conversation, type ChatState } from '@/lib/firestore';
import Link from 'next/link';
import AutoRefresh from './AutoRefresh';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function displayPhone(phone: string): string {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

type Tab = 'atencion' | 'activas' | 'inscritos';

function getTab(state: ChatState, closedOutcome?: string | null): Tab {
  if (state === 'tu_turno' || state === 'atascado') return 'atencion';
  if (state === 'cerrado' && closedOutcome === 'ganado') return 'inscritos';
  if (state === 'cerrado') return 'inscritos';
  return 'activas';
}

const PRIORITY: Record<ChatState, number> = {
  tu_turno: 0, atascado: 1, esperando_cliente: 2,
  luz_atendiendo: 3, frio: 4, cerrado: 5,
};

export default async function ConversacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { tab: tabParam } = await searchParams;
  const activeTab: Tab = (tabParam as Tab) ?? 'atencion';

  let conversaciones: Conversation[] = [];
  try {
    conversaciones = await getConversations();
  } catch (e) {
    console.error('[Admin] Firestore error:', e);
  }

  const sorted = [...conversaciones].sort((a, b) => {
    const pa = PRIORITY[a.chatState ?? 'luz_atendiendo'] ?? 3;
    const pb = PRIORITY[b.chatState ?? 'luz_atendiendo'] ?? 3;
    if (pa !== pb) return pa - pb;
    return (b.lastActivity?.toMillis?.() ?? 0) - (a.lastActivity?.toMillis?.() ?? 0);
  });

  const counts = { atencion: 0, activas: 0, inscritos: 0 };
  for (const c of conversaciones) {
    const t = getTab(c.chatState ?? 'luz_atendiendo', c.closedOutcome);
    counts[t]++;
  }

  const filtered = sorted.filter(c =>
    getTab(c.chatState ?? 'luz_atendiendo', c.closedOutcome) === activeTab
  );

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'atencion',  emoji: '🔴', label: 'Atención' },
    { id: 'activas',   emoji: '💬', label: 'Con Luz' },
    { id: 'inscritos', emoji: '✅', label: 'Inscritos' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <AutoRefresh intervalMs={30_000} />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
            {counts.atencion > 0 && (
              <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-700">{counts.atencion} pendientes</span>
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/admin/conversaciones?tab=${tab.id}`}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  {counts[tab.id] > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {counts[tab.id]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* List */}
      <div className="bg-white">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-5xl mb-4">
              {activeTab === 'atencion' ? '✅' : activeTab === 'inscritos' ? '🎉' : '💬'}
            </p>
            <p className="text-lg">
              {activeTab === 'atencion'
                ? 'Sin pendientes — Luz lo tiene cubierto'
                : activeTab === 'inscritos'
                ? 'Aún no hay inscritos'
                : 'Nada activo en este momento'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const ms = conv.lastActivity?.toMillis?.() ?? 0;
            const phone = displayPhone(conv.phone);
            const state = conv.chatState ?? 'luz_atendiendo';
            const needsAttention = state === 'tu_turno' || state === 'atascado';
            const name = conv.contactName || phone;
            const isRegistroLead = conv.source === 'registro_landing';
            const waMsg = encodeURIComponent(`¡Hola ${conv.contactName ?? ''}! 👋 Te escribo de Auto Escuela Americana. Vi que te registraste en nuestra página — ¿en qué te puedo ayudar?`);
            const waUrl = `https://wa.me/${conv.phone}?text=${waMsg}`;

            return (
              <div key={conv.phone} className="relative flex items-stretch border-b border-gray-100 last:border-0">
              <Link
                href={`/admin/conversaciones/${conv.phone}`}
                className={`flex items-start gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors flex-1 min-w-0 ${isRegistroLead ? 'pr-16' : ''}`}
              >
                {/* Urgency strip */}
                {needsAttention && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r" />
                )}

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  needsAttention ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row 1: name + time */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-gray-900 text-base truncate">{name}</span>
                    <span className={`text-sm shrink-0 font-medium ${needsAttention ? 'text-red-600' : 'text-gray-400'}`}>
                      {timeAgo(ms)}
                    </span>
                  </div>

                  {/* Row 2: phone if we have name */}
                  {conv.contactName && (
                    <p className="text-sm text-gray-400 mt-0.5">{phone}</p>
                  )}

                  {/* Row 3: last message */}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-snug">
                    {conv.lastSender === 'bot' ? '🤖 ' : '👤 '}
                    {conv.chatLastPreview || conv.lastMessage}
                  </p>

                  {/* Row 4: reason only when needs attention */}
                  {needsAttention && conv.chatReason && (
                    <p className="text-xs mt-1.5 font-semibold text-red-600">
                      ⚡ {conv.chatReason}
                    </p>
                  )}

                  {/* Row 5: course tag */}
                  {conv.courseInterest && (
                    <span className="inline-block mt-1.5 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                      {conv.courseInterest}{conv.coursePrice ? ` · ${conv.coursePrice}` : ''}
                    </span>
                  )}
                </div>
              </Link>
              {isRegistroLead && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 transition-colors shadow-sm"
                  title="Escribir por WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L.057 23.617a.75.75 0 0 0 .921.921l5.773-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.674-.52-5.194-1.427l-.372-.22-3.862.985.999-3.754-.242-.386A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </a>
              )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
