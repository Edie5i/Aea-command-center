'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, FileText } from 'lucide-react';

export default function ReciboPage() {
  const [folio, setFolio] = useState('');
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  useEffect(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFolio(`REC-${new Date().getFullYear()}-${rand}`);
    setFecha(
      new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    );
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
          .screen-chrome { display: none !important; }
          .receipt-wrap { box-shadow: none !important; padding: 0 !important; }
          @page { margin: 2cm; }
        }
      `}</style>

      {/* Dark chrome — hidden on print */}
      <div className="screen-chrome min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

        {/* Header */}
        <header className="screen-chrome relative px-4 pt-8 pb-6 text-center"
          style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(37,99,235,0.1) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-4"
              style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
              <ArrowLeft className="w-3 h-3" /> Inicio
            </Link>
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-5 h-5" style={{ color: '#60a5fa' }} />
              <h1 className="text-lg font-bold text-white">Generador de Recibo</h1>
            </div>
            <p className="text-xs" style={{ color: '#475569' }}>Llena los campos y guarda como PDF</p>
          </div>
        </header>

        {/* Receipt card container */}
        <div className="receipt-wrap flex-1 px-4 py-8 flex justify-center">
          <div className="w-full max-w-2xl">

            {/* THE RECEIPT — white on screen and print */}
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden">

              {/* Receipt header */}
              <div className="bg-[#1B4FD8] px-8 py-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0">
                  <span className="text-[#1B4FD8] font-black text-xl leading-none">A</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Auto Escuela Americana</h2>
                  <p className="text-blue-200 text-sm">Recibo de Pago</p>
                </div>
              </div>

              {/* Receipt body */}
              <div className="px-8 py-8">

                {/* Folio + Fecha */}
                <div className="flex justify-between text-sm mb-8 pb-4 border-b border-gray-200">
                  <div>
                    <span className="text-gray-500">Folio:</span>{' '}
                    <span className="font-semibold text-gray-800">{folio}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>{' '}
                    <span className="font-semibold text-gray-800">{fecha}</span>
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
              </div>

              {/* Receipt footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center text-xs text-gray-400">
                <p className="font-medium">Roma Sur, Ciudad de México · autoescuelaamericana.com</p>
                <p className="mt-0.5">Recibo válido emitido por Auto Escuela Americana</p>
              </div>
            </div>

            {/* Print button — dark themed, hidden on print */}
            <button
              onClick={() => window.print()}
              className="no-print mt-4 w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
              }}>
              <Printer className="w-4 h-4" />
              Guardar como PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
