import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversations, type Conversation, type ChatState } from '@/lib/firestore';
import { nombreLead } from '@/lib/nombre-lead';
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
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      {/* 2 min y no 30 s: desde que getConversations trae la colección completa,
          cada refresco cuesta ~186 lecturas. A 30 s con el panel abierto todo el
          día son ~180k/día, muy por encima de las 50k de la capa gratis. */}
      <AutoRefresh intervalMs={120_000} />

      {/* Header sticky metálico */}
      <header className="sticky top-0 z-10"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
              <h1 className="text-lg font-bold text-white">Conversaciones</h1>
            </div>
            {counts.atencion > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold" style={{ color: '#f87171' }}>{counts.atencion}</span>
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
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap"
                  style={{
                    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                    color: isActive ? '#60a5fa' : '#475569',
                    background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                  }}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  {counts[tab.id] > 0 && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-bold"
                      style={{
                        background: isActive ? '#2563eb' : 'rgba(148,163,184,0.12)',
                        color: isActive ? 'white' : '#64748b',
                      }}>
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
      <div>
        {filtered.length === 0 ? (
          <div className="p-16 text-center" style={{ color: '#475569' }}>
            <p className="text-5xl mb-4">
              {activeTab === 'atencion' ? '✅' : activeTab === 'inscritos' ? '🎉' : '💬'}
            </p>
            <p className="text-base">
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
            // Sin esto, un alumno con nombre sólo en la inscripción salía como número anónimo.
            const { nombre: name, tieneNombre } = nombreLead(conv, conv.phone);
            const isRegistroLead = conv.source === 'registro_landing';
            const waMsg = encodeURIComponent(`¡Hola ${tieneNombre ? name : ''}! 👋 Te escribo de Auto Escuela Americana. Vi que te registraste en nuestra página — ¿en qué te puedo ayudar?`);
            const waUrl = `https://wa.me/${conv.phone}?text=${waMsg}`;

            return (
              <div key={conv.phone} className="relative flex items-stretch"
                style={{ borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
                <Link
                  href={`/admin/conversaciones/${conv.phone}?tab=${activeTab}`}
                  className={`flex items-start gap-4 px-4 py-4 flex-1 min-w-0 transition-colors ${isRegistroLead ? 'pr-16' : ''}`}
                  style={{ background: needsAttention ? 'rgba(239,68,68,0.04)' : 'transparent' }}
                >
                  {/* Urgency strip */}
                  {needsAttention && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: '#ef4444' }} />
                  )}

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                    style={needsAttention
                      ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                      : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.12)' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-base truncate" style={{ color: '#e2e8f0' }}>{name}</span>
                      <span className="text-sm shrink-0 font-medium" style={{ color: needsAttention ? '#f87171' : '#475569' }}>
                        {timeAgo(ms)}
                      </span>
                    </div>

                    {tieneNombre && (
                      <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{phone}</p>
                    )}

                    <p className="text-sm mt-1 line-clamp-2 leading-snug" style={{ color: '#64748b' }}>
                      {conv.lastSender === 'bot' ? '🤖 ' : '👤 '}
                      {conv.chatLastPreview || conv.lastMessage}
                    </p>

                    {needsAttention && conv.chatReason && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#f87171' }}>
                        ⚡ {conv.chatReason}
                      </p>
                    )}

                    {conv.courseInterest && (
                      <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-colors shadow"
                    style={{ background: 'rgba(22,163,74,0.85)' }}
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
