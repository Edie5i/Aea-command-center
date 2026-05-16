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
    <div className="bg-[#f0f2f5] border-t border-gray-200 px-4 py-3 sticky bottom-0">
      {/* Bot status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${paused ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {paused ? 'Modo manual — escribes tú' : 'Luz está respondiendo'}
          </span>
        </div>
        <button
          disabled={toggling}
          onClick={handleToggle}
          className={`text-sm px-4 py-1.5 rounded-full font-semibold transition-colors disabled:opacity-40 ${
            paused
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-amber-400 text-white hover:bg-amber-500'
          }`}
        >
          {toggling ? '...' : paused ? '▶ Reactivar Luz' : '⏸ Tomar el control'}
        </button>
      </div>

      {/* Reply input — only visible in manual mode */}
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
            className="flex-1 text-base border border-gray-300 rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#075e54] bg-white"
          />
          <button
            disabled={sending || !text.trim()}
            onClick={handleSend}
            className="bg-[#25D366] text-white w-12 h-12 rounded-full text-xl flex items-center justify-center hover:bg-[#1ebe5d] disabled:opacity-40 transition-colors shrink-0"
            aria-label="Enviar"
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
      )}
    </div>
  );
}
