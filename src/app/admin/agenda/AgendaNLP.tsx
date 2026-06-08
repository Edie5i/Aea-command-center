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

interface Evento {
  id: string;
  alumno: string;
  inicio: string;
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

type Step = 'idle' | 'parsing' | 'confirm' | 'disambiguate' | 'executing' | 'done' | 'consulta' | 'alumno' | 'error';

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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const HISTORIAL_KEY = 'agenda_nlp_historial';

export default function AgendaNLP() {
  const [texto, setTexto] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [alumnoData, setAlumnoData] = useState<AlumnoData | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [listening, setListening] = useState(false);
  const [historial, setHistorial] = useState<string[]>([]);
  // Inline edit fields for confirm card
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  // Context: remember last alumno for pronoun resolution
  const [lastContext, setLastContext] = useState<{ alumno?: string }>({});

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

    // Chrome / Safari — SpeechRecognition nativo (instantáneo)
    if (SR) {
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.interimResults = false;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (e: any) => {
        setListening(false);
        // not-allowed = permiso denegado o diálogo cancelado — silencioso
        if (e.error === 'not-allowed') return;
        setMensaje('Error de micrófono: ' + e.error);
      };
      rec.onresult = (e: any) => {
        autoSubmit(e.results[0][0].transcript);
      };
      rec.start();
      recognitionRef.current = rec;
      return;
    }

    // Firefox — MediaRecorder + Gemini transcripción
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Tu navegador no soporta micrófono.');
      return;
    }
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
        } catch {
          setMensaje('Error al transcribir el audio.');
        }
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
    setStep('parsing');
    setParsed(null);
    setEventos([]);
    setMensaje('');
    setEditFecha('');
    setEditHora('');
    try {
      const res = await fetch('/api/agenda/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, contexto: lastContext }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Error al parsear');
      const r: ParseResult = data.resultado;
      // Pre-fill edit fields if already parsed
      setEditFecha(r.fecha ?? '');
      setEditHora(r.hora ?? '');
      setParsed(r);
      const soloNombreRequerido = r.accion === 'cancelar_clase' || r.accion === 'agendar_ficha' || r.accion === 'consultar_alumno';
      const soloFechaRequerida = r.accion === 'consultar_agenda';
      const criticos = (!soloNombreRequerido && !soloFechaRequerida && !r.alumno) ||
        (!soloNombreRequerido && !soloFechaRequerida && !r.fecha && !r.hora);
      if (r.confianza >= 0.9 && !criticos && r.accion !== 'desconocido') {
        await executeAction(r);
      } else {
        setStep('confirm');
      }
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error');
      setStep('error');
    }
  }

  async function executeAction(payload: ParseResult, eventId?: string) {
    setStep('executing');
    try {
      const res = await fetch('/api/agenda/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, eventId }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.error === 'multiple' && data.eventos) {
          setEventos(data.eventos);
          setStep('disambiguate');
          return;
        }
        throw new Error(data.error ?? 'Error al ejecutar');
      }
      // Update context with the alumno used
      if (payload.alumno) setLastContext({ alumno: payload.alumno });
      saveHistorial(texto);
      if (data.consulta) { setEventos(data.eventos ?? []); setMensaje(data.mensaje ?? ''); setStep('consulta'); return; }
      if (data.alumno) { setAlumnoData(data.data); setStep('alumno'); return; }
      setMensaje(data.mensaje ?? 'Listo');
      setStep('done');
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error');
      setStep('error');
    }
  }

  async function handleEjecutar(eventId?: string, overrideParsed?: ParseResult) {
    const base = overrideParsed ?? parsed;
    if (!base) return;
    // Merge inline edits
    const payload: ParseResult = {
      ...base,
      fecha: editFecha || base.fecha,
      hora: editHora || base.hora,
    };
    await executeAction(payload, eventId);
  }

  function reset() {
    setTexto('');
    setParsed(null);
    setEventos([]);
    setAlumnoData(null);
    setMensaje('');
    setEditFecha('');
    setEditHora('');
    setStep('idle');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  const confianzaColor =
    !parsed ? '' :
    parsed.confianza >= 0.9 ? 'text-green-600' :
    parsed.confianza >= 0.7 ? 'text-yellow-600' : 'text-red-500';

  // Compute effective fields for confirm card
  const efectivaFecha = editFecha || parsed?.fecha || '';
  const efectivaHora = editHora || parsed?.hora || '';

  const canExecute = parsed && parsed.accion !== 'desconocido' && (
    parsed.accion === 'cancelar_clase' ? !!parsed.alumno :
    parsed.accion === 'agendar_ficha' ? !!parsed.alumno :
    parsed.accion === 'consultar_alumno' ? !!parsed.alumno :
    parsed.accion === 'consultar_agenda' ? true :
    // mover_clase / nueva_ficha need alumno + fecha + hora
    !!(parsed.alumno && efectivaFecha && efectivaHora)
  );

  const needsFecha = parsed && !parsed.fecha && ['mover_clase', 'nueva_ficha'].includes(parsed.accion);
  const needsHora = parsed && !parsed.hora && ['mover_clase', 'nueva_ficha'].includes(parsed.accion);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-xl">←</Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Agenda NLP</h1>
            <p className="text-xs text-gray-400">
              Comandos en lenguaje natural
              {lastContext.alumno && (
                <span className="ml-2 text-blue-500">· contexto: {lastContext.alumno}</span>
              )}
            </p>
          </div>
          {lastContext.alumno && (
            <button
              onClick={() => setLastContext({})}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1"
            >
              Limpiar contexto
            </button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <label className="text-sm font-semibold text-gray-700">¿Qué necesitas hacer?</label>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onPaste={e => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text').replace(/[\r\n]+/g, ' ').trim();
              setTexto(pasted);
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
            placeholder={lastContext.alumno ? `Ej: muévela al viernes 4pm` : 'Ej: pásale a Juan al jueves 4pm'}
            rows={3}
            disabled={step !== 'idle' && step !== 'error'}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <div className="flex gap-2">
            <button
              onClick={listening ? stopVoice : startVoice}
              disabled={step !== 'idle' && step !== 'error'}
              className={`flex-none text-sm px-4 py-2 rounded-xl font-semibold transition-colors ${
                listening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-40`}
            >
              {listening ? '⏹ Detener' : '🎤 Voz'}
            </button>
            <button
              id="btn-analizar"
              onClick={handleParse}
              disabled={(step !== 'idle' && step !== 'error') || !texto.trim()}
              className="flex-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {step === 'parsing' ? 'Analizando…' : 'Analizar'}
            </button>
          </div>
        </div>

        {/* Confirmation card */}
        {step === 'confirm' && parsed && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">
                {ACCION_LABEL[parsed.accion] ?? parsed.accion}
              </span>
              <span className={`text-xs font-semibold ${confianzaColor}`}>
                {Math.round(parsed.confianza * 100)}% confianza
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm items-center">
              {parsed.alumno && (
                <>
                  <span className="text-gray-500">Alumno</span>
                  <span className="font-medium">{parsed.alumno}</span>
                </>
              )}
              {parsed.curso && (
                <>
                  <span className="text-gray-500">Curso</span>
                  <span className="font-medium">{parsed.curso}</span>
                </>
              )}
              {/* Fecha: parsed or inline picker */}
              <span className="text-gray-500">Fecha</span>
              {parsed.fecha ? (
                <span className="font-medium">{parsed.fecha}</span>
              ) : needsFecha ? (
                <input
                  type="date"
                  value={editFecha}
                  onChange={e => setEditFecha(e.target.value)}
                  className="text-sm border border-yellow-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-yellow-50"
                />
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              )}
              {/* Hora: parsed or inline picker */}
              <span className="text-gray-500">Hora</span>
              {parsed.hora ? (
                <span className="font-medium">{parsed.hora}</span>
              ) : needsHora ? (
                <input
                  type="time"
                  value={editHora}
                  onChange={e => setEditHora(e.target.value)}
                  className="text-sm border border-yellow-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-yellow-50"
                />
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              )}
            </div>

            {(needsFecha || needsHora) && (
              <p className="text-xs text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2">
                Completa {[needsFecha && 'la fecha', needsHora && 'la hora'].filter(Boolean).join(' y ')} para ejecutar.
              </p>
            )}

            {parsed.accion === 'desconocido' ? (
              <p className="text-xs text-gray-500 text-center">No se reconoció la acción. Intenta de nuevo.</p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-none text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEjecutar()}
                  disabled={!canExecute}
                  className="flex-1 text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
                >
                  Ejecutar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disambiguation */}
        {step === 'disambiguate' && eventos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Se encontraron varias clases. ¿Cuál?</p>
            {eventos.map((ev: Evento) => (
              <button
                key={ev.id}
                onClick={() => handleEjecutar(ev.id)}
                className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-4 py-3 text-sm transition-colors"
              >
                <span className="font-medium block">{ev.alumno}</span>
                <span className="text-gray-500 text-xs">{formatEventDate(ev.inicio)}</span>
              </button>
            ))}
            <button onClick={reset} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              Cancelar
            </button>
          </div>
        )}

        {/* Consulta resultados */}
        {step === 'consulta' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                {eventos.length > 0 ? `${eventos.length} clase${eventos.length > 1 ? 's' : ''} agendada${eventos.length > 1 ? 's' : ''}` : 'Sin clases'}
              </p>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">Nueva consulta</button>
            </div>
            {mensaje && eventos.length === 0 && (
              <p className="text-sm text-gray-500">{mensaje}</p>
            )}
            {eventos.map((ev: Evento) => (
              <div key={ev.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ev.alumno}</p>
                  <p className="text-xs text-gray-500">{formatEventDate(ev.inicio)}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setEditFecha(''); setEditHora(''); setStep('confirm'); }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold"
                  >
                    Mover
                  </button>
                  <button
                    onClick={() => handleEjecutar(ev.id, { accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] })}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consulta alumno */}
        {step === 'alumno' && alumnoData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">{alumnoData.inscripcion?.nombre ?? parsed?.alumno}</p>
                {alumnoData.inscripcion?.telefono && (
                  <a href={`tel:${alumnoData.inscripcion.telefono}`} className="text-xs text-blue-600">
                    {alumnoData.inscripcion.telefono}
                  </a>
                )}
              </div>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {alumnoData.inscripcion && (
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-gray-500">Curso</span>
                <span className="font-medium">{alumnoData.inscripcion.transmision}</span>
                {alumnoData.inscripcion.zona && (
                  <>
                    <span className="text-gray-500">Zona</span>
                    <span className="font-medium">{alumnoData.inscripcion.zona}</span>
                  </>
                )}
              </div>
            )}

            {alumnoData.ultimaFicha && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-800">Progreso</p>
                  <p className="text-xs text-blue-700 font-bold">
                    {alumnoData.ultimaFicha.completedCount}/{alumnoData.ultimaFicha.totalTopics} temas
                    ({Math.round(alumnoData.ultimaFicha.completedCount / alumnoData.ultimaFicha.totalTopics * 100)}%)
                  </p>
                </div>
                {alumnoData.ultimaFicha.pendingTopics.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-600 font-semibold mb-1">Pendientes:</p>
                    {alumnoData.ultimaFicha.pendingTopics.map((t: string) => (
                      <p key={t} className="text-xs text-blue-700">• {t}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {alumnoData.proximasClases.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Próximas clases</p>
                {alumnoData.proximasClases.map((ev: Evento) => (
                  <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-700">{formatEventDate(ev.inicio)}</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setEditFecha(''); setEditHora(''); setStep('confirm'); }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold"
                      >
                        Mover
                      </button>
                      <button
                        onClick={() => handleEjecutar(ev.id, { accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] })}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {alumnoData.proximasClases.length === 0 && !alumnoData.ultimaFicha && (
              <p className="text-xs text-gray-400 text-center">Sin clases próximas ni fichas de progreso.</p>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const nombre = alumnoData.inscripcion?.nombre ?? parsed?.alumno ?? '';
                  setTexto(`súbele las clases de ${nombre} al gc`);
                  reset();
                  setTimeout(() => {
                    setTexto(`súbele las clases de ${nombre} al gc`);
                    setStep('idle');
                  }, 60);
                }}
                className="flex-1 text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-xl font-semibold hover:bg-purple-200"
              >
                Subir al Calendar
              </button>
              <button
                onClick={() => {
                  const nombre = alumnoData.inscripcion?.nombre ?? parsed?.alumno ?? '';
                  setParsed({ accion: 'mover_clase', alumno: nombre, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] });
                  setEditFecha(''); setEditHora('');
                  setStep('confirm');
                }}
                className="flex-1 text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-xl font-semibold hover:bg-blue-200"
              >
                Mover próxima
              </button>
            </div>
          </div>
        )}

        {/* Executing */}
        {step === 'executing' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm text-gray-600">Ejecutando en Calendar…</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-semibold text-gray-900">{mensaje}</p>
            <button
              onClick={reset}
              className="text-sm bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700"
            >
              Nuevo comando
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">❌</span>
              <p className="text-sm text-red-700">{mensaje}</p>
            </div>
            <button
              onClick={() => setStep('idle')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Historial + Examples */}
        {step === 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
            {historial.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recientes</p>
                {historial.map((cmd: string) => (
                  <button
                    key={cmd}
                    onClick={() => setTexto(cmd)}
                    className="w-full text-left text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-colors flex items-center gap-2"
                  >
                    <span className="text-gray-400">↩</span>
                    <span>"{cmd}"</span>
                  </button>
                ))}
                <hr className="my-1 border-gray-100" />
              </>
            ) : null}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ejemplos</p>
            {[
              '¿Cómo va Luis Torres?',
              '¿Qué hay mañana?',
              'Pásale a Juan al jueves 4pm',
              'Ya no viene Roberto mañana',
              'Nuevo Pedro Ramírez, automático, sábado 9',
              'Súbele las clases de Luis al gc',
            ].map(ej => (
              <button
                key={ej}
                onClick={() => setTexto(ej)}
                className="w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                "{ej}"
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
