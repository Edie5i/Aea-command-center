'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeLead, setLeadTuTurno } from './actions';
import type { ChatState } from '@/lib/firestore';

export default function StateActions({ phone, state }: { phone: string; state: ChatState }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function run(action: () => Promise<void>) {
    setLoading(true);
    try {
      await action();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (state === 'cerrado') return null;

  return (
    <div className="flex items-center gap-2">
      {(state === 'tu_turno' || state === 'atascado') && (
        <>
          <button
            disabled={loading}
            onClick={() => run(() => closeLead(phone, 'ganado'))}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-40 transition-colors"
          >
            ✓ Ganado
          </button>
          <button
            disabled={loading}
            onClick={() => run(() => closeLead(phone, 'perdido'))}
            className="text-xs bg-gray-400 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-500 active:bg-gray-600 disabled:opacity-40 transition-colors"
          >
            ✗ Perdido
          </button>
        </>
      )}
      {state === 'frio' && (
        <button
          disabled={loading}
          onClick={() => run(() => setLeadTuTurno(phone))}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 transition-colors"
        >
          ↑ Reactivar
        </button>
      )}
    </div>
  );
}
