'use client';

import { useState } from 'react';
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
      router.push('/admin/conversaciones');
      router.refresh();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-xs text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Conversaciones</h1>
        <p className="text-sm text-gray-500 mb-6">Ingresa tu PIN de acceso</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            className="w-full text-center text-2xl tracking-widest border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm">PIN incorrecto</p>
          )}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40 active:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
