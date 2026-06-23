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
      setError('Este número no está registrado como instructor activo.');
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-xs text-center space-y-6">
        <div>
          <div className="text-4xl mb-3">🚗</div>
          <h1 className="text-xl font-bold text-gray-900">Portal Instructor</h1>
          <p className="text-sm text-gray-500 mt-1">UrbDriver · AEA</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="text-left">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Número de WhatsApp
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="55 1234 5678"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                className="w-full border rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={phone.length < 8 || loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-colors"
            >
              {loading ? 'Enviando…' : 'Enviar código por WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">
              Te enviamos un código de 6 dígitos al <strong>{phone}</strong>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => { setOtp(e.target.value); setError(''); }}
              className="w-full text-center text-3xl tracking-widest border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={otp.length < 6 || loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-colors"
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cambiar número
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
