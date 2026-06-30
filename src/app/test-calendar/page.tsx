
'use client';

import { useState } from 'react';
import { createTestEventAction } from './actions';
import { Loader2, CalendarPlus, AlertCircle, CheckCircle, ArrowLeft, CalendarSearch, Globe } from 'lucide-react';
import Link from 'next/link';

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

export default function TestCalendarPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateTestEvent = async () => {
    setIsLoading(true);
    setResult(null);
    const response = await createTestEventAction();
    setResult(response);
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      <div className="w-full max-w-md mt-8 space-y-4">

        <div className="flex justify-center">
          <a href="https://app.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#64748b' }}>
            <Globe className="w-3.5 h-3.5" />
            app.autoescuelaamericana.com
          </a>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={CARD}>
          <div>
            <h1 className="text-base font-bold text-white">Prueba de Google Calendar</h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              Haz clic en el botón para crear un evento de prueba en tu calendario. El evento se creará para mañana a las 3:00 PM.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreateTestEvent}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
              {isLoading ? 'Creando evento…' : 'Crear Evento de Prueba'}
            </button>

            {result && (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={result.success
                  ? { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }
                  : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {result.success
                  ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                  : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: result.success ? '#34d399' : '#f87171' }}>
                    {result.success ? 'Éxito' : 'Error'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{result.message}</p>
                </div>
              </div>
            )}

            {result?.success && (
              <a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#94a3b8' }}>
                <CalendarSearch className="w-4 h-4" />
                Abrir Google Calendar para verificar
              </a>
            )}
          </div>

          <Link href="/" className="inline-flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: '#334155' }}>
            <ArrowLeft className="w-3 h-3" /> Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  );
}
