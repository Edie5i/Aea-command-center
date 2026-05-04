import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConversationMessages } from '@/lib/firestore';
import Link from 'next/link';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const cookieStore = await cookies();
  const pin = cookieStore.get('admin_pin')?.value;

  if (pin !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const { phone } = await params;
  const messages = await getConversationMessages(phone);
  const displayPhone = phone.replace('52', '+52 ');

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin/conversaciones" className="text-blue-600 font-medium text-sm">
          ← Volver
        </Link>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{displayPhone}</p>
          <p className="text-xs text-gray-400">{messages.length} mensajes</p>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-2 pb-8">
        {messages.map((msg, i) => {
          const isLead = msg.role === 'user';
          return (
            <div
              key={i}
              className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  isLead
                    ? 'bg-white text-gray-900 rounded-tl-sm shadow-sm'
                    : 'bg-[#DCF8C6] text-gray-900 rounded-tr-sm shadow-sm'
                }`}
              >
                {!isLead && (
                  <p className="text-xs text-green-700 font-semibold mb-1">Ale</p>
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
