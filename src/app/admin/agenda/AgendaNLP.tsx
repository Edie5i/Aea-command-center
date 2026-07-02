'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ParseResult {
  accion: string;
  alumno: string | null;
  curso: string | null;
  fecha: string | null;
  hora: string | null;
  confianza: number;
  falta_info: string[];
}

const COLOR_MAP: Record<string, string> = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
  '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#3f51b5',
  '9': '#0b8043', '10': '#d50000', '11': '#616161',
};

interface Evento {
  id: string;
  alumno: string;
  inicio: string;
  colorId?: string;
}

interface AlumnoData {
  inscripcion: {
    nombre: string;
    telefono: string;
    zona: string;
    transmision: string;
    fechas: { date: string; time: string }[];
  } | null;
  ultimaFicha: {
    completedCount: number;
    totalTopics: number;
    completedTopics: string[];
    pendingTopics: string[];
    dateMillis: number;
  } | null;
  proximasClases: Evento[];
}

type Step = 'idle' | 'parsing' | 'confirm' | 'disambiguate' | 'disambiguate_inscripcion' | 'executing' | 'done' | 'consulta' | 'alumno' | 'error';

const ACCION_LABEL: Record<string, string> = {
  nueva_ficha: 'Nueva ficha',
  mover_clase: 'Mover clase',
  cancelar_clase: 'Cancelar clase',
  agendar_ficha: 'Agendar ficha en Calendar',
  consultar_alumno: 'Consultar alumno',
  consultar_agenda: 'Consultar agenda',
  desconocido: 'Desconocido',
};

function formatEventDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const HISTORIAL_KEY = 'agenda_nlp_historial';

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 16,
};

const INNER: React.CSSProperties = {
  background: 'rgba(148,163,184,0.04)',
  border: '1px solid rgba(148,163,184,0.07)',
  borderRadius: 12,
};

