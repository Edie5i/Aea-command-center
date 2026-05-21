import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentFichas, type FichaWithId } from '@/lib/firestore';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function displayPhone(phone: string): string {
  const p = phone.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) return p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p.slice(2);
  return p;
}

export default async function AlumnosPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const fichas = await getRecentFichas(100).catch((): FichaWithId[] => []);

  // Agrupar por alumno (phone como clave, usar el nombre más reciente)
  const byStudent = new Map<string, {
    name: string;
    phone: string;
    fichas: FichaWithId[];
    lastDate: number;
    bestPct: number;
  }>();

  for (const f of fichas) {
    const key = f.phone || f.studentName;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        name: f.studentName,
        phone: f.phone,
        fichas: [] as FichaWithId[],
        lastDate: f.dateMillis,
        bestPct: 0,
      });
    }
    const entry = byStudent.get(key)!;
    entry.fichas.push(f);
    if (f.dateMillis > entry.lastDate) entry.lastDate = f.dateMillis;
    const pct = f.totalTopics > 0 ? Math.round((f.completedCount / f.totalTopics) * 100) : 0;
    if (pct > entry.bestPct) entry.bestPct = pct;
  }

  const students = [...byStudent.values()].sort((a, b) => b.lastDate - a.lastDate);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 font-medium text-sm">← Admin</Link>
          <h1 className="text-base font-bold text-gray-900">Alumnos</h1>
          <span className="ml-auto text-xs text-gray-400">{students.length} alumnos</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">Aún no hay fichas registradas.</p>
            <p className="text-xs mt-1">Las fichas se guardan automáticamente al generar un reporte en Notas de Alumno.</p>
            <Link href="/notas-alumno" className="inline-block mt-4 text-sm text-blue-600 font-semibold">
              Ir a Notas de Alumno →
            </Link>
          </div>
        ) : (
          students.map(student => (
            <div key={student.phone || student.name} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Header del alumno */}
              <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-base flex items-center justify-center shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                  {student.phone && (
                    <p className="text-xs text-gray-500">{displayPhone(student.phone)}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-emerald-600">{student.bestPct}%</p>
                  <p className="text-xs text-gray-400">avance máx.</p>
                </div>
              </div>

              {/* Fichas del alumno */}
              <div className="border-t divide-y divide-gray-50">
                {student.fichas.map((f, i) => {
                  const pct = f.totalTopics > 0 ? Math.round((f.completedCount / f.totalTopics) * 100) : 0;
                  return (
                    <div key={f.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">{formatDate(f.dateMillis)}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {f.completedCount}/{f.totalTopics} temas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 80 ? 'bg-emerald-400' :
                              pct >= 40 ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      </div>

                      {/* Temas pendientes (últimos 3) */}
                      {f.pendingTopics.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Pendientes:</p>
                          <ul className="space-y-0.5">
                            {f.pendingTopics.slice(0, 3).map((t, idx) => (
                              <li key={idx} className="text-xs text-gray-600 truncate">• {t}</li>
                            ))}
                            {f.pendingTopics.length > 3 && (
                              <li className="text-xs text-gray-400">
                                +{f.pendingTopics.length - 3} más
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Acción */}
              <div className="px-4 pb-3 pt-1">
                <Link
                  href="/notas-alumno"
                  className="text-xs text-blue-600 font-semibold"
                >
                  + Nueva ficha para {student.name.split(' ')[0]}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
