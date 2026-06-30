import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentFichas, type FichaWithId } from '@/lib/firestore';
import { Users } from 'lucide-react';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function displayPhone(phone: string): string {
  const p = phone.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) return p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p.slice(2);
  return p;
}

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

export default async function AlumnosPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }

  const fichas = await getRecentFichas(100).catch((): FichaWithId[] => []);

  const byStudent = new Map<string, {
    name: string; phone: string; fichas: FichaWithId[]; lastDate: number; bestPct: number;
  }>();

  for (const f of fichas) {
    const key = f.phone || f.studentName;
    if (!byStudent.has(key)) {
      byStudent.set(key, { name: f.studentName, phone: f.phone, fichas: [], lastDate: f.dateMillis, bestPct: 0 });
    }
    const entry = byStudent.get(key)!;
    entry.fichas.push(f);
    if (f.dateMillis > entry.lastDate) entry.lastDate = f.dateMillis;
    const pct = f.totalTopics > 0 ? Math.round((f.completedCount / f.totalTopics) * 100) : 0;
    if (pct > entry.bestPct) entry.bestPct = pct;
  }

  const students = [...byStudent.values()].sort((a, b) => b.lastDate - a.lastDate);

  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(8px)' }}>
        <Link href="/admin" className="text-xs font-medium transition-colors"
          style={{ color: '#3b82f6' }}>← Admin</Link>
        <div className="flex items-center gap-2 flex-1">
          <Users className="w-4 h-4" style={{ color: '#60a5fa' }} />
          <h1 className="text-sm font-bold text-white">Alumnos</h1>
        </div>
        <span className="text-xs" style={{ color: '#334155' }}>{students.length} alumnos</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-3">

        {students.length === 0 ? (
          <div className="rounded-2xl p-8 text-center mt-8" style={CARD}>
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm mb-1" style={{ color: '#64748b' }}>Aún no hay fichas registradas.</p>
            <p className="text-xs mb-4" style={{ color: '#334155' }}>
              Las fichas se guardan automáticamente al generar un reporte en Notas de Alumno.
            </p>
            <Link href="/notas-alumno"
              className="inline-block text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              Ir a Notas de Alumno →
            </Link>
          </div>
        ) : (
          students.map(student => {
            const pctColor = student.bestPct >= 80 ? '#34d399' : student.bestPct >= 40 ? '#60a5fa' : '#f59e0b';
            const inicial = student.name.charAt(0).toUpperCase();

            return (
              <div key={student.phone || student.name} className="rounded-2xl overflow-hidden" style={CARD}>

                {/* Cabecera del alumno */}
                <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-base"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {inicial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-white">{student.name}</p>
                    {student.phone && (
                      <p className="text-xs" style={{ color: '#475569' }}>{displayPhone(student.phone)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black" style={{ color: pctColor }}>{student.bestPct}%</p>
                    <p className="text-[11px]" style={{ color: '#334155' }}>avance máx.</p>
                  </div>
                </div>

                {/* Fichas */}
                <div style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
                  {student.fichas.map((f) => {
                    const pct = f.totalTopics > 0 ? Math.round((f.completedCount / f.totalTopics) * 100) : 0;
                    const barColor = pct >= 80 ? '#34d399' : pct >= 40 ? '#60a5fa' : '#f59e0b';

                    return (
                      <div key={f.id} className="px-4 py-3"
                        style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: '#334155' }}>{formatDate(f.dateMillis)}</span>
                          <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                            {f.completedCount}/{f.totalTopics} temas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(148,163,184,0.1)' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: '#475569' }}>{pct}%</span>
                        </div>

                        {f.pendingTopics.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[11px] mb-1" style={{ color: '#334155' }}>Pendientes:</p>
                            <ul className="space-y-0.5">
                              {f.pendingTopics.slice(0, 3).map((t, idx) => (
                                <li key={idx} className="text-xs truncate" style={{ color: '#475569' }}>• {t}</li>
                              ))}
                              {f.pendingTopics.length > 3 && (
                                <li className="text-xs" style={{ color: '#334155' }}>
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
                <div className="px-4 py-3">
                  <Link href="/notas-alumno"
                    className="text-xs font-semibold transition-colors"
                    style={{ color: '#3b82f6' }}>
                    + Nueva ficha para {student.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
