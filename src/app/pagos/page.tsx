
import Link from 'next/link';
import { ArrowLeft, CreditCard, CalendarDays } from 'lucide-react';
import { PaymentDetails } from '@/components/payment-details';

export default function PagosPage() {
  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors hover:bg-slate-100"
            style={{ background: 'white', border: '1px solid rgba(148,163,184,0.3)', color: '#475569' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CreditCard className="w-6 h-6" style={{ color: '#059669' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1 text-slate-800">
            Información de Pago
          </h1>
          <p className="text-base mt-2" style={{ color: '#475569' }}>
            Aceptamos transferencias y depósitos en efectivo
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <Link href="/agenda"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#047857' }}>
              <CalendarDays className="w-3 h-3" /> Agendar clase
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <PaymentDetails />
      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.2)' }}>
        <p className="text-xs" style={{ color: '#64748b' }}>Auto Escuela Americana · CDMX</p>
      </footer>
    </main>
  );
}
