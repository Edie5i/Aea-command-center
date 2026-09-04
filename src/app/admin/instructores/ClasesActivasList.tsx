'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClaseAsignada } from '@/lib/firestore';

function formatFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

function ClaseRow({ clase }: { clase: ClaseAsignada }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cancelar(motivo: 'instructor' | 'alumno') {
    setLoading(true);
    try {
      await fetch('/api/admin/cancelar-clase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claseId: clase.id, motivo }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  return (
    <div className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
      style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{clase.alumnoNombre}</p>
        <p className="text-xs" style={{ color: '#64748b' }}>
          {formatFecha(clase.fecha)} · {clase.hora} · instructor {clase.instructorNombre}
        </p>
      </div>
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(o => !o)}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
          {loading ? '...' : 'Cancelar'}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 z-20 rounded-xl overflow-hidden shadow-lg" style={CARD}>
            <button
              onClick={() => cancelar('instructor')}
              className="block w-full text-left text-xs px-3 py-2 whitespace-nowrap hover:bg-white/5"
              style={{ color: '#e2e8f0' }}>
              Instructor no puede
            </button>
            <button
              onClick={() => cancelar('alumno')}
              className="block w-full text-left text-xs px-3 py-2 whitespace-nowrap hover:bg-white/5"
              style={{ color: '#e2e8f0', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              Alumno canceló
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClasesActivasList({ clases }: { clases: ClaseAsignada[] }) {
  if (clases.length === 0) return null;

  return (
    <section className="mx-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#60a5fa' }} />
        <h2 className="text-sm font-bold" style={{ color: '#94a3b8' }}>Clases activas</h2>
        <span className="text-xs" style={{ color: '#334155' }}>{clases.length}</span>
      </div>
      <div className="space-y-2">
        {clases.map(c => <ClaseRow key={c.id} clase={c} />)}
      </div>
    </section>
  );
}
