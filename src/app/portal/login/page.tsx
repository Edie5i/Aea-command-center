'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, ArrowLeft } from 'lucide-react';

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
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'conic-gradient(from 0deg, #334155, #64748b, #e2e8f0, #94a3b8, #334155)',
              padding: 2,
              borderRadius: 16,
            }}>
            <div className="w-full h-full rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 14 }}>
              🚗
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Portal Instructor</h1>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>UrbDriver · AEA</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
            border: '1px solid rgba(148,163,184,0.1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          }}>

          {step === 'phone' ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: '#475569' }}>
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="55 1234 5678"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(''); }}
                    autoFocus
                    className="w-full pl-10 py-3 rounded-xl text-base outline-none transition-all placeholder:text-slate-600"
                    style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = '#334155')}
                  />
                </div>
              </div>
              {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={phone.length < 8 || loading}
                className="w-full font-semibold py-3 rounded-xl text-sm text-white transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
                {loading ? 'Enviando…' : 'Enviar código por WhatsApp'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                  Código enviado al <span style={{ color: '#e2e8f0' }}>{phone}</span>
                </p>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={e => { setOtp(e.target.value); setError(''); }}
                    autoFocus
                    className="w-full text-center text-3xl tracking-[0.5em] py-4 rounded-xl outline-none transition-all placeholder:text-slate-700"
                    style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = '#334155')}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={otp.length < 6 || loading}
                className="w-full font-semibold py-3 rounded-xl text-sm text-white transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
                {loading ? 'Verificando…' : 'Entrar'}
              </button>
              <button type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-sm py-1 transition-colors"
                style={{ color: '#475569' }}>
                Cambiar número
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
