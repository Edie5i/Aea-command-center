'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

type FechaRow = { date: string; time: string };

type FichaData = {
  nombre: string;
  telefono: string;
  curso: string;
  transmision: string;
  direccion: string;
  notas: string;
  fechas: FechaRow[];
};

type Stage = 'upload' | 'review' | 'done';

const HORARIOS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00'];

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 16,
};

const INPUT = "w-full text-sm rounded-xl px-3 py-2 outline-none transition-all placeholder:text-slate-600";
const INPUT_STYLE: React.CSSProperties = { background: '#1e293b', border: '1px solid #334155', color: 'white' };

export default function ImportarFichaPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [data, setData] = useState<FichaData>({
    nombre: '', telefono: '', curso: '', transmision: 'Automático',
    direccion: '', notas: '', fechas: [],
  });
  const [calResult, setCalResult] = useState<{ created: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    setError('');

    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`El archivo es muy grande (máximo ${maxMb} MB)`);
      return;
    }

    const mimeType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];

      setLoading(true);
      try {
        const res = await fetch('/api/admin/importar-ficha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? 'Error al extraer datos');
        setData({ ...json.data, fechas: json.data.fechas ?? [] });
        setStage('review');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function updateField(key: keyof FichaData, value: string) {
    setData((prev: FichaData) => ({ ...prev, [key]: value }));
  }

  function updateFecha(i: number, field: 'date' | 'time', value: string) {
    setData((prev: FichaData) => {
      const fechas = [...prev.fechas];
      fechas[i] = { ...fechas[i], [field]: value };
      return { ...prev, fechas };
    });
  }

  function addFecha() {
    setData((prev: FichaData) => ({ ...prev, fechas: [...prev.fechas, { date: '', time: '10:00' }] }));
  }

  function removeFecha(i: number) {
    setData((prev: FichaData) => ({ ...prev, fechas: prev.fechas.filter((_: FechaRow, idx: number) => idx !== i) }));
  }

  async function handleConfirm() {
    if (!data.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    const fechasValidas = data.fechas.filter((f: FechaRow) => f.date && f.time);
    if (fechasValidas.length === 0) { setError('Agrega al menos una fecha con horario'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ficha/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.nombre,
          phone: data.telefono || '—',
          address: data.direccion || 'Torreón 49, Roma Sur',
          transmission: data.transmision,
          notes: data.notas || undefined,
          dates: fechasValidas.map((f: FechaRow) => ({
            date: new Date(f.date + 'T12:00:00').toISOString(),
            time: f.time,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Error al agendar');
      // Los que ya existían cuentan como logrados: si no, el candado de
      // duplicados haría que la pantalla reportara "algunos fallaron".
      setCalResult({
        created: (json.created ?? 0) + (json.omitidos ?? 0),
        total: json.total ?? fechasValidas.length,
      });
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear eventos');
    } finally {
      setLoading(false);
    }
  }

  const fechasValidas = data.fechas.filter((f: FechaRow) => f.date && f.time);

  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(8px)' }}>
        <Link href="/admin" className="text-sm transition-colors" style={{ color: '#475569' }}>← Admin</Link>
        <h1 className="text-base font-bold text-white">Importar ficha</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Upload zone */}
        {stage === 'upload' && (
          <div
            className="rounded-2xl p-10 text-center cursor-pointer transition-all"
            style={{
              background: 'rgba(30,41,59,0.5)',
              border: '2px dashed rgba(148,163,184,0.2)',
            }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {loading ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: '#475569' }}>Analizando ficha con IA…</p>
              </div>
            ) : (
              <>
                <p className="text-4xl mb-3">📄</p>
                <p className="font-semibold text-white mb-1">Sube la ficha aquí</p>
                <p className="text-sm" style={{ color: '#475569' }}>Foto desde WhatsApp, captura de pantalla o PDF</p>
                <p className="text-xs mt-3" style={{ color: '#334155' }}>JPG · PNG · WEBP · PDF · máx 10 MB</p>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Review */}
        {stage === 'review' && (
          <>
            {preview && preview.startsWith('data:image') && (
              <div className="rounded-2xl overflow-hidden" style={CARD}>
                <img src={preview} alt="Ficha" className="w-full max-h-48 object-contain"
                  style={{ background: 'rgba(15,23,42,0.6)' }} />
              </div>
            )}

            <div className="overflow-hidden" style={CARD}>
              {/* Ficha header */}
              <div className="px-4 pt-4 pb-3"
                style={{ background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#60a5fa' }}>Ficha de</p>
                <p className="text-xl font-bold text-white">{data.nombre || '—'}</p>
                <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{data.curso} · {data.fechas.filter((f: FechaRow) => f.date).length} sesiones</p>
              </div>

              <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
                <p className="text-xs" style={{ color: '#334155' }}>Revisa y corrige antes de agendar</p>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Nombre completo</label>
                  <input type="text" value={data.nombre} onChange={e => updateField('nombre', e.target.value)}
                    className={INPUT} style={INPUT_STYLE} />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Teléfono</label>
                  <input type="tel" value={data.telefono} onChange={e => updateField('telefono', e.target.value)}
                    className={INPUT} style={INPUT_STYLE} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Curso</label>
                    <input type="text" value={data.curso} onChange={e => updateField('curso', e.target.value)}
                      className={INPUT} style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Transmisión</label>
                    <select value={data.transmision} onChange={e => updateField('transmision', e.target.value)}
                      className={INPUT} style={{ ...INPUT_STYLE, appearance: 'none' as const }}>
                      <option>Automático</option>
                      <option>Estándar</option>
                      <option>Moto</option>
                      <option>Mixto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Punto de encuentro</label>
                  <input type="text" value={data.direccion} onChange={e => updateField('direccion', e.target.value)}
                    placeholder="Ej. Torreón 49, Roma Sur"
                    className={INPUT} style={INPUT_STYLE} />
                </div>

                {/* Fechas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>Fechas y horarios</label>
                    <button type="button" onClick={addFecha}
                      className="text-xs font-semibold transition-colors" style={{ color: '#60a5fa' }}>
                      + Agregar fecha
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.fechas.length === 0 && (
                      <p className="text-sm text-center py-3 rounded-xl"
                        style={{ color: '#334155', border: '1px dashed rgba(148,163,184,0.15)', background: 'rgba(148,163,184,0.04)' }}>
                        No se detectaron fechas — agrega manualmente
                      </p>
                    )}
                    {data.fechas.map((f: FechaRow, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="date" value={f.date} onChange={e => updateFecha(i, 'date', e.target.value)}
                          className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
                          style={INPUT_STYLE} />
                        <select value={f.time} onChange={e => updateFecha(i, 'time', e.target.value)}
                          className="text-sm rounded-xl px-3 py-2 outline-none"
                          style={{ ...INPUT_STYLE, appearance: 'none' as const }}>
                          {HORARIOS.map(h => <option key={h}>{h}</option>)}
                        </select>
                        <button type="button" onClick={() => removeFecha(i)}
                          className="text-lg font-bold leading-none transition-colors"
                          style={{ color: '#334155' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {data.notas && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#475569' }}>Notas</label>
                    <input type="text" value={data.notas} onChange={e => updateField('notas', e.target.value)}
                      className={INPUT} style={INPUT_STYLE} />
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 flex gap-3">
                <button type="button"
                  onClick={() => { setStage('upload'); setPreview(''); setError(''); }}
                  className="flex-none text-sm font-semibold px-4 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                  Cambiar imagen
                </button>
                <button type="button" onClick={handleConfirm} disabled={loading}
                  className="flex-1 text-sm font-semibold py-3 rounded-xl text-white disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}>
                  {loading ? 'Agendando…' : `Agendar ${fechasValidas.length} sesión${fechasValidas.length !== 1 ? 'es' : ''} en Calendar`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Done */}
        {stage === 'done' && (
          <div className="p-8 text-center" style={CARD}>
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-white mb-1">{data.nombre}</h2>
            <p className="text-sm mb-3" style={{ color: '#475569' }}>{data.telefono}</p>

            {calResult && calResult.created === calResult.total ? (
              <p className="text-sm font-semibold mb-5" style={{ color: '#34d399' }}>
                {calResult.created} de {calResult.total} evento{calResult.total !== 1 ? 's' : ''} creados en Google Calendar ✓
              </p>
            ) : (
              <p className="text-sm font-semibold mb-5" style={{ color: '#f59e0b' }}>
                {calResult?.created} de {calResult?.total} evento{calResult?.total !== 1 ? 's' : ''} creados — algunos fallaron
              </p>
            )}

            <div className="space-y-1 mb-6 text-left rounded-xl p-4"
              style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}>
              {data.fechas.filter((f: FechaRow) => f.date && f.time).map((f: FechaRow, i: number) => (
                <p key={i} className="text-sm" style={{ color: '#64748b' }}>
                  {i + 1}. {formatDate(f.date)} · {f.time}
                </p>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStage('upload'); setData({ nombre:'',telefono:'',curso:'',transmision:'Automático',direccion:'',notas:'',fechas:[] }); setPreview(''); setError(''); setCalResult(null); }}
                className="flex-1 text-sm font-semibold py-3 rounded-xl transition-all"
                style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                Importar otra ficha
              </button>
              <Link href="/admin"
                className="flex-1 text-sm font-semibold py-3 rounded-xl text-white text-center"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                Ir al admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
