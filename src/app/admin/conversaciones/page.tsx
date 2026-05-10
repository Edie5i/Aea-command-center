import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversations, type Conversation, type ChatState } from '@/lib/firestore';
import Link from 'next/link';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function displayPhone(phone: string): string {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

// ── State config ──────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<ChatState, {
  label: string;
  badge: string;
  avatar: string;
  dot: string | null;
}> = {
  tu_turno:          { label: 'Tu turno',  badge: 'bg-red-100 text-red-700 border border-red-200',       avatar: 'bg-red-100 text-red-600',     dot: 'bg-red-500' },
  atascado:          { label: 'Atascado',  badge: 'bg-amber-100 text-amber-700 border border-amber-200', avatar: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  esperando_cliente: { label: 'Esperando', badge: 'bg-blue-100 text-blue-700 border border-blue-200',    avatar: 'bg-blue-100 text-blue-600',   dot: null },
  luz_atendiendo:    { label: 'Con Luz',   badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', avatar: 'bg-emerald-100 text-emerald-600', dot: null },
  frio:              { label: 'Frío',      badge: 'bg-gray-100 text-gray-500 border border-gray-200',    avatar: 'bg-gray-100 text-gray-400',   dot: null },
  cerrado:           { label: 'Cerrado',   badge: 'bg-gray-100 text-gray-400 border border-gray-200',    avatar: 'bg-gray-100 text-gray-300',   dot: null },
};

const PRIORITY: Record<ChatState, number> = {
  tu_turno: 0, atascado: 1, esperando_cliente: 2,
  luz_atendiendo: 3, frio: 4, cerrado: 5,
};

const TABS: { state: ChatState | null; label: string }[] = [
  { state: null,               label: 'Todos' },
  { state: 'tu_turno',         label: 'Tu turno' },
  { state: 'atascado',         label: 'Atascado' },
  { state: 'esperando_cliente',label: 'Esperando' },
  { state: 'luz_atendiendo',   label: 'Con Luz' },
  { state: 'frio',             label: 'Frío' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ConversacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { state: stateFilter } = await searchParams;

  let conversaciones: Conversation[] = [];
  try {
    conversaciones = await getConversations();
  } catch (e) {
    console.error('[Admin] Firestore error:', e);
  }

  // Sort: urgentes primero, luego por actividad reciente
  const sorted = [...conversaciones].sort((a, b) => {
    const pa = PRIORITY[a.chatState ?? 'luz_atendiendo'] ?? 3;
    const pb = PRIORITY[b.chatState ?? 'luz_atendiendo'] ?? 3;
    if (pa !== pb) return pa - pb;
    return (b.lastActivity?.toMillis?.() ?? 0) - (a.lastActivity?.toMillis?.() ?? 0);
  });

  const filtered = stateFilter
    ? sorted.filter(c => (c.chatState ?? 'luz_atendiendo') === stateFilter)
    : sorted;

  // Conteos por tab
  const counts: Record<string, number> = { total: conversaciones.length };
  for (const c of conversaciones) {
    const s = c.chatState ?? 'luz_atendiendo';
    counts[s] = (counts[s] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 pt-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Conversaciones</h1>
            <p className="text-xs text-gray-400">{filtered.length} de {conversaciones.length} chats</p>
          </div>
          <Link href="/admin/metricas" className="text-xs text-blue-600 font-medium shrink-0">
            Métricas →
          </Link>
          {/* Urgentes highlight */}
          {(counts['tu_turno'] ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-700">
                {counts['tu_turno']} requieren atención
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0 -mx-1 px-1 scrollbar-hide">
          {TABS.map(tab => {
            const count = tab.state ? (counts[tab.state] ?? 0) : counts.total;
            const isActive = (stateFilter ?? null) === tab.state;
            return (
              <Link
                key={tab.state ?? 'all'}
                href={tab.state ? `/admin/conversaciones?state=${tab.state}` : '/admin/conversaciones'}
                className={`shrink-0 text-xs font-medium px-3 py-2 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* List */}
      <div className="divide-y divide-gray-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">💬</p>
            <p>No hay conversaciones en este estado.</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const ms = conv.lastActivity?.toMillis?.() ?? 0;
            const phone = displayPhone(conv.phone);
            const state = conv.chatState ?? 'luz_atendiendo';
            const cfg = STATE_CONFIG[state];
            const showReason = (state === 'tu_turno' || state === 'atascado') && conv.chatReason;

            return (
              <Link
                key={conv.phone}
                href={`/admin/conversaciones/${conv.phone}`}
                className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors relative"
              >
                {/* Urgency strip */}
                {cfg.dot && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-r" />
                )}

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${cfg.avatar}`}>
                  {conv.contactName ? conv.contactName.charAt(0).toUpperCase() : conv.phone.slice(-2)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row 1: name/phone + state badge + time */}
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {conv.contactName || phone}
                      </span>
                      {conv.contactName && (
                        <span className="text-xs text-gray-400 truncate hidden sm:block">{phone}</span>
                      )}
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">{timeAgo(ms)}</span>
                  </div>

                  {/* Row 2: last message preview */}
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {conv.lastSender === 'bot' ? '🤖 ' : '👤 '}
                    {conv.chatLastPreview || conv.lastMessage}
                  </p>

                  {/* Row 3: reason (only for tu_turno / atascado) */}
                  {showReason && (
                    <p className="text-xs mt-1 font-medium text-red-600 truncate">
                      ⚡ {conv.chatReason}
                    </p>
                  )}

                  {/* Row 4: pills */}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {conv.courseInterest && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                        {conv.courseInterest}
                      </span>
                    )}
                    {conv.coursePrice && (
                      <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-mono">
                        {conv.coursePrice}
                      </span>
                    )}
                    {conv.source && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                        📣 {conv.source}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
