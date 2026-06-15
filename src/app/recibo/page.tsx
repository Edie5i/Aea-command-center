'use client';

import { useState, useEffect, useRef } from 'react';

export default function ReciboPage() {
  const folioRef = useRef('');
  const fechaRef = useRef('');
  const [mounted, setMounted] = useState(false);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  useEffect(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    folioRef.current = `REC-${new Date().getFullYear()}-${rand}`;
    fechaRef.current = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        .print-value { display: none; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-input { display: none !important; }
          .print-value { display: block !important; font-weight: 500; color: #111; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#1B4FD8] px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-[#1B4FD8] font-black text-xl leading-none">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Auto Escuela Americana</h1>
              <p className="text-blue-200 text-sm">Recibo de Pago</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">

            {/* Folio + Fecha */}
            <div className="flex justify-between text-sm mb-8 pb-4 border-b border-gray-200">
              <div>
                <span className="text-gray-500">Folio:</span>{' '}
                <span className="font-semibold text-gray-800">{mounted ? folioRef.current : ''}</span>
              </div>
              <div>
                <span className="text-gray-500">Fecha:</span>{' '}
                <span className="font-semibold text-gray-800">{mounted ? fechaRef.current : ''}</span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Nombre del alumno
                </label>
                <input
                  className="print-input w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                />
                <span className="print-value text-gray-800">{nombre || '—'}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Monto pagado
                </label>
                <input
                  className="print-input w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="$0.00"
                />
                <span className="print-value text-gray-800">{monto || '—'}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Concepto
                </label>
                <input
                  className="print-input w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej. Paquete de 5 clases — Manejo básico"
                />
                <span className="print-value text-gray-800">{concepto || '—'}</span>
              </div>
            </div>

            {/* Botón */}
            <button
              onClick={() => window.print()}
              className="no-print mt-6 w-full bg-[#1B4FD8] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Guardar como PDF
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center text-xs text-gray-400">
            <p className="font-medium">Roma Sur, Ciudad de México · autoescuelaamericana.com</p>
            <p className="mt-0.5">Recibo válido emitido por Auto Escuela Americana</p>
          </div>

        </div>
      </div>
    </>
  );
}
