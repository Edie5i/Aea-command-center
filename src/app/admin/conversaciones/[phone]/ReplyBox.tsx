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
    <div className="sticky bottom-0 px-4 py-3"
      style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
      {/* Bot status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full"
            style={{ background: paused ? '#f59e0b' : '#34d399' }} />
          <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            {paused ? 'Modo manual' : 'Luz respondiendo'}
          </span>
        </div>
        <button
          disabled={toggling}
          onClick={handleToggle}
          className="text-xs px-4 py-1.5 rounded-full font-semibold transition-all disabled:opacity-40"
          style={paused
            ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
            : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          {toggling ? '...' : paused ? '▶ Reactivar Luz' : '⏸ Tomar control'}
        </button>
      </div>

      {paused && (
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu mensaje…"
            rows={2}
            className="flex-1 text-sm rounded-2xl px-4 py-2.5 resize-none outline-none"
            style={{
              background: 'rgba(148,163,184,0.06)',
              border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0',
            }}
          />
          <button
            disabled={sending || !text.trim()}
            onClick={handleSend}
            className="w-11 h-11 rounded-full text-lg flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white' }}
            aria-label="Enviar"
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
      )}
    </div>
  );
}
