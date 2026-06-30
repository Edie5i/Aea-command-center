import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Car, Star, CheckCircle, MessageCircle } from 'lucide-react';

const WA_URL = `https://wa.me/525634433212?text=${encodeURIComponent("Hi! I'm interested in the English Driving Course. Can you tell me more?")}`;
const AGENDA_URL = '/agenda';

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

export default function EnglishCoursePage() {
  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-6 pt-14 pb-16"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(14,165,233,0.14) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-6"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>

          {/* Flag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', color: '#38bdf8' }}>
            🇺🇸 🇬🇧 &nbsp;Taught entirely in English
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            <span style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Learn to Drive
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #7dd3fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              in CDMX.
            </span>
          </h1>

          <p className="text-base leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: '#64748b' }}>
            Mexico City's driving school for expats, foreign residents, and international visitors.
            Professional instructors, flexible schedules, and{' '}
            <strong style={{ color: '#94a3b8' }}>100% English lessons</strong>.
          </p>

          {/* Price badge */}
          <div className="inline-flex items-baseline gap-1 px-5 py-3 rounded-2xl mb-8"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <span className="text-3xl font-black" style={{ color: '#e2e8f0' }}>$4,800</span>
            <span className="text-sm" style={{ color: '#475569' }}>MXN · full course · IVA included</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={AGENDA_URL}
              className="inline-flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-xl text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              Book My First Lesson →
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-sm"
              style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
              <MessageCircle className="w-4 h-4" /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full space-y-10">

        {/* Who it's for */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>Who is this for?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { emoji: '🌎', title: 'Expats & Foreign Residents', desc: 'Living in CDMX and need a Mexican license or just want to drive confidently in the city.' },
              { emoji: '✈️', title: 'International Visitors', desc: 'Spending time in Mexico and want to navigate the city independently.' },
              { emoji: '🎓', title: 'International Students', desc: 'Studying in CDMX and looking for a reliable, English-speaking instructor.' },
              { emoji: '🏠', title: 'Complete Beginners', desc: 'Never driven before? No problem. We start from zero — pedals, mirrors, the whole thing.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl p-4 flex gap-3" style={CARD}>
                <span className="text-xl shrink-0">{item.emoji}</span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#e2e8f0' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(148,163,184,0.07)' }} />

        {/* What's included */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>What's included</h2>
          <div className="rounded-2xl p-6 space-y-3" style={CARD}>
            {[
              'All lessons conducted 100% in English by certified instructors',
              '2.5-hour sessions — enough time to practice without rushing',
              'Dual-control vehicle (automatic or manual, your choice)',
              'Pickup at your home, office, or agreed meeting point in CDMX',
              'Flexible schedule: 7am, 10am, 1pm, 4pm, and 7pm slots available',
              'All levels welcome — absolute beginners to license refreshers',
              'No hidden fees — price includes IVA',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0ea5e9' }} />
                <p className="text-sm" style={{ color: '#64748b' }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick facts */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>Quick facts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Clock className="w-5 h-5" />, label: 'Session length', value: '2.5 hours' },
              { icon: <Car className="w-5 h-5" />, label: 'Vehicle', value: 'Dual-control car' },
              { icon: <MapPin className="w-5 h-5" />, label: 'Base location', value: 'Roma Sur, CDMX' },
            ].map(f => (
              <div key={f.label} className="rounded-2xl p-4 flex items-center gap-3" style={CARD}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8' }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: '#334155' }}>{f.label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section>
          <div className="rounded-2xl p-6" style={{ ...CARD, borderColor: 'rgba(14,165,233,0.15)' }}>
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>
              "I moved to Mexico City from Canada and was terrified of driving here. My instructor was patient, spoke perfect English, and taught me the unwritten rules of CDMX traffic. I passed my test on the first try."
            </p>
            <p className="text-xs font-semibold" style={{ color: '#475569' }}>— Sarah M., Canadian expat · Condesa</p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Do I need to speak Spanish?',
                a: 'Not at all. Everything — instructions, feedback, safety explanations — is in English from start to finish.',
              },
              {
                q: 'Can you pick me up at my apartment?',
                a: 'Yes. We offer home pickup across most of CDMX. You can also meet us at our Roma Sur office or at any agreed point.',
              },
              {
                q: 'I have never driven before. Is that okay?',
                a: 'Absolutely. We start from the very basics: how to sit, how to use mirrors, pedal coordination. No prior experience required.',
              },
              {
                q: 'What if I need to cancel a class?',
                a: 'We ask for 24 hours notice. If you cancel with less notice, the session is counted as used. No exceptions.',
              },
              {
                q: 'Do you help with getting a Mexican driver\'s license?',
                a: 'We issue a certificate of course completion that is required for the license process in CDMX. We can guide you on the next steps.',
              },
            ].map(item => (
              <div key={item.q} className="rounded-2xl p-5" style={CARD}>
                <p className="text-sm font-semibold mb-1.5" style={{ color: '#e2e8f0' }}>{item.q}</p>
                <p className="text-sm" style={{ color: '#475569' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA block */}
        <section className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0ea5e9' }}>Ready to get started?</p>
          <h2 className="text-2xl font-black mb-2 text-white">Book your first lesson today.</h2>
          <p className="text-sm mb-6" style={{ color: '#475569' }}>
            Payment is made in full before the first session. $4,800 MXN — IVA included, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={AGENDA_URL}
              className="inline-flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-xl text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              Schedule Now →
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-sm"
              style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
              <MessageCircle className="w-4 h-4" /> Chat with us
            </a>
          </div>
        </section>

      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p className="text-[11px]" style={{ color: '#334155' }}>Auto Escuela Americana · Roma Sur, CDMX · autoescuelaamericana.com</p>
      </footer>
    </main>
  );
}
