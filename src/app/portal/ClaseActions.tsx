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
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          ✅ Confirmar
        </button>
        <button
          onClick={() => updateEstado('cancelada')}
          disabled={loading}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
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
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          🏁 Terminé
        </button>
        <button
          onClick={() => updateEstado('alumno_ausente')}
          disabled={loading}
          className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-40 text-amber-400 text-sm font-semibold py-2.5 rounded-xl border border-amber-600/30 transition-colors"
        >
          No llegó
        </button>
      </div>
    );
  }

  return null;
}
