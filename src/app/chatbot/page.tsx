
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Send, ArrowLeft, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { getChatbotResponseAction } from '@/app/actions';

type Message = {
  id: number;
  role: 'user' | 'bot';
  text: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'bot',
    text: '¡Hola! Soy Luz, de Auto Escuela Americana. ¿Ya manejas o vas empezando desde cero? 🚗',
  },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setError(null);

    const userMessage: Message = { id: Date.now(), role: 'user', text: input };
    const historySnapshot = messages.map((m: Message) => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getChatbotResponseAction(input, historySnapshot);
      if (result.error || !result.response) throw new Error(result.error || 'Sin respuesta');
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: result.response! }]);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: 'Lo siento, estoy teniendo problemas. Intenta de nuevo en un momento.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setMessages(initialMessages);
    setError(null);
  }, []);

  return (
    <main className="flex flex-col h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Header */}
      <header className="shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#475569' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Avatar Luz */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'conic-gradient(from 0deg, #334155, #64748b, #e2e8f0, #94a3b8, #334155)',
              padding: 1.5,
            }}>
            <div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              <Bot className="w-4 h-4" style={{ color: '#60a5fa' }} />
            </div>
          </div>
          {/* Status dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#34d399', borderColor: '#0f172a' }} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-none">Luz</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#34d399' }}>En línea · AEA</p>
        </div>

        <button onClick={handleReset} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#475569' }} title="Reiniciar chat">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    border: '1px solid rgba(148,163,184,0.15)',
                  }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
                </div>
              )}
              <div className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                style={isUser ? {
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  borderRadius: '18px 18px 4px 18px',
                  color: 'white',
                  boxShadow: '0 2px 12px rgba(37,99,235,0.3)',
                } : {
                  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                  border: '1px solid rgba(148,163,184,0.1)',
                  borderRadius: '4px 18px 18px 18px',
                  color: '#cbd5e1',
                }}>
                {msg.text}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                  style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)' }}>
                  <User className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(148,163,184,0.15)' }}>
              <Bot className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
            </div>
            <div className="px-4 py-3 flex items-center gap-1.5"
              style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '4px 18px 18px 18px' }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#60a5fa', animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)', borderTop: '1px solid rgba(148,163,184,0.1)' }}>

        {/* Sugerencias rápidas — solo al inicio */}
        {messages.length === 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {['¿Cuánto cuesta?', '¿Tienen clases a domicilio?', '¿Cuántas clases necesito?'].map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            disabled={isLoading}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
            style={{
              background: 'rgba(148,163,184,0.06)',
              border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0',
            }}
          />
          <button type="submit" disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>

        <p className="text-center text-[10px] mt-2" style={{ color: '#334155' }}>
          Luz · IA de Auto Escuela Americana ·{' '}
          <Link href="/agenda" style={{ color: '#475569' }}>Agendar clase</Link>
        </p>
      </div>
    </main>
  );
}
