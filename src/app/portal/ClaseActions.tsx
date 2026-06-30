'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClaseAsignada, EstadoClase } from '@/lib/firestore';

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

export function ClaseActions({ clase }: { clase: ClaseAsignada }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateEstado(estado: EstadoClase) {
    setLoading(true);
    await fetch(`/api/portal/clase/${clase.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    setLoading(false);
    router.refresh();
  }

  if (clase.estado === 'pendiente') {
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => updateEstado('confirmada')}
          disabled={loading}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40 text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 2px 10px rgba(99,102,241,0.2)' }}>
          ✅ Confirmar
        </button>
        <button
          onClick={() => updateEstado('cancelada')}
          disabled={loading}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40"
          style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#475569' }}>
          No puedo
        </button>
      </div>
    );
  }

  if (clase.estado === 'confirmada' && clase.fecha === hoy()) {
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => updateEstado('completada')}
          disabled={loading}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40 text-white"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 2px 10px rgba(16,185,129,0.2)' }}>
          🏁 Terminé
        </button>
        <button
          onClick={() => updateEstado('alumno_ausente')}
          disabled={loading}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
          No llegó
        </button>
      </div>
    );
  }

  return null;
}
