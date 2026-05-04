import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversations } from '@/lib/firestore';
import Link from 'next/link';

const ADMIN_PIN = process.env.ADMIN_PIN ?? '1234';

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default async function ConversacionesPage() {
  const cookieStore = await cookies();
  const pin = cookieStore.get('admin_pin')?.value;

  if (pin !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const conversaciones = await getConversations();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Conversaciones con Ale</h1>
        <p className="text-sm text-gray-500">{conversaciones.length} chats activos</p>
      </header>

      <div className="divide-y divide-gray-200 bg-white">
        {conversaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">💬</p>
            <p>Aún no hay conversaciones guardadas.</p>
            <p className="text-sm mt-1">Aparecerán aquí cuando llegue el primer mensaje.</p>
          </div>
        ) : (
          conversaciones.map((conv) => {
            const ms = conv.lastActivity?.toMillis?.() ?? 0;
            const phone = conv.phone.replace('52', '+52 ');
            return (
              <Link
                key={conv.phone}
                href={`/admin/conversaciones/${conv.phone}`}
                className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 mt-0.5">
                  {conv.phone.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 text-sm">{phone}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(ms)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {conv.lastSender === 'ale' ? '🤖 ' : '👤 '}
                    {conv.lastMessage}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
