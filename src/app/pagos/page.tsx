
import Link from 'next/link';
import { ArrowLeft, CreditCard, CalendarDays } from 'lucide-react';
import { PaymentDetails } from '@/components/payment-details';

export default function PagosPage() {
  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(52,211,153,0.1) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <CreditCard className="w-6 h-6" style={{ color: '#34d399' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Información de Pago
          </h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            Aceptamos transferencias y depósitos en efectivo
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <Link href="/agenda"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
              <CalendarDays className="w-3 h-3" /> Agendar clase
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <PaymentDetails />
      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p className="text-[11px]" style={{ color: '#334155' }}>Auto Escuela Americana · CDMX</p>
      </footer>
    </main>
  );
}
