'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Creada, type Resultado } from './Creada';
import { TIENDAS } from '@/lib/cuenta';
import { horaCorta } from '@/lib/patron-fechas';

type Clase = { date: string; time: string };

// Cada clase se escoge sola: cualquier día, a cualquier hora en punto. Antes
// se capturaba un patrón —lunes a jueves, martes a viernes o fin de semana— y
// de ahí salían las cuatro; servía para lo que vende Luz, pero en el mostrador
// se acuerda fecha por fecha y lo que no cabía en un patrón no se podía capturar.
const HORAS = Array.from({ length: 13 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
const MAX_CLASES = 12;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
/** "martes": se ve junto a la fecha, que es lo que evita capturar un lunes cuando se acordó un martes. */
function diaDe(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return y && m && d ? DIAS[new Date(y, m - 1, d).getDay()] : '';
}

type CursoOpt = { nombre: string; total: number; deposito: number };


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
  const [filas, setFilas] = useState<Clase[]>([{ date: '', time: '' }]);
  const [apartado, setApartado] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const router = useRouter();
  const [leyendo, setLeyendo] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  // Llenar desde una foto. Era una pantalla aparte —«Importar ficha»— con su
  // propio formulario y su propio camino: agendaba directo en Calendar y la
  // ficha que dejaba no era la misma que ésta. Ahora la foto sólo ahorra el
  // tecleo; lo que se revisa, se guarda y se manda es esta misma ficha.
  async function leerFoto(file: File) {
    setError('');
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es muy grande (máximo 10 MB)');
      return;
    }
    setLeyendo(true);
    try {
      const dataUrl = await new Promise<string>((ok, mal) => {
        const r = new FileReader();
        r.onload = () => ok(String(r.result));
        r.onerror = () => mal(r.error);
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/importar-ficha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg' }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? 'No se pudo leer la foto');
        return;
      }
      const d = json.data ?? {};
      setNombre(String(d.nombre ?? ''));
      setTelefono(String(d.telefono ?? '').replace(/\D/g, '').slice(-10));
      setZona(String(d.direccion ?? ''));
      setNota(String(d.notas ?? ''));
      // El curso sólo si es uno de los de aquí; si no, se elige a mano.
      const nombres = [...transmisiones, ...otros].map((c) => c.nombre);
      setCurso(nombres.find((n) => n === d.curso) ?? nombres.find((n) => n === d.transmision) ?? '');
      const leidas: Clase[] = (Array.isArray(d.fechas) ? d.fechas : [])
        .map((f: { date?: string; time?: string }) => ({
          date: /^\d{4}-\d{2}-\d{2}$/.test(String(f?.date ?? '')) ? String(f.date) : '',
          // Una hora que no es en punto se deja vacía para que se escoja, no se redondea.
          time: HORAS.includes(String(f?.time ?? '')) ? String(f.time) : '',
        }))
        .filter((f: Clase) => f.date)
        .slice(0, MAX_CLASES);
      const completas = leidas.length > 0 && leidas.every((f) => f.time);
      setFilas(
        leidas.length === 0
          ? [{ date: '', time: '' }]
          : completas && leidas.length < MAX_CLASES
            ? [...leidas, { date: '', time: leidas[leidas.length - 1].time }]
            : leidas
      );
    } catch {
      setError('No se pudo leer la foto');
    } finally {
      setLeyendo(false);
      if (fotoRef.current) fotoRef.current.value = '';
    }
  }

  const elegido = [...transmisiones, ...otros].find((c) => c.nombre === curso) ?? null;

  // Las que ya tienen día y hora. La fila de abajo, a medio llenar, no cuenta.
  const clases = filas.filter((f) => f.date && f.time);

  // La siguiente fila se abre sola cuando la anterior queda completa, con la
  // misma hora: lo normal es que todas vayan a la misma, y si no, se cambia.
  function cambiar(i: number, parche: Partial<Clase>) {
    setFilas((prev) => {
      const sig = prev.map((f, j) => (j === i ? { ...f, ...parche } : f));
      const ultima = sig[sig.length - 1];
      if (ultima.date && ultima.time && sig.length < MAX_CLASES) {
        sig.push({ date: '', time: ultima.time });
      }
      return sig;
    });
  }

  function quitar(i: number) {
    setFilas((prev) => {
      const sig = prev.filter((_, j) => j !== i);
      const ultima = sig[sig.length - 1];
      if (!ultima || (ultima.date && ultima.time)) sig.push({ date: '', time: ultima?.time ?? '' });
      return sig;
    });
  }

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
          fechas: clases,
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
      // En el dashboard, que la ficha nueva aparezca en «Fichas recientes».
      router.refresh();
    } catch {
      setError('Sin conexión');
    } finally {
      setEnviando(false);
    }
  }

  function otra() {
    setNombre(''); setTelefono(''); setZona(''); setCurso('');
    setFilas([{ date: '', time: '' }]);
    setApartado(''); setNota(''); setResultado(null); setError('');
  }

  // Ya creada. La pantalla vive en `Creada.tsx`: sin sacarla no hay forma de
  // verla sin capturar una ficha de verdad en producción.
  if (resultado) return <Creada resultado={resultado} alumno={nombre} onOtra={otra} />;

  return (
    <div className="space-y-3">
      <div className={TARJETA}>
        <div className={CUERPO}>
        <p className="paso"><span className="paso-n">01</span> Datos del alumno</p>
        <input
          ref={fotoRef}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) leerFoto(f); }}
        />
        <button
          type="button"
          className="nota-chica"
          style={{ color: 'var(--liga)', cursor: 'pointer' }}
          onClick={() => fotoRef.current?.click()}
          disabled={leyendo}
        >
          {leyendo ? 'Leyendo la foto…' : '📷 Llenar desde una foto de la ficha'}
        </button>
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
        <p className="paso"><span className="paso-n">03</span> Clases</p>

        {filas.map((f, i) => {
          const completa = !!(f.date && f.time);
          return (
            <div key={i}>
              <label className="et">
                Clase {i + 1}{f.date ? ` · ${diaDe(f.date)}` : ''}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="campo"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  value={f.date}
                  onChange={(e) => cambiar(i, { date: e.target.value })}
                  aria-label={`Fecha de la clase ${i + 1}`}
                />
                <select
                  className="campo"
                  style={{ flex: '0 0 6.5rem' }}
                  value={f.time}
                  onChange={(e) => cambiar(i, { time: e.target.value })}
                  aria-label={`Hora de la clase ${i + 1}`}
                >
                  <option value="">Hora</option>
                  {HORAS.map((h) => (
                    <option key={h} value={h}>{horaCorta(h)}</option>
                  ))}
                </select>
                {(completa || filas.length > 1) && (
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    aria-label={`Quitar la clase ${i + 1}`}
                    className="nota-chica"
                    style={{ padding: '0.5rem', color: 'var(--liga)' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {clases.length > 0 && (
          <p className="nota-chica">
            {clases.length} clase{clases.length !== 1 ? 's' : ''} capturada{clases.length !== 1 ? 's' : ''}.
          </p>
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
          no entra, déjalo vacío: la ficha le muestra los datos de pago al alumno y queda
          reservada cuando confirmes su comprobante.
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
