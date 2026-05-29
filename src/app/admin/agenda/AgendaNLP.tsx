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

export default function AgendaNLP() {
  const [texto, setTexto] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [alumnoData, setAlumnoData] = useState<AlumnoData | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  function startVoice() {
    const SR = window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Tu navegador no soporta reconocimiento de voz.'); return; }
    const rec = new SR();
    rec.lang = 'es-MX';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setTexto(prev => prev ? prev + ' ' + transcript : transcript);
    };
    rec.start();
    recognitionRef.current = rec;
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleParse() {
    if (!texto.trim()) return;
    setStep('parsing');
    setParsed(null);
    setEventos([]);
    setMensaje('');
    try {
      const res = await fetch('/api/agenda/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Error al parsear');
      const r: ParseResult = data.resultado;
      setParsed(r);
      const soloNombreRequerido = r.accion === 'cancelar_clase' || r.accion === 'agendar_ficha';
      const soloFechaRequerida = r.accion === 'consultar_agenda';
      const criticos = (!soloNombreRequerido && !soloFechaRequerida && !r.alumno) ||
        (!soloNombreRequerido && !soloFechaRequerida && !r.fecha && !r.hora);
      if (r.confianza >= 0.9 && !criticos && r.accion !== 'desconocido') {
        setStep('executing');
        const res2 = await fetch('/api/agenda/ejecutar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r),
        });
        const d2 = await res2.json();
        if (!d2.ok) {
          if (d2.error === 'multiple' && d2.eventos) { setEventos(d2.eventos); setStep('disambiguate'); return; }
          throw new Error(d2.error ?? 'Error al ejecutar');
        }
        if (d2.consulta) { setEventos(d2.eventos ?? []); setMensaje(d2.mensaje ?? ''); setStep('consulta'); return; }
        if (d2.alumno) { setAlumnoData(d2.data); setStep('alumno'); return; }
        setMensaje(d2.mensaje ?? 'Listo');
        setStep('done');
      } else {
        setStep('confirm');
      }
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error');
      setStep('error');
    }
  }

  async function handleEjecutar(eventId?: string) {
    if (!parsed) return;
    setStep('executing');
    try {
      const res = await fetch('/api/agenda/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed, eventId }),
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
      if (data.consulta) { setEventos(data.eventos ?? []); setMensaje(data.mensaje ?? ''); setStep('consulta'); return; }
      if (data.alumno) { setAlumnoData(data.data); setStep('alumno'); return; }
      setMensaje(data.mensaje ?? 'Listo');
      setStep('done');
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error');
      setStep('error');
    }
  }

  function reset() {
    setTexto('');
    setParsed(null);
    setEventos([]);
    setAlumnoData(null);
    setMensaje('');
    setStep('idle');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  const confianzaColor =
    !parsed ? '' :
    parsed.confianza >= 0.8 ? 'text-green-600' :
    parsed.confianza >= 0.5 ? 'text-yellow-600' : 'text-red-500';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-xl">←</Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Agenda NLP</h1>
            <p className="text-xs text-gray-400">Comandos en lenguaje natural</p>
          </div>
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
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
            placeholder="Ej: pásale a Juan al jueves 4pm"
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

            <div className="grid grid-cols-2 gap-y-2 text-sm">
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
              {parsed.fecha && (
                <>
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">{parsed.fecha}</span>
                </>
              )}
              {parsed.hora && (
                <>
                  <span className="text-gray-500">Hora</span>
                  <span className="font-medium">{parsed.hora}</span>
                </>
              )}
            </div>

            {parsed.falta_info.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800 font-semibold mb-1">Falta información:</p>
                <p className="text-xs text-yellow-700">{parsed.falta_info.join(', ')}</p>
              </div>
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
                  disabled={
                    !parsed.alumno ||
                    (parsed.accion !== 'cancelar_clase' && parsed.accion !== 'agendar_ficha' && (!parsed.fecha || !parsed.hora))
                  }
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
            {eventos.map(ev => (
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
            {eventos.map(ev => (
              <div key={ev.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ev.alumno}</p>
                  <p className="text-xs text-gray-500">{formatEventDate(ev.inicio)}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setStep('confirm'); }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold"
                  >
                    Mover
                  </button>
                  <button
                    onClick={async () => { setParsed({ accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] }); await handleEjecutar(ev.id); }}
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
                    {alumnoData.ultimaFicha.pendingTopics.map(t => (
                      <p key={t} className="text-xs text-blue-700">• {t}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {alumnoData.proximasClases.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Próximas clases</p>
                {alumnoData.proximasClases.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-700">{formatEventDate(ev.inicio)}</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setParsed({ accion: 'mover_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: ['fecha', 'hora'] }); setStep('confirm'); }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold"
                      >
                        Mover
                      </button>
                      <button
                        onClick={async () => { setParsed({ accion: 'cancelar_clase', alumno: ev.alumno, curso: null, fecha: null, hora: null, confianza: 1, falta_info: [] }); await handleEjecutar(ev.id); }}
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

        {/* Examples */}
        {step === 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
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
