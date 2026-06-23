import Link from 'next/link';
import { AppFooter } from '@/components/footer';

const WA_MARCO = `https://wa.me/525563206338?text=${encodeURIComponent('Hola, me interesa ser instructor')}`;

export default function InstructoresPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-indigo-700 text-white px-6 py-16 text-center">
        <p className="text-indigo-300 text-sm font-semibold uppercase tracking-widest mb-3">UrbDriver · AEA</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-2xl mx-auto">
          Sal de las plataformas.<br />Conviértete en instructor.
        </h1>
        <p className="mt-5 text-lg text-indigo-200 max-w-xl mx-auto">
          Uber y DiDi se quedan hasta el 35% de lo que generas. Como instructor certificado en AEA ganas $150–200 por hora, con horario fijo y sin algoritmos.
        </p>
        <a
          href={WA_MARCO}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:bg-indigo-50 transition-colors"
        >
          Quiero aplicar →
        </a>
        <p className="mt-3 text-indigo-300 text-sm">Te atendemos por WhatsApp · Sin formularios</p>
      </div>

      {/* Cómo funciona */}
      <div className="px-6 py-14 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { num: '1', title: 'Platica con Marco', desc: 'Nuestro bot en WhatsApp te hace unas preguntas rápidas para ver si calificas. Sin citas, sin trámites.' },
            { num: '2', title: 'Evaluación de 30 min', desc: 'Si calificas, agendamos una evaluación de manejo en nuestras instalaciones en Col. Axotla, CDMX.' },
            { num: '3', title: 'Empieza a dar clases', desc: 'Una vez activo recibes clases asignadas por WhatsApp con alumno, zona, horario y tipo de transmisión.' },
          ].map(s => (
            <div key={s.num} className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center mx-auto">
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requisitos */}
      <div className="bg-gray-50 px-6 py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lo que ofrecemos</h2>
            <ul className="space-y-3 text-gray-600 text-sm">
              {[
                '$150–200 por hora de clase',
                'Horario fijo lunes a sábado',
                'Clases asignadas — sin buscar alumnos',
                'Sin algoritmos ni cancelaciones inesperadas',
                'Capacitación y certificación incluida',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lo que pedimos</h2>
            <ul className="space-y-3 text-gray-600 text-sm">
              {[
                'Mínimo 3 años manejando en ciudad',
                'Rating Uber o DiDi de 4.5★ o más',
                'Licencia tipo B vigente (la azul profesional)',
                'Disponibilidad en horario de mañana o tarde',
                'Paciencia y ganas de enseñar',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Listo para salir de las plataformas?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Marco te atiende en menos de 5 minutos. Si calificas, agendamos tu evaluación de inmediato.</p>
        <a
          href={WA_MARCO}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-indigo-700 transition-colors"
        >
          Hablar con Marco →
        </a>
        <div className="mt-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Inicio</Link>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
