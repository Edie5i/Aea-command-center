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

export default function ImportarFichaPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [data, setData] = useState<FichaData>({
    nombre: '', telefono: '', curso: '', transmision: 'Automático',
    direccion: '', notas: '', fechas: [],
  });
  const [calResult, setCalResult] = useState<{ created: number } | null>(null);
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
      setCalResult({ created: json.created });
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear eventos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 font-medium text-sm">← Admin</Link>
          <h1 className="text-base font-bold text-gray-900">Importar ficha</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {stage === 'upload' && (
          <div
            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
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
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Analizando ficha con IA…</p>
              </div>
            ) : (
              <>
                <p className="text-4xl mb-3">📄</p>
                <p className="font-semibold text-gray-700">Sube la ficha aquí</p>
                <p className="text-sm text-gray-400 mt-1">Foto desde WhatsApp, captura de pantalla o PDF</p>
                <p className="text-xs text-gray-300 mt-3">JPG · PNG · WEBP · PDF · máx 10 MB</p>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stage === 'review' && (
          <>
            {/* Preview de la imagen */}
            {preview && preview.startsWith('data:image') && (
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img src={preview} alt="Ficha" className="w-full max-h-48 object-contain bg-gray-50" />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b">
                <p className="text-sm font-semibold text-gray-700">Datos extraídos — revisa y corrige</p>
                <p className="text-xs text-gray-400 mt-0.5">La IA puede equivocarse, confirma antes de agendar</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={data.nombre}
                    onChange={e => updateField('nombre', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={data.telefono}
                    onChange={e => updateField('telefono', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Curso + Transmisión */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Curso</label>
                    <input
                      type="text"
                      value={data.curso}
                      onChange={e => updateField('curso', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Transmisión</label>
                    <select
                      value={data.transmision}
                      onChange={e => updateField('transmision', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Automático</option>
                      <option>Estándar</option>
                      <option>Moto</option>
                      <option>Mixto</option>
                    </select>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Punto de encuentro</label>
                  <input
                    type="text"
                    value={data.direccion}
                    onChange={e => updateField('direccion', e.target.value)}
                    placeholder="Ej. Torreón 49, Roma Sur"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Fechas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500">Fechas y horarios</label>
                    <button
                      type="button"
                      onClick={addFecha}
                      className="text-xs text-blue-600 font-semibold"
                    >
                      + Agregar fecha
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.fechas.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-3 border border-dashed rounded-lg">
                        No se detectaron fechas — agrega manualmente
                      </p>
                    )}
                    {data.fechas.map((f: FechaRow, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="date"
                          value={f.date}
                          onChange={e => updateFecha(i, 'date', e.target.value)}
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={f.time}
                          onChange={e => updateFecha(i, 'time', e.target.value)}
                          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {HORARIOS.map(h => <option key={h}>{h}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeFecha(i)}
                          className="text-gray-300 hover:text-red-400 text-lg font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                {data.notas && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                    <input
                      type="text"
                      value={data.notas}
                      onChange={e => updateField('notas', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStage('upload'); setPreview(''); setError(''); }}
                  className="flex-1 border rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cambiar imagen
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Agendando…' : `Agendar ${data.fechas.filter((f: FechaRow) => f.date).length} sesión${data.fechas.filter((f: FechaRow) => f.date).length !== 1 ? 'es' : ''} en Calendar`}
                </button>
              </div>
            </div>
          </>
        )}

        {stage === 'done' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{data.nombre}</h2>
            <p className="text-gray-500 text-sm mb-2">{data.telefono}</p>
            <p className="text-emerald-600 font-semibold text-sm mb-6">
              {calResult?.created} evento{calResult?.created !== 1 ? 's' : ''} creados en Google Calendar
            </p>
            <div className="space-y-1 mb-6 text-left bg-gray-50 rounded-xl p-4">
              {data.fechas.filter((f: FechaRow) => f.date).map((f: FechaRow, i: number) => (
                <p key={i} className="text-sm text-gray-600">
                  {i + 1}. {formatDate(f.date)} · {f.time}
                </p>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStage('upload'); setData({ nombre:'',telefono:'',curso:'',transmision:'Automático',direccion:'',notas:'',fechas:[] }); setPreview(''); setError(''); setCalResult(null); }}
                className="flex-1 border rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Importar otra ficha
              </button>
              <Link
                href="/admin"
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                Ir al admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
