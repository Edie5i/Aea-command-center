'use client';

import { useState } from 'react';
import { Space_Grotesk, Space_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

const ALCALDIAS = [
  'Álvaro Obregón',
  'Benito Juárez',
  'Coyoacán',
  'Cuajimalpa',
  'Cuauhtémoc',
  'Gustavo A. Madero',
  'Iztapalapa',
  'Magdalena Contreras',
  'Miguel Hidalgo',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
  'Prefiero sucursal / punto de encuentro conveniente',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function RegistroPage() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [alcaldia, setAlcaldia] = useState('');
  const [celular, setCelular] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValid =
    nombreCompleto.trim().length >= 2 &&
    alcaldia !== '' &&
    celular.replace(/\D/g, '').length === 10;

  async function handleSubmit() {
    if (!isValid || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCompleto, alcaldia, celular }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Ocurrió un error. Intenta de nuevo.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <main className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-screen bg-zinc-950 flex items-center justify-center p-5`}>
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center mx-auto text-3xl">
            🚗
          </div>
          <h1 className="font-[family-name:var(--font-grotesk)] text-2xl font-bold text-white">
            ¡Listo, {nombreCompleto.split(' ')[0]}!
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Te contactamos por WhatsApp en breve para platicar sobre tu curso.
          </p>
          <p className="font-[family-name:var(--font-mono)] text-amber-400 text-sm">
            {celular}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-5`}>
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto text-2xl mb-4">
            🚗
          </div>
          <h1 className="font-[family-name:var(--font-grotesk)] text-3xl font-bold text-white leading-tight">
            Aprende a manejar<br />en CDMX
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Déjanos tus datos y empieza tu proceso para aprender a manejar. Sin compromiso.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreCompleto}
              onChange={e => setNombreCompleto(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-600 font-[family-name:var(--font-grotesk)]"
              autoComplete="name"
            />
          </div>

          {/* Alcaldía */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
              ¿Dónde vives?
            </label>
            <select
              value={alcaldia}
              onChange={e => setAlcaldia(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition-colors font-[family-name:var(--font-grotesk)] appearance-none"
            >
              <option value="" disabled>Selecciona tu alcaldía</option>
              {ALCALDIAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Celular */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
              WhatsApp (10 dígitos)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="55 1234 5678"
              value={celular}
              onChange={e => setCelular(e.target.value)}
              maxLength={15}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-600 font-[family-name:var(--font-mono)] tracking-wider"
            />
          </div>

          {/* Error */}
          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || status === 'loading'}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-[family-name:var(--font-grotesk)] font-bold text-base py-4 rounded-xl transition-colors mt-2"
          >
            {status === 'loading' ? 'Enviando…' : 'Regístrate'}
          </button>

          <p className="font-[family-name:var(--font-mono)] text-zinc-600 text-xs text-center">
            Te contactamos por WhatsApp · Sin spam
          </p>
        </div>
      </div>
    </main>
  );
}
