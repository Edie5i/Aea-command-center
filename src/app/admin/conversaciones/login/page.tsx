'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/admin/conversaciones/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      <div className="w-full max-w-xs text-center rounded-2xl p-8"
        style={{
          background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
          border: '1px solid rgba(148,163,184,0.12)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-white mb-1">AEA Admin</h1>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>Ingresa tu PIN de acceso</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="· · · ·"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            className="w-full text-center text-2xl tracking-widest px-4 py-3 rounded-xl outline-none transition-all"
            style={{
              background: 'rgba(148,163,184,0.06)',
              border: error ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0',
            }}
            autoFocus
          />
          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>PIN incorrecto</p>
          )}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full font-semibold py-3 rounded-xl transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
