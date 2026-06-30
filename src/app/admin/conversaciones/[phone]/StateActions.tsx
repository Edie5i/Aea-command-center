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

  const btnBase = "text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40";

  return (
    <div className="flex items-center gap-2">
      {(state === 'tu_turno' || state === 'atascado') && (
        <>
          <button
            disabled={loading}
            onClick={() => run(() => closeLead(phone, 'ganado'))}
            className={btnBase}
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }}
          >
            ✓ Ganado
          </button>
          <button
            disabled={loading}
            onClick={() => run(() => closeLead(phone, 'perdido'))}
            className={btnBase}
            style={{ background: 'rgba(148,163,184,0.12)', color: '#64748b', border: '1px solid rgba(148,163,184,0.2)' }}
          >
            ✗ Perdido
          </button>
        </>
      )}
      {(state === 'luz_atendiendo' || state === 'esperando_cliente') && (
        <button
          disabled={loading}
          onClick={() => run(() => setLeadTuTurno(phone))}
          className={btnBase}
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          → Tu turno
        </button>
      )}
      {state === 'frio' && (
        <button
          disabled={loading}
          onClick={() => run(() => setLeadTuTurno(phone))}
          className={btnBase}
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white' }}
        >
          ↑ Reactivar
        </button>
      )}
    </div>
  );
}
