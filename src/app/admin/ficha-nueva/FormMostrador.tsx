'use client';

import { useState } from 'react';
import { TIENDAS } from '@/lib/cuenta';
import { PATRONES, HORARIOS_INICIO, calcularFechas, horaCorta, type Patron } from '@/lib/patron-fechas';

type CursoOpt = { nombre: string; total: number; deposito: number };
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

export default function FormMostrador({
  transmisiones,
  otros,
}: {
  transmisiones: CursoOpt[];
  otros: CursoOpt[];
}) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [curso, setCurso] = useState('');
  const [patron, setPatron] = useState<Patron | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [hora, setHora] = useState('');
  const [apartado, setApartado] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const elegido = [...transmisiones, ...otros].find((c) => c.nombre === curso) ?? null;

  // Las cuatro clases, en cuanto están las tres respuestas: se ven antes de
  // guardar, que es lo que evita capturar un lunes cuando se acordó un martes.
  const clases = patron && fechaInicio && hora ? calcularFechas(patron, fechaInicio, hora) : [];

  // Los pasos se abren solos, uno a uno. Un formulario con todo a la vista se
  // ve como trámite; así se ve como una conversación, que es como se captura en
  // el mostrador: primero quién es, luego en qué maneja, luego cuándo.
  const hayAlumno = nombre.trim().length > 2 && telefono.replace(/\D/g, '').length >= 10;
  const verDias = hayAlumno && !!curso;
  const verCobro = verDias && clases.length > 0;

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
          patron,
          fechaInicio,
          hora,
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
    setPatron(''); setFechaInicio(''); setHora('');
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

      {hayAlumno && (
      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>02 · Transmisión</p>
        {/* Una sola: o estándar o automático. Es la decisión del alumno, y el
            curso queda definido con ella. */}
        <div className="grid grid-cols-2 gap-2">
          {transmisiones.map((c) => {
            const activo = curso === c.nombre;
            return (
              <button
                key={c.nombre}
                type="button"
                onClick={() => setCurso(c.nombre)}
                className="rounded-xl px-3 py-3 text-left transition-all"
                style={{
                  background: activo ? 'rgba(37,99,235,0.08)' : 'white',
                  border: `1px solid ${activo ? '#2563eb' : 'rgba(148,163,184,0.35)'}`,
                }}
              >
                <span className="block text-sm font-bold" style={{ color: activo ? '#1d4ed8' : '#1e293b' }}>
                  {c.nombre}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: '#64748b' }}>
                  ${c.total.toLocaleString('es-MX')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Los demás cursos existen, pero no compiten con la decisión de arriba. */}
        <details>
          <summary className="text-xs cursor-pointer" style={{ color: '#2563eb' }}>Otro curso (moto, inglés, intensivo…)</summary>
          <select className={`${INPUT} mt-2`} value={otros.some((c) => c.nombre === curso) ? curso : ''} onChange={(e) => setCurso(e.target.value)}>
            <option value="">— Ninguno —</option>
            {otros.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.nombre} — ${c.total.toLocaleString('es-MX')}
              </option>
            ))}
          </select>
        </details>

        {elegido && (
          <p className="text-xs" style={{ color: '#64748b' }}>
            {elegido.nombre} · apartado <strong style={{ color: '#2563eb' }}>${elegido.deposito.toLocaleString('es-MX')}</strong> · saldo ${(elegido.total - elegido.deposito).toLocaleString('es-MX')}
          </p>
        )}
      </div>
      )}

      {verDias && (
      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>03 · Días y hora</p>

        <div className="grid grid-cols-3 gap-2">
          {PATRONES.map((p) => {
            const activo = patron === p.valor;
            return (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPatron(p.valor)}
                className="rounded-xl px-2 py-2.5 transition-all"
                style={{
                  background: activo ? 'rgba(37,99,235,0.08)' : 'white',
                  border: `1px solid ${activo ? '#2563eb' : 'rgba(148,163,184,0.35)'}`,
                }}
              >
                <span className="block text-xs font-bold" style={{ color: activo ? '#1d4ed8' : '#1e293b' }}>
                  {p.etiqueta}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: '#64748b' }}>{p.dias}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className={LABEL} style={{ color: '#475569' }}>Primera clase</label>
          <input type="date" className={INPUT} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>

        <div>
          <label className={LABEL} style={{ color: '#475569' }}>Hora</label>
          <div className="flex gap-2 flex-wrap">
            {HORARIOS_INICIO.map((h) => {
              const activo = hora === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: activo ? 'rgba(37,99,235,0.08)' : 'white',
                    color: activo ? '#1d4ed8' : '#475569',
                    border: `1px solid ${activo ? '#2563eb' : 'rgba(148,163,184,0.35)'}`,
                  }}
                >
                  {horaCorta(h)}
                </button>
              );
            })}
          </div>
        </div>

        {clases.length > 0 && (
          <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
            {clases.map((c, i) => (
              <p key={i} className="text-xs" style={{ color: '#334155' }}>
                <span className="font-semibold" style={{ color: '#1d4ed8' }}>{i + 1}.</span> {c.label} · {horaCorta(c.time)}
              </p>
            ))}
          </div>
        )}
      </div>
      )}

      {verCobro && (
      <div className="rounded-2xl p-4 space-y-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>04 · Apartado ya pagado</p>
        <input className={INPUT} value={apartado} onChange={(e) => setApartado(e.target.value)}
          inputMode="numeric" placeholder={elegido ? String(elegido.deposito) : 'Monto que ya entró'} />
        <p className="text-xs" style={{ color: '#64748b' }}>
          Sólo si ya lo viste en la cuenta —transferencia o depósito en {TIENDAS}—. Si todavía
          no entra, déjalo vacío: la ficha le muestra los datos de pago al alumno y se marca
          sola cuando manda el comprobante.
        </p>
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
      )}

      {error && (
        <p className="text-sm text-center" style={{ color: '#dc2626' }}>{error}</p>
      )}

      {verCobro && (
        <button onClick={crear} disabled={enviando}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
          {enviando ? 'Creando…' : 'Crear ficha y mandarla al alumno'}
        </button>
      )}
    </div>
  );
}
