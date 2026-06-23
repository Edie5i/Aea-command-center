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
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => updateEstado('confirmada')}
          disabled={loading}
          className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-40 active:bg-emerald-700 transition-colors"
        >
          ✅ Confirmar
        </button>
        <button
          onClick={() => updateEstado('cancelada')}
          disabled={loading}
          className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2 rounded-lg disabled:opacity-40 active:bg-gray-200 transition-colors"
        >
          No puedo
        </button>
      </div>
    );
  }

  if (clase.estado === 'confirmada' && clase.fecha === hoy()) {
    return (
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => updateEstado('completada')}
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-40 active:bg-indigo-700 transition-colors"
        >
          🏁 Llegué / Terminé
        </button>
        <button
          onClick={() => updateEstado('alumno_ausente')}
          disabled={loading}
          className="flex-1 bg-amber-100 text-amber-800 text-sm font-semibold py-2 rounded-lg disabled:opacity-40 transition-colors"
        >
          ❌ No llegó
        </button>
      </div>
    );
  }

  return null;
}
