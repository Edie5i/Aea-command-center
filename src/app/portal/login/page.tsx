'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'otp';

export default function PortalLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/portal/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (res.ok) {
      setStep('otp');
    } else if (res.status === 403) {
      setError('Número no registrado como instructor activo.');
    } else {
      setError('Error al enviar el código. Intenta de nuevo.');
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/portal/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/portal');
      router.refresh();
    } else {
      setError('Código incorrecto o expirado.');
      setOtp('');
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/50">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Instructor</h1>
          <p className="text-gray-500 text-sm mt-1">UrbDriver · AEA</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
          {step === 'phone' ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">
                  Número de WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="55 1234 5678"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-600"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={phone.length < 8 || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Enviando…' : 'Enviar código por WhatsApp'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  Código enviado al <span className="text-white font-medium">{phone}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => { setOtp(e.target.value); setError(''); }}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-center text-3xl tracking-[0.5em] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-700"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={otp.length < 6 || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Verificando…' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-600 hover:text-gray-400 transition-colors py-1"
              >
                Cambiar número
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
