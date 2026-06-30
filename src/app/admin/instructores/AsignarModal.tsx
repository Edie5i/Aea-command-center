'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CandidatoInstructor, InscripcionData } from '@/lib/firestore';

type InscripcionConPhone = InscripcionData & { phone: string };

interface Props {
  instructor: CandidatoInstructor;
  inscripciones: InscripcionConPhone[];
  clasesActivas: number;
}

function formatFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export default function AsignarModal({ instructor, inscripciones, clasesActivas }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InscripcionConPhone | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'ok' | 'error' | null>(null);

  const displayPhone = instructor.phone.startsWith('52') && instructor.phone.length === 12
    ? instructor.phone.slice(2) : instructor.phone;

  function close() { setOpen(false); setSelected(null); setResult(null); }

  async function handleAsignar() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/asignar-clase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorPhone: instructor.phone,
          alumnoPhone: selected.phone,
        }),
      });
      if (!res.ok) throw new Error('Error en servidor');
      setResult('ok');
      setTimeout(() => { close(); router.refresh(); }, 1500);
    } catch {
      setResult('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-2 text-xs font-semibold rounded-xl py-2 px-3 transition-all flex items-center justify-between"
        style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <span>Asignar clase</span>
        {clasesActivas > 0 && (
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: '#4f46e5' }}>
            {clasesActivas} activa{clasesActivas !== 1 ? 's' : ''}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col"
            style={{
              background: 'linear-gradient(145deg, #0f172a, #1e293b)',
              border: '1px solid rgba(148,163,184,0.12)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            }}>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base text-white">Asignar clase</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    Instructor: {instructor.nombre ?? `+${displayPhone}`} · {instructor.transmisiones ?? '—'}
                  </p>
                </div>
                <button onClick={close}
                  className="text-xl leading-none transition-colors"
                  style={{ color: '#334155' }}>✕</button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {inscripciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm" style={{ color: '#475569' }}>Todos los alumnos ya tienen instructor asignado.</p>
                </div>
              ) : (
                inscripciones.map(ins => {
                  const isSelected = selected?.phone === ins.phone;
                  const primeraFecha = ins.fechas?.[0];
                  return (
                    <button
                      key={ins.phone}
                      onClick={() => setSelected(isSelected ? null : ins)}
                      className="w-full text-left rounded-2xl p-3 transition-all"
                      style={isSelected
                        ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 0 1px rgba(99,102,241,0.2)' }
                        : { background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-white">{ins.nombre}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                            {ins.curso} · 📍 {ins.zona || 'CDMX'}
                          </p>
                          {primeraFecha && (
                            <p className="text-xs mt-0.5" style={{ color: '#334155' }}>
                              📅 {formatFecha(primeraFecha.date)} · {primeraFecha.time}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
                          style={isSelected
                            ? { borderColor: '#6366f1', background: '#6366f1' }
                            : { borderColor: '#334155', background: 'transparent' }}>
                          {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-5 pt-3 shrink-0"
              style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              {result === 'ok' && (
                <div className="mb-3 text-sm font-semibold rounded-xl px-4 py-2.5 text-center"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                  ✅ Clase asignada — Marco notificó al instructor por WhatsApp
                </div>
              )}
              {result === 'error' && (
                <div className="mb-3 text-sm rounded-xl px-4 py-2.5 text-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Error al asignar. Intenta de nuevo.
                </div>
              )}
              <button
                onClick={handleAsignar}
                disabled={!selected || loading || result === 'ok'}
                className="w-full font-bold rounded-2xl py-3 text-sm text-white disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: selected ? '0 2px 12px rgba(99,102,241,0.3)' : 'none' }}
              >
                {loading ? 'Asignando…' : selected ? `Asignar a ${selected.nombre.split(' ')[0]}` : 'Selecciona un alumno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
