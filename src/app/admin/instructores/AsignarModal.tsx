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
      setTimeout(() => {
        setOpen(false);
        setSelected(null);
        setResult(null);
        router.refresh();
      }, 1500);
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
        className="w-full mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl py-2 px-3 transition-colors text-left flex items-center justify-between"
      >
        <span>Asignar clase</span>
        {clasesActivas > 0 && (
          <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
            {clasesActivas} activa{clasesActivas !== 1 ? 's' : ''}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setSelected(null); setResult(null); } }}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Asignar clase</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Instructor: {instructor.nombre ?? `+${displayPhone}`} · {instructor.transmisiones ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => { setOpen(false); setSelected(null); setResult(null); }}
                  className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5"
                >✕</button>
              </div>
            </div>

            {/* Inscripciones list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {inscripciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-gray-400 text-sm">Todos los alumnos ya tienen instructor asignado.</p>
                </div>
              ) : (
                inscripciones.map(ins => {
                  const isSelected = selected?.phone === ins.phone;
                  const primeraFecha = ins.fechas?.[0];
                  return (
                    <button
                      key={ins.phone}
                      onClick={() => setSelected(isSelected ? null : ins)}
                      className={`w-full text-left rounded-2xl border p-3 transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{ins.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ins.curso} · 📍 {ins.zona || 'CDMX'}
                          </p>
                          {primeraFecha && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              📅 {formatFecha(primeraFecha.date)} · {primeraFecha.time}
                            </p>
                          )}
                        </div>
                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-5 pt-3 border-t border-gray-100 shrink-0">
              {result === 'ok' && (
                <div className="mb-3 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl px-4 py-2.5 text-center">
                  ✅ Clase asignada — Marco notificó al instructor por WhatsApp
                </div>
              )}
              {result === 'error' && (
                <div className="mb-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 text-center">
                  Error al asignar. Intenta de nuevo.
                </div>
              )}
              <button
                onClick={handleAsignar}
                disabled={!selected || loading || result === 'ok'}
                className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
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
