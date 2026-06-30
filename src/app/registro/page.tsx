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

  const bg: React.CSSProperties = {
    background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)',
  };

  const inputStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    color: 'white',
    borderRadius: '12px',
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '15px',
    transition: 'border-color 0.15s',
  };

  if (status === 'success') {
    return (
      <main className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-screen flex items-center justify-center p-5`}
        style={bg}>
        {/* Glow */}
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-sm w-full text-center space-y-5">
          {/* Ring icon */}
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'conic-gradient(from 0deg, #334155, #64748b, #fbbf24, #f59e0b, #334155)', padding: 2 }}>
            <div className="w-full h-full rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              🚗
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-grotesk)] text-2xl font-bold text-white">
            ¡Listo, {nombreCompleto.split(' ')[0]}!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
            Te contactamos por WhatsApp en breve para platicar sobre tu curso.
          </p>
          <p className="font-[family-name:var(--font-mono)] text-sm"
            style={{ color: '#fbbf24' }}>
            {celular}
          </p>

          <div className="pt-2">
            <div className="rounded-2xl p-4 text-left"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <p className="text-xs" style={{ color: '#78716c' }}>
                Nuestro equipo revisará tu zona y te enviará opciones de horario. ¡Estamos listos para enseñarte!
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-screen flex flex-col items-center justify-center p-5`}
      style={bg}>

      {/* Glow + dot grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 65%)' }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 w-full max-w-sm space-y-7">

        {/* Header */}
        <div className="text-center space-y-3">
          {/* Logo ring */}
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-1"
            style={{ background: 'conic-gradient(from 0deg, #334155, #64748b, #fbbf24, #f59e0b, #334155)', padding: 2, borderRadius: 16 }}>
            <div className="w-full h-full rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 14 }}>
              🚗
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-grotesk)] text-3xl font-bold leading-tight"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Aprende a manejar<br />en CDMX
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-xs leading-relaxed" style={{ color: '#475569' }}>
            Déjanos tus datos y te contactamos sin compromiso
          </p>
        </div>

        {/* Card form */}
        <div className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
            border: '1px solid rgba(148,163,184,0.1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          }}>

          {/* Nombre */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest block mb-2"
              style={{ color: '#475569' }}>
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreCompleto}
              onChange={e => setNombreCompleto(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#fbbf24')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
              autoComplete="name"
              className="font-[family-name:var(--font-grotesk)] placeholder:text-slate-600"
            />
          </div>

          {/* Alcaldía */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest block mb-2"
              style={{ color: '#475569' }}>
              ¿Dónde vives?
            </label>
            <select
              value={alcaldia}
              onChange={e => setAlcaldia(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}
              onFocus={e => (e.target.style.borderColor = '#fbbf24')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
              className="font-[family-name:var(--font-grotesk)]"
            >
              <option value="" disabled style={{ background: '#1e293b' }}>Selecciona tu alcaldía</option>
              {ALCALDIAS.map(a => (
                <option key={a} value={a} style={{ background: '#1e293b' }}>{a}</option>
              ))}
            </select>
          </div>

          {/* Celular */}
          <div>
            <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest block mb-2"
              style={{ color: '#475569' }}>
              WhatsApp (10 dígitos)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="55 1234 5678"
              value={celular}
              onChange={e => setCelular(e.target.value)}
              maxLength={15}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#fbbf24')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
              className="font-[family-name:var(--font-mono)] tracking-wider placeholder:text-slate-600"
            />
          </div>

          {/* Error */}
          {status === 'error' && (
            <p className="text-sm" style={{ color: '#f87171' }}>{errorMsg}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || status === 'loading'}
            className="w-full font-[family-name:var(--font-grotesk)] font-bold text-base py-4 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: isValid ? 'linear-gradient(135deg, #d97706, #fbbf24)' : '#1e293b',
              color: isValid ? '#0c111d' : '#475569',
              boxShadow: isValid ? '0 4px 20px rgba(251,191,36,0.25)' : 'none',
            }}>
            {status === 'loading' ? 'Enviando…' : 'Regístrate gratis'}
          </button>
        </div>

        <p className="font-[family-name:var(--font-mono)] text-center text-[11px]" style={{ color: '#334155' }}>
          Te contactamos por WhatsApp · Sin spam
        </p>
      </div>
    </main>
  );
}
