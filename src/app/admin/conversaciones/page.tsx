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
      <div className="divide-y divide-gray-100 bg-white">
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

            return (
              <Link
                key={conv.phone}
                href={`/admin/conversaciones/${conv.phone}`}
                className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors relative"
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
            );
          })
        )}
      </div>
    </main>
  );
}
