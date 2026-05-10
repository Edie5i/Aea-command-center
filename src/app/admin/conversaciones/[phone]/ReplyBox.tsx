'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendAdminReply, toggleBotPause } from './actions';

interface Props {
  phone: string;
  botPaused: boolean;
}

export default function ReplyBox({ phone, botPaused: initialPaused }: Props) {
  const [paused, setPaused] = useState(initialPaused);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!paused) return;
    const id = setInterval(() => router.refresh(), 8_000);
    return () => clearInterval(id);
  }, [paused, router]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await sendAdminReply(phone, msg);
      setText('');
      router.refresh();
    } catch {
      alert('Error al enviar — revisa la conexión');
    } finally {
      setSending(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const next = !paused;
      await toggleBotPause(phone, next);
      setPaused(next);
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="bg-white border-t px-4 py-3 sticky bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${paused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="text-xs text-gray-600">
            {paused ? 'Modo manual — Luz pausada' : 'Luz activa'}
          </span>
        </div>
        <button
          disabled={toggling}
          onClick={handleToggle}
          className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors disabled:opacity-40 ${
            paused
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {toggling ? '...' : paused ? '▶ Reactivar Luz' : '⏸ Pausar Luz'}
        </button>
      </div>

      {paused && (
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu mensaje al lead…"
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={sending || !text.trim()}
            onClick={handleSend}
            className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1ebe5d] disabled:opacity-40 transition-colors self-end"
          >
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}
