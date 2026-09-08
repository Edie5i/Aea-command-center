import Link from 'next/link';

const WA_MARCO = `https://wa.me/525563206338?text=${encodeURIComponent('Hola, me interesa ser instructor')}`;

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(148,163,184,0.25)',
};

export default function InstructoresPage() {
  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-6 pt-14 pb-14"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(148,163,184,0.22)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: '#6366f1' }}>
            UrbDriver · AEA
          </p>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
            <span>
              Sal de las plataformas.
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Conviértete en instructor.
            </span>
          </h1>

          <p className="text-base leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: '#64748b' }}>
            Uber y DiDi se quedan hasta el <strong style={{ color: '#64748b' }}>35%</strong> de lo que generas. Como instructor certificado en AEA ganas <strong style={{ color: '#059669' }}>$150–200 por hora</strong>, con horario fijo y sin algoritmos.
          </p>

          <a href={WA_MARCO} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-base text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
            }}>
            Quiero aplicar →
          </a>
          <p className="mt-3 text-xs" style={{ color: '#334155' }}>Te atendemos por WhatsApp · Sin formularios</p>
        </div>
      </header>

      {/* Cómo funciona */}
      <section className="px-6 py-14 max-w-3xl mx-auto w-full">
        <h2 className="text-xl font-bold text-center mb-8">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: '1', title: 'Platica con Marco', desc: 'Nuestro bot en WhatsApp te hace unas preguntas rápidas para ver si calificas. Sin citas, sin trámites.' },
            { num: '2', title: 'Evaluación de 30 min', desc: 'Si calificas, agendamos una evaluación de manejo en nuestras instalaciones en Col. Axotla, CDMX.' },
            { num: '3', title: 'Empieza a dar clases', desc: 'Una vez activo recibes clases asignadas por WhatsApp con alumno, zona, horario y tipo de transmisión.' },
          ].map(s => (
            <div key={s.num} className="rounded-2xl p-5 text-center space-y-3" style={CARD}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto font-bold text-base"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                {s.num}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-6" style={{ height: 1, background: 'rgba(148,163,184,0.2)' }} />

      {/* Ofrecemos / Pedimos */}
      <section className="px-6 py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="rounded-2xl p-5" style={CARD}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1e293b' }}>Lo que ofrecemos</h2>
            <ul className="space-y-3">
              {[
                '$150–200 por hora de clase',
                'Horario fijo lunes a sábado',
                'Clases asignadas — sin buscar alumnos',
                'Sin algoritmos ni cancelaciones inesperadas',
                'Capacitación y certificación incluida',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-xs font-bold" style={{ color: '#059669' }}>✓</span>
                  <span style={{ color: '#64748b' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-5" style={CARD}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1e293b' }}>Lo que pedimos</h2>
            <ul className="space-y-3">
              {[
                'Mínimo 3 años manejando en ciudad',
                'Rating Uber o DiDi de 4.5★ o más',
                'Licencia tipo B vigente (la azul profesional)',
                'Disponibilidad en horario de mañana o tarde',
                'Paciencia y ganas de enseñar',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-xs font-bold" style={{ color: '#818cf8' }}>→</span>
                  <span style={{ color: '#64748b' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3 text-slate-800">¿Listo para salir de las plataformas?</h2>
        <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: '#475569' }}>
          Marco te atiende en menos de 5 minutos. Si calificas, agendamos tu evaluación de inmediato.
        </p>
        <a href={WA_MARCO} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-base text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
          }}>
          Hablar con Marco →
        </a>
        <div className="mt-8">
          <Link href="/" className="text-xs transition-colors" style={{ color: '#334155' }}>
            ← Inicio
          </Link>
        </div>
      </section>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.2)' }}>
        <p className="text-[11px]" style={{ color: '#334155' }}>UrbDriver · Auto Escuela Americana · CDMX</p>
      </footer>
    </main>
  );
}