export default function AgendaNLP() {
  const [texto, setTexto] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [alumnoData, setAlumnoData] = useState<AlumnoData | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [listening, setListening] = useState(false);
  const [historial, setHistorial] = useState<string[]>([]);
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  const [lastContext, setLastContext] = useState<{ alumno?: string }>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState<string | null>(null); // alumno name
  const [pendingInscripciones, setPendingInscripciones] = useState<{ nombre: string; telefono: string; transmision: string; sesiones: number; phone: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
    try {
      const h = localStorage.getItem(HISTORIAL_KEY);
      if (h) setHistorial(JSON.parse(h));
    } catch {}
  }, []);

  function saveHistorial(cmd: string) {
    const next = [cmd, ...historial.filter((x: string) => x !== cmd)].slice(0, 6);
    setHistorial(next);
    try { localStorage.setItem(HISTORIAL_KEY, JSON.stringify(next)); } catch {}
  }

  function autoSubmit(transcript: string) {
    setTexto(transcript);
    setTimeout(() => document.getElementById('btn-analizar')?.click(), 100);
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.interimResults = false;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (e: any) => {
        setListening(false);
        if (e.error === 'not-allowed') return;
        setMensaje('Error de micrófono: ' + e.error);
      };
      rec.onresult = (e: any) => { autoSubmit(e.results[0][0].transcript); };
      rec.start();
      recognitionRef.current = rec;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { alert('Tu navegador no soporta micrófono.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const chunks: BlobPart[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setListening(false);
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const form = new FormData();
        form.append('audio', blob, 'audio.webm');
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          if (data.ok && data.text) autoSubmit(data.text);
          else setMensaje('No se pudo transcribir. Intenta de nuevo.');
        } catch { setMensaje('Error al transcribir el audio.'); }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setListening(true);
    }).catch(() => alert('No se pudo acceder al micrófono.'));
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setListening(false);
  }

  async function handleParse() {
    if (!texto.trim()) return;
    setStep('parsing'); setParsed(null); setEventos([]); setMensaje(''); setEditFecha(''); setEditHora('');
    try {
      const res = await fetch('/api/agenda/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, contexto: lastContext }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Error al parsear');
      const r: ParseResult = data.resultado;
      setEditFecha(r.fecha ?? ''); setEditHora(r.hora ?? ''); setParsed(r);
      const soloNombreRequerido = r.accion === 'cancelar_clase' || r.accion === 'agendar_ficha' || r.accion === 'consultar_alumno';
      const soloFechaRequerida = r.accion === 'consultar_agenda';
      const criticos = (!soloNombreRequerido && !soloFechaRequerida && !r.alumno) ||
        (!soloNombreRequerido && !soloFechaRequerida && !r.fecha && !r.hora);
      if (r.confianza >= 0.9 && !criticos && r.accion !== 'desconocido' && r.accion !== 'cancelar_clase' && r.accion !== 'mover_clase') {
        await executeAction(r);
      } else { setStep('confirm'); }
    } catch (e) { setMensaje(e instanceof Error ? e.message : 'Error'); setStep('error'); }
  }

  async function executeAction(payload: ParseResult, eventId?: string) {
    setStep('executing');
    try {
      const res = await fetch('/api/agenda/ejecutar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, eventId }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.error === 'multiple' && data.eventos) { setEventos(data.eventos); setStep('disambiguate'); return; }
        if (data.error === 'multiple_inscripciones' && data.inscripciones) { setPendingInscripciones(data.inscripciones); setStep('disambiguate_inscripcion'); return; }
        throw new Error(data.error ?? 'Error al ejecutar');
      }
      if (payload.alumno) setLastContext({ alumno: payload.alumno });
      saveHistorial(texto);
      if (data.consulta) { setEventos(data.eventos ?? []); setMensaje(data.mensaje ?? ''); setStep('consulta'); return; }
      if (data.alumno) { setAlumnoData(data.data); setStep('alumno'); return; }
      setMensaje(data.mensaje ?? 'Listo'); setStep('done');
    } catch (e) { setMensaje(e instanceof Error ? e.message : 'Error'); setStep('error'); }
  }

  async function handleEjecutar(eventId?: string, overrideParsed?: ParseResult) {
    const base = overrideParsed ?? parsed;
    if (!base) return;
    const payload: ParseResult = { ...base, fecha: editFecha || base.fecha, hora: editHora || base.hora };
    await executeAction(payload, eventId);
  }

  function reset() {
    setTexto(''); setParsed(null); setEventos([]); setAlumnoData(null); setMensaje('');
    setEditFecha(''); setEditHora(''); setPendingDeleteId(null); setPendingDeleteAll(null); setPendingInscripciones([]);
    setStep('idle');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function borrarTodas(alumno: string) {
    const eventsToDelete = eventos.filter((e: Evento) => e.alumno === alumno);
    setPendingDeleteAll(null);
    setEventos((prev: Evento[]) => prev.filter((e: Evento) => e.alumno !== alumno));
    for (const ev of eventsToDelete) {
      await executeAction({ accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] }, ev.id);
    }
  }

  async function confirmarBorrar(ev: Evento) {
    setEventos((prev: Evento[]) => prev.filter((e: Evento) => e.id !== ev.id));
    setPendingDeleteId(null);
    await executeAction({ accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] }, ev.id);
  }

  const confianzaColor =
    !parsed ? '' :
    parsed.confianza >= 0.9 ? 'text-green-400' :
    parsed.confianza >= 0.7 ? 'text-amber-400' : 'text-red-400';

  const efectivaFecha = editFecha || parsed?.fecha || '';
  const efectivaHora = editHora || parsed?.hora || '';

  const canExecute = parsed && parsed.accion !== 'desconocido' && (
    parsed.accion === 'cancelar_clase' ? !!parsed.alumno :
    parsed.accion === 'agendar_ficha' ? !!parsed.alumno :
    parsed.accion === 'consultar_alumno' ? !!parsed.alumno :
    parsed.accion === 'consultar_agenda' ? true :
    !!(parsed.alumno && efectivaFecha && efectivaHora)
  );

  const needsFecha = parsed && !parsed.fecha && ['mover_clase', 'nueva_ficha'].includes(parsed.accion);
  const needsHora = parsed && !parsed.hora && ['mover_clase', 'nueva_ficha'].includes(parsed.accion);

  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(8px)' }}>
        <Link href="/admin" className="text-xl transition-colors" style={{ color: '#475569' }}>←</Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-white">Agenda NLP</h1>
          <p className="text-[11px]" style={{ color: '#334155' }}>
            Comandos en lenguaje natural
            {lastContext.alumno && <span className="ml-2" style={{ color: '#3b82f6' }}>· {lastContext.alumno}</span>}
          </p>
        </div>
        {lastContext.alumno && (
          <button onClick={() => setLastContext({})}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: '#475569', border: '1px solid rgba(148,163,184,0.12)' }}>
            Limpiar
          </button>
        )}
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Input */}
        <div className="p-4 space-y-3" style={CARD}>
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>¿Qué necesitas hacer?</label>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onPaste={e => { e.preventDefault(); const pasted = e.clipboardData.getData('text').replace(/[\r\n]+/g, ' ').trim(); setTexto(pasted); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
            placeholder={lastContext.alumno ? 'Ej: muévela al viernes 4pm' : 'Ej: pásale a Juan al jueves 4pm'}
            rows={3}
            disabled={step !== 'idle' && step !== 'error'}
            className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none transition-all disabled:opacity-50 placeholder:text-slate-600"
            style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
          />
          <div className="flex gap-2">
            <button
              onClick={listening ? stopVoice : startVoice}
              disabled={step !== 'idle' && step !== 'error'}
              className={`flex-none text-sm px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-40 ${listening ? 'animate-pulse' : ''}`}
              style={listening
                ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                : { background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
              {listening ? '⏹ Detener' : '🎤 Voz'}
            </button>
            <button
              id="btn-analizar"
              onClick={handleParse}
              disabled={(step !== 'idle' && step !== 'error') || !texto.trim()}
              className="flex-1 text-sm font-semibold py-2 rounded-xl text-white transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: texto.trim() ? '0 2px 12px rgba(37,99,235,0.3)' : 'none' }}>
              {step === 'parsing' ? 'Analizando…' : 'Analizar'}
            </button>
          </div>
        </div>

        {/* Confirm card */}
        {step === 'confirm' && parsed && (
          <div className="p-4 space-y-4" style={CARD}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{ACCION_LABEL[parsed.accion] ?? parsed.accion}</span>
              <span className={`text-xs font-semibold ${confianzaColor}`}>{Math.round(parsed.confianza * 100)}% confianza</span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm items-center">
              {parsed.alumno && (<><span style={{ color: '#475569' }}>Alumno</span><span className="font-medium text-white">{parsed.alumno}</span></>)}
              {parsed.curso && (<><span style={{ color: '#475569' }}>Curso</span><span className="font-medium text-white">{parsed.curso}</span></>)}
              <span style={{ color: '#475569' }}>Fecha</span>
              {parsed.fecha ? (
                <span className="font-medium text-white">{parsed.fecha}</span>
              ) : needsFecha ? (
                <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)}
                  className="text-sm rounded-lg px-2 py-1 outline-none"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }} />
              ) : (
                <span className="text-xs" style={{ color: '#334155' }}>—</span>
              )}
              <span style={{ color: '#475569' }}>Hora</span>
              {parsed.hora ? (
                <span className="font-medium text-white">{parsed.hora}</span>
              ) : needsHora ? (
                <input type="time" value={editHora} onChange={e => setEditHora(e.target.value)}
                  className="text-sm rounded-lg px-2 py-1 outline-none"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }} />
              ) : (
                <span className="text-xs" style={{ color: '#334155' }}>—</span>
              )}
            </div>

            {(needsFecha || needsHora) && (
              <p className="text-xs px-3 py-2 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                Completa {[needsFecha && 'la fecha', needsHora && 'la hora'].filter(Boolean).join(' y ')} para ejecutar.
              </p>
            )}

            {parsed.accion === 'desconocido' ? (
              <div className="text-xs text-center space-y-1">
                <p className="font-semibold" style={{ color: '#64748b' }}>No se reconoció la acción.</p>
                <p style={{ color: '#334155' }}>Ejemplos: "cancela a Juan", "pásale a María al viernes 4pm"</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={reset}
                  className="flex-none text-sm px-4 py-2 rounded-xl font-semibold"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={() => handleEjecutar()} disabled={!canExecute}
                  className="flex-1 text-sm text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-30"
                  style={parsed.accion === 'cancelar_clase'
                    ? { background: 'linear-gradient(135deg, #dc2626, #ef4444)' }
                    : { background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  {parsed.accion === 'cancelar_clase' ? 'Sí, borrar clase' : 'Ejecutar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disambiguation — eventos */}
        {step === 'disambiguate' && eventos.length > 0 && (
          <div className="p-4 space-y-3" style={CARD}>
            <p className="text-sm font-semibold text-white">Se encontraron varias clases. ¿Cuál?</p>
            {eventos.map((ev: Evento) => (
              <button key={ev.id} onClick={() => handleEjecutar(ev.id)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                style={INNER}>
                <span className="font-medium text-white block">{ev.alumno}</span>
                <span className="text-xs" style={{ color: '#475569' }}>{formatEventDate(ev.inicio)}</span>
              </button>
            ))}
            <button onClick={reset} className="w-full text-xs py-1 transition-colors" style={{ color: '#334155' }}>Cancelar</button>
          </div>
        )}

        {/* Disambiguation — inscripciones */}
        {step === 'disambiguate_inscripcion' && pendingInscripciones.length > 0 && (
          <div className="p-4 space-y-3" style={CARD}>
            <p className="text-sm font-semibold text-white">Hay varias fichas con ese nombre. ¿Cuál agendas?</p>
            {pendingInscripciones.map(ins => (
              <button key={ins.phone}
                onClick={() => {
                  if (!parsed) return;
                  setStep('executing');
                  fetch('/api/agenda/ejecutar', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...parsed, inscripcionPhone: ins.phone }),
                  }).then(r => r.json()).then(data => {
                    if (!data.ok) { setMensaje(data.error ?? 'Error'); setStep('error'); return; }
                    if (parsed.alumno) setLastContext({ alumno: parsed.alumno });
                    saveHistorial(texto); setMensaje(data.mensaje ?? 'Listo'); setStep('done');
                  }).catch(() => { setMensaje('Error al ejecutar'); setStep('error'); });
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                style={INNER}>
                <span className="font-medium text-white block">{ins.nombre}</span>
                <span className="text-xs" style={{ color: '#475569' }}>{ins.transmision} · {ins.sesiones} sesiones · {ins.telefono}</span>
              </button>
            ))}
            <button onClick={reset} className="w-full text-xs py-1" style={{ color: '#334155' }}>Cancelar</button>
          </div>
        )}

        {/* Consulta resultados */}
        {step === 'consulta' && (
          <div className="p-4 space-y-3" style={CARD}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {eventos.length > 0 ? `${eventos.length} clase${eventos.length > 1 ? 's' : ''} agendada${eventos.length > 1 ? 's' : ''}` : 'Sin clases'}
              </p>
              <button onClick={reset} className="text-xs transition-colors" style={{ color: '#3b82f6' }}>Nueva consulta</button>
            </div>
            {mensaje && eventos.length === 0 && <p className="text-sm" style={{ color: '#475569' }}>{mensaje}</p>}

            {/* Agrupar por alumno para borrado masivo */}
            {(() => {
              const alumnos: string[] = Array.from(new Set(eventos.map((e: Evento) => e.alumno)));
              return alumnos.map((alumno: string) => {
                const evAlumno = eventos.filter((e: Evento) => e.alumno === alumno);
                const color = COLOR_MAP[evAlumno[0]?.colorId ?? ''] ?? '#475569';
                return (
                  <div key={alumno} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: color }} />
                        <span className="text-xs font-semibold text-white">{alumno}</span>
                        <span className="text-xs" style={{ color: '#334155' }}>{evAlumno.length} clase{evAlumno.length > 1 ? 's' : ''}</span>
                      </div>
                      {pendingDeleteAll === alumno ? (
                        <div className="flex gap-1">
                          <button onClick={() => borrarTodas(alumno)}
                            className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
                            style={{ background: '#dc2626' }}>Sí, borrar todas</button>
                          <button onClick={() => setPendingDeleteAll(null)}
                            className="text-xs px-2 py-1 rounded-lg font-semibold"
                            style={{ background: 'rgba(148,163,184,0.08)', color: '#64748b' }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setPendingDeleteAll(alumno)}
                          className="text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{ background: 'rgba(239,68,68,0.07)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                          Borrar todas
                        </button>
                      )}
                    </div>
                    {evAlumno.map((ev: Evento) => (
                      <div key={ev.id} className="px-3 py-2.5 rounded-xl" style={{ ...INNER, borderLeft: `3px solid ${COLOR_MAP[ev.colorId ?? ''] ?? '#334155'}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs" style={{ color: '#94a3b8' }}>{formatEventDate(ev.inicio)}</p>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setEditFecha(''); setEditHora(''); setStep('confirm'); }}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                              Mover
                            </button>
                            {pendingDeleteId === ev.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => confirmarBorrar(ev)}
                                  className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
                                  style={{ background: '#dc2626' }}>Sí</button>
                                <button onClick={() => setPendingDeleteId(null)}
                                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                                  style={{ background: 'rgba(148,163,184,0.08)', color: '#64748b' }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setPendingDeleteId(ev.id)}
                                className="text-xs px-2 py-1 rounded-lg font-semibold"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                Borrar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Consulta alumno */}
        {step === 'alumno' && alumnoData && (
          <div className="p-4 space-y-4" style={CARD}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-white">{alumnoData.inscripcion?.nombre ?? parsed?.alumno}</p>
                {alumnoData.inscripcion?.telefono && (
                  <a href={`tel:${alumnoData.inscripcion.telefono}`} className="text-xs" style={{ color: '#3b82f6' }}>
                    {alumnoData.inscripcion.telefono}
                  </a>
                )}
              </div>
              <button onClick={reset} className="text-sm" style={{ color: '#334155' }}>✕</button>
            </div>

            {alumnoData.inscripcion && (
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span style={{ color: '#475569' }}>Curso</span>
                <span className="font-medium text-white">{alumnoData.inscripcion.transmision}</span>
                {alumnoData.inscripcion.zona && (
                  <><span style={{ color: '#475569' }}>Zona</span><span className="font-medium text-white">{alumnoData.inscripcion.zona}</span></>
                )}
              </div>
            )}

            {alumnoData.ultimaFicha && (
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: '#60a5fa' }}>Progreso</p>
                  <p className="text-xs font-bold" style={{ color: '#93c5fd' }}>
                    {alumnoData.ultimaFicha.completedCount}/{alumnoData.ultimaFicha.totalTopics} temas
                    ({Math.round(alumnoData.ultimaFicha.completedCount / alumnoData.ultimaFicha.totalTopics * 100)}%)
                  </p>
                </div>
                {alumnoData.ultimaFicha.pendingTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#60a5fa' }}>Pendientes:</p>
                    {alumnoData.ultimaFicha.pendingTopics.map((t: string) => (
                      <p key={t} className="text-xs" style={{ color: '#475569' }}>• {t}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {alumnoData.proximasClases.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#334155' }}>Próximas clases</p>
                {alumnoData.proximasClases.map((ev: Evento) => (
                  <div key={ev.id} className="px-3 py-2 rounded-xl" style={INNER}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white">{formatEventDate(ev.inicio)}</p>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setEditFecha(''); setEditHora(''); setStep('confirm'); }}
                          className="text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                          Mover
                        </button>
                        {pendingDeleteId === ev.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => confirmarBorrar(ev)}
                              className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
                              style={{ background: '#dc2626' }}>Sí, borrar</button>
                            <button onClick={() => setPendingDeleteId(null)}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: 'rgba(148,163,184,0.08)', color: '#64748b' }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setPendingDeleteId(ev.id)}
                            className="text-xs px-2 py-1 rounded-lg font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            Borrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {alumnoData.proximasClases.length === 0 && !alumnoData.ultimaFicha && (
              <p className="text-xs text-center" style={{ color: '#334155' }}>Sin clases próximas ni fichas de progreso.</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const nombre = alumnoData.inscripcion?.nombre ?? parsed?.alumno ?? '';
                  setTexto(`súbele las clases de ${nombre} al gc`);
                  reset();
                  setTimeout(() => { setTexto(`súbele las clases de ${nombre} al gc`); setStep('idle'); }, 60);
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl font-semibold"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                Subir al Calendar
              </button>
              <button
                onClick={() => {
                  const nombre = alumnoData.inscripcion?.nombre ?? parsed?.alumno ?? '';
                  setParsed({ accion: 'mover_clase', alumno: nombre, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] });
                  setEditFecha(''); setEditHora(''); setStep('confirm');
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl font-semibold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                Mover próxima
              </button>
            </div>
          </div>
        )}

        {/* Executing */}
        {step === 'executing' && (
          <div className="p-6 text-center" style={CARD}>
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm" style={{ color: '#475569' }}>Ejecutando en Calendar…</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-6 text-center space-y-3" style={{ ...CARD, borderColor: 'rgba(52,211,153,0.2)' }}>
            <div className="text-3xl">✅</div>
            <p className="text-sm font-semibold text-white">{mensaje}</p>
            <button onClick={reset}
              className="text-sm font-semibold px-6 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              Nuevo comando
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="p-4 space-y-3" style={{ ...CARD, borderColor: 'rgba(248,113,113,0.2)' }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">❌</span>
              <p className="text-sm" style={{ color: '#f87171' }}>{mensaje}</p>
            </div>
            <button onClick={() => setStep('idle')} className="text-sm" style={{ color: '#475569' }}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Comandos */}
        {step === 'idle' && (
          <div className="p-4 space-y-1" style={CARD}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#334155' }}>Comandos</p>
            {[
              { label: 'Ver agenda completa', cmd: '¿Qué hay los próximos 30 días?' },
              { label: 'Buscar alumno', cmd: 'Busca a [nombre]' },
              { label: 'Qué hay mañana', cmd: '¿Qué hay mañana?' },
              { label: 'Nueva ficha', cmd: 'Nueva ficha [nombre] [curso] el [día] [hora]' },
              { label: 'Mover clase', cmd: 'Pásale a [nombre] al [día] [hora]' },
              { label: 'Cancelar clase', cmd: 'Cancela a [nombre]' },
              { label: 'Eliminar evento', cmd: 'Elimina [nombre] [día] [hora]' },
              { label: 'Subir al GC', cmd: 'Súbele las clases de [nombre] al gc' },
            ].map(({ label, cmd }) => (
              <button key={cmd}
                onClick={() => { setTexto(cmd); setTimeout(() => textareaRef.current?.focus(), 50); }}
                className="w-full text-left text-xs rounded-lg px-2 py-2 transition-colors flex items-center justify-between group hover:bg-white/[0.03]">
                <span className="font-medium" style={{ color: '#64748b' }}>{label}</span>
                <span className="truncate ml-2 max-w-[55%]" style={{ color: '#334155' }}>{cmd}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
