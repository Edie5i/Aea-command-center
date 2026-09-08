import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversations, type Conversation, type ChatState } from '@/lib/firestore';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
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

const TABS_VALIDOS = ['atencion', 'activas', 'inscritos'] as const;
type Tab = typeof TABS_VALIDOS[number];

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
  // Un ?tab= inválido (typo, manipulado) cae al default en vez de dejar la
  // lista filtrada vacía en silencio.
  const activeTab: Tab = TABS_VALIDOS.includes(tabParam as Tab) ? (tabParam as Tab) : 'atencion';

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
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>
      {/* 2 min y no 30 s: desde que getConversations trae la colección completa,
          cada refresco cuesta ~186 lecturas. A 30 s con el panel abierto todo el
          día son ~180k/día, muy por encima de las 50k de la capa gratis. */}
      <AutoRefresh intervalMs={120_000} />

      {/* Header sticky metálico */}
      <header className="sticky top-0 z-10"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(148,163,184,0.25)' }}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
              <h1 className="text-lg font-bold text-slate-800">Conversaciones</h1>
            </div>
            {counts.atencion > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold" style={{ color: '#dc2626' }}>{counts.atencion}</span>
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
                        background: isActive ? '#2563eb' : 'rgba(148,163,184,0.28)',
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
            const saludo = `¡Hola ${tieneNombre ? name : ''}! 👋 Te escribo de Auto Escuela Americana.`;
            const waMsg = encodeURIComponent(isRegistroLead
              ? `${saludo} Vi que te registraste en nuestra página — ¿en qué te puedo ayudar?`
              : `${saludo} ¿En qué te puedo ayudar?`);
            const waUrl = `https://wa.me/${conv.phone}?text=${waMsg}`;

            return (
              <div key={conv.phone} className="relative flex items-stretch"
                style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                <Link
                  href={`/admin/conversaciones/${conv.phone}?tab=${activeTab}`}
                  className="flex items-start gap-4 px-4 py-4 flex-1 min-w-0 pr-16 transition-colors"
                  style={{ background: needsAttention ? 'rgba(239,68,68,0.04)' : 'transparent' }}
                >
                  {/* Urgency strip */}
                  {needsAttention && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: '#ef4444' }} />
                  )}

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                    style={needsAttention
                      ? { background: 'rgba(239,68,68,0.15)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }
                      : { background: 'rgba(148,163,184,0.25)', color: '#64748b', border: '1px solid rgba(148,163,184,0.28)' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        {conv.postCierreAlerta && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#f59e0b' }} title="Escribió después de inscrito" />
                        )}
                        <span className="font-bold text-base truncate" style={{ color: '#1e293b' }}>{name}</span>
                      </span>
                      <span className="text-sm shrink-0 font-medium" style={{ color: needsAttention ? '#f87171' : '#475569' }}>
                        {timeAgo(ms)}
                      </span>
                    </div>

                    {conv.postCierreAlerta && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#f59e0b' }}>
                        💡 Escribió tras inscripción: {conv.postCierreAlerta.texto}
                      </p>
                    )}

                    <p className="font-mono text-sm font-semibold tracking-wider mt-0.5 text-slate-700">{phone}</p>

                    <p className="text-sm mt-1 line-clamp-2 leading-snug" style={{ color: '#64748b' }}>
                      {conv.lastSender === 'bot' ? '🤖 ' : '👤 '}
                      {conv.chatLastPreview || conv.lastMessage}
                    </p>

                    {needsAttention && conv.chatReason && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#dc2626' }}>
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

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-colors shadow"
                  style={{ background: 'rgba(22,163,74,0.85)' }}
                  title="Escribir por WhatsApp"
                >
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
