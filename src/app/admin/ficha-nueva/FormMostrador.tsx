'use client';

import { useState } from 'react';

type CursoOpt = { nombre: string; total: number; deposito: number };
type Slot = { date: string; time: string };
type Resultado = {
  url: string | null;
  estado: string;
  faltantes: string[];
  deposito: number;
  apartado: number;
};

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(148,163,184,0.25)',
};

const INPUT =
  'w-full rounded-xl px-3 py-2.5 text-sm bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500';

const LABEL = 'block text-xs font-semibold uppercase tracking-wide mb-1';

export default function FormMostrador({ cursos }: { cursos: CursoOpt[] }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [curso, setCurso] = useState('');
  const [slots, setSlots] = useState<Slot[]>([{ date: '', time: '' }, { date: '', time: '' }]);
  const [apartado, setApartado] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const elegido = cursos.find((c) => c.nombre === curso) ?? null;

  function setSlot(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function crear() {
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/ficha/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          zona,
          curso,
          fechas: slots.filter((s) => s.date && s.time),
          apartado: apartado ? Number(apartado) : 0,
          nota,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? 'No se pudo crear la ficha');
        return;
      }
      setResultado(json as Resultado);
    } catch {
      setError('Sin conexión');
    } finally {
      setEnviando(false);
    }
  }

  function otra() {
    setNombre(''); setTelefono(''); setZona(''); setCurso('');
    setSlots([{ date: '', time: '' }, { date: '', time: '' }]);
    setApartado(''); setNota(''); setResultado(null); setError('');
  }

  // Ya creada: lo único que queda por hacer es abrirla. El alumno ya la tiene en
  // su WhatsApp — se la manda guardarFicha al crearse.
  if (resultado) {
    const reservada = resultado.estado === 'reservada';
    return (
      <div className="rounded-2xl p-6 text-center" style={CARD}>
        <p className="text-2xl mb-2">{reservada ? '✅' : '🟡'}</p>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#1e293b' }}>
          {reservada ? 'Ficha reservada' : 'Ficha creada'}
        </h2>
        <p className="text-sm mb-1" style={{ color: '#475569' }}>
          Se le mandó el enlace al alumno por WhatsApp.
        </p>
        {!reservada && resultado.faltantes.length > 0 && (
          <p className="text-xs mb-4" style={{ color: '#d97706' }}>
            Falta: {resultado.faltantes.join(', ')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          {resultado.url && (
            <a href={resultado.url} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              📋 Abrir ficha
            </a>
          )}
          <button onClick={otra}
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(148,163,184,0.15)', color: '#475569' }}>
            Capturar otra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>01 · Datos del alumno</p>
        <div>
          <label className={LABEL} style={{ color: '#475569' }}>Nombre completo</label>
          <input className={INPUT} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez García" />
        </div>
        <div>
          <label className={LABEL} style={{ color: '#475569' }}>WhatsApp (10 dígitos)</label>
          <input className={INPUT} value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="numeric" placeholder="5512345678" />
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Ahí le llega su ficha.</p>
        </div>
        <div>
          <label className={LABEL} style={{ color: '#475569' }}>Dirección / punto de encuentro</label>
          <input className={INPUT} value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Calle Puebla 345, Col. Roma" />
        </div>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>02 · Curso</p>
        <select className={INPUT} value={curso} onChange={(e) => setCurso(e.target.value)}>
          <option value="">— Selecciona un curso —</option>
          {cursos.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.nombre} — ${c.total.toLocaleString('es-MX')}
            </option>
          ))}
        </select>
        {elegido && (
          <p className="text-xs" style={{ color: '#64748b' }}>
            Apartado del curso: <strong style={{ color: '#2563eb' }}>${elegido.deposito.toLocaleString('es-MX')}</strong> (20%, mínimo $690)
          </p>
        )}
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>03 · Sesiones</p>
        {slots.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs w-4 shrink-0" style={{ color: '#64748b' }}>{i + 1}.</span>
            <input type="date" className={INPUT} value={s.date} onChange={(e) => setSlot(i, { date: e.target.value })} />
            <input type="time" className={INPUT} value={s.time} onChange={(e) => setSlot(i, { time: e.target.value })} />
            {slots.length > 1 && (
              <button onClick={() => setSlots((prev) => prev.filter((_, j) => j !== i))}
                className="text-xs px-2 py-1 shrink-0" style={{ color: '#94a3b8' }} title="Quitar sesión">✕</button>
            )}
          </div>
        ))}
        {slots.length < 8 && (
          <button onClick={() => setSlots((prev) => [...prev, { date: '', time: '' }])}
            className="text-xs font-medium" style={{ color: '#2563eb' }}>+ Agregar sesión</button>
        )}
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>04 · Cobrado hoy</p>
        <input className={INPUT} value={apartado} onChange={(e) => setApartado(e.target.value)}
          inputMode="numeric" placeholder={elegido ? String(elegido.deposito) : 'Monto en efectivo o transferencia'} />
        {elegido && apartado !== '' && Number(apartado) < elegido.deposito && (
          <p className="text-xs" style={{ color: '#d97706' }}>
            Menos del apartado (${elegido.deposito.toLocaleString('es-MX')}): la ficha queda pendiente.
          </p>
        )}
        <div>
          <label className={LABEL} style={{ color: '#475569' }}>Nota (opcional)</label>
          <textarea className={INPUT} rows={2} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Pidió horario matutino, ya manejó antes…" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: '#dc2626' }}>{error}</p>
      )}

      <button onClick={crear} disabled={enviando}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
        {enviando ? 'Creando…' : 'Crear ficha y mandarla al alumno'}
      </button>
    </div>
  );
}
