'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
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

// Las clases viven en `aea.css`, junto a las de la ficha que ve el alumno:
// quien captura y quien recibe ven el mismo sistema.
const TARJETA = 'panel';
const CUERPO = 'p-4 space-y-3';

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
      <div className="panel">
        <div className={`estado ${reservada ? 'estado-verde' : 'estado-ambar'}`}>
          <span className={`testigo ${reservada ? 't-verde' : 't-ambar'}`} aria-hidden />
          {reservada ? 'Ficha reservada' : 'Ficha creada'}
        </div>
        <div className="cuerpo">
          <p className="texto">Se le mandó el enlace al alumno por WhatsApp.</p>
          {!reservada && resultado.faltantes.length > 0 && (
            <p className="aviso-ambar" style={{ marginTop: '0.5rem' }}>
              Falta: {resultado.faltantes.join(', ')}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
            {resultado.url && (
              <a className="plata" href={resultado.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="ico" aria-hidden />
                Abrir la ficha
              </a>
            )}
            <button className="secundario" onClick={otra}>Capturar otra</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={TARJETA}>
        <div className={CUERPO}>
        <p className="paso"><span className="paso-n">01</span> Datos del alumno</p>
        <div>
          <label className="et">Nombre completo</label>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez García" />
        </div>
        <div>
          <label className="et">WhatsApp (10 dígitos)</label>
          <input className="campo" value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="numeric" placeholder="5512345678" />
          <p className="nota-chica" style={{ marginTop: '0.35rem' }}>Ahí le llega su ficha.</p>
        </div>
        <div>
          <label className="et">Dirección / punto de encuentro</label>
          <input className="campo" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Calle Puebla 345, Col. Roma" />
        </div>
        </div>
      </div>

      {hayAlumno && (
      <div className={TARJETA}>
        <div className={CUERPO}>
        <p className="paso"><span className="paso-n">02</span> Transmisión</p>
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
                aria-pressed={activo}
                className={`opcion${activo ? ' opcion-on' : ''}`}
              >
                <span className="opcion-tit">{c.nombre}</span>
                <span className="opcion-pie">${c.total.toLocaleString('es-MX')}</span>
              </button>
            );
          })}
        </div>

        {/* Los demás cursos existen, pero no compiten con la decisión de arriba. */}
        <details>
          <summary className="nota-chica" style={{ cursor: 'pointer', color: 'var(--liga)' }}>Otro curso (moto, inglés, intensivo…)</summary>
          <select className="campo" style={{ marginTop: '0.5rem' }} value={otros.some((c) => c.nombre === curso) ? curso : ''} onChange={(e) => setCurso(e.target.value)}>
            <option value="">— Ninguno —</option>
            {otros.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.nombre} — ${c.total.toLocaleString('es-MX')}
              </option>
            ))}
          </select>
        </details>

        {elegido && (
          <p className="nota-chica">
            {elegido.nombre} · apartado <strong>${elegido.deposito.toLocaleString('es-MX')}</strong> · saldo ${(elegido.total - elegido.deposito).toLocaleString('es-MX')}
          </p>
        )}
        </div>
      </div>
      )}

      {verDias && (
      <div className={TARJETA}>
        <div className={CUERPO}>
        <p className="paso"><span className="paso-n">03</span> Días y hora</p>

        <div className="grid grid-cols-3 gap-2">
          {PATRONES.map((p) => {
            const activo = patron === p.valor;
            return (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPatron(p.valor)}
                aria-pressed={activo}
                className={`opcion${activo ? ' opcion-on' : ''}`}
                style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}
              >
                <span className="opcion-tit" style={{ fontSize: '0.75rem' }}>{p.etiqueta}</span>
                <span className="opcion-pie">{p.dias}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="et">Primera clase</label>
          <input type="date" className="campo" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>

        <div>
          <label className="et">Hora</label>
          <div className="flex gap-2 flex-wrap">
            {HORARIOS_INICIO.map((h) => {
              const activo = hora === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  aria-pressed={activo}
                  className={`opcion${activo ? ' opcion-on' : ''}`}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 600 }}
                >
                  {horaCorta(h)}
                </button>
              );
            })}
          </div>
        </div>

        {clases.length > 0 && (
          <div className="hueco" style={{ padding: '0.75rem' }}>
            {clases.map((c, i) => (
              <p key={i} className="texto" style={{ fontSize: '0.8125rem' }}>
                <span className="mono" style={{ color: 'var(--liga)' }}>{i + 1}.</span> {c.label} · {horaCorta(c.time)}
              </p>
            ))}
          </div>
        )}
        </div>
      </div>
      )}

      {verCobro && (
      <div className={TARJETA}>
        <div className={CUERPO}>
        <p className="paso"><span className="paso-n">04</span> Apartado ya pagado</p>
        <input className="campo" value={apartado} onChange={(e) => setApartado(e.target.value)}
          inputMode="numeric" placeholder={elegido ? String(elegido.deposito) : 'Monto que ya entró'} />
        <p className="nota-chica">
          Sólo si ya lo viste en la cuenta —transferencia o depósito en {TIENDAS}—. Si todavía
          no entra, déjalo vacío: la ficha le muestra los datos de pago al alumno y se marca
          sola cuando manda el comprobante.
        </p>
        {elegido && apartado !== '' && Number(apartado) < elegido.deposito && (
          <p className="aviso-ambar">
            Menos del apartado (${elegido.deposito.toLocaleString('es-MX')}): la ficha queda pendiente.
          </p>
        )}
        <div>
          <label className="et">Nota (opcional)</label>
          <textarea className="campo" rows={2} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Pidió horario matutino, ya manejó antes…" />
        </div>
        </div>
      </div>
      )}

      {error && (
        <p className="aviso-rojo" role="status">{error}</p>
      )}

      {verCobro && (
        <button className="plata" onClick={crear} disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear ficha y mandarla al alumno'}
        </button>
      )}
    </div>
  );
}
