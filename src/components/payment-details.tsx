
'use client';

import { useState } from 'react';
import { Banknote, Landmark, MessageSquare, CreditCard, Info, Check, ClipboardCopy } from 'lucide-react';
import Image from 'next/image';

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(148,163,184,0.2)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const INNER: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 12,
  padding: '14px 16px',
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={copied
        ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#059669' }
        : { background: 'white', border: '1px solid rgba(148,163,184,0.3)', color: '#64748b' }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={CARD}>
      <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#1e293b' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export function PaymentDetails() {
  // Se muestran sin espacios y desde la misma constante que copia el botón:
  // así seleccionar a mano pega un número válido y solo hay un lugar que
  // actualizar cuando cambien la cuenta o la tarjeta.
  const accountNumber = '0484695739';
  const clabe = '012180004846957399';
  const debitCard = '4152314404288527';
  const officialQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/525634433212?text=¡Hola!%20Aquí%20envío%20mi%20comprobante%20de%20pago.';

  return (
    <div className="w-full max-w-3xl space-y-4">

      <Section icon={<Landmark className="w-4 h-4" style={{ color: '#059669' }} />} title="Transferencia Bancaria">
        <p className="text-xs" style={{ color: '#475569' }}>
          Beneficiario: <span style={{ color: '#475569' }}>Eduardo W. Czaplewski (Cuenta PYME BBVA)</span>
        </p>
        <div className="space-y-3">
          <div style={INNER}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>Cuenta</p>
                <p className="font-mono text-base text-slate-800 tracking-wider">{accountNumber}</p>
              </div>
              <CopyBtn text={accountNumber} />
            </div>
          </div>
          <div style={INNER}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>CLABE Interbancaria</p>
                <p className="font-mono text-sm text-slate-800 tracking-wider">{clabe}</p>
              </div>
              <CopyBtn text={clabe} />
            </div>
          </div>
        </div>
      </Section>

      <Section icon={<Banknote className="w-4 h-4" style={{ color: '#059669' }} />} title="Depósito en Efectivo">
        <p className="text-xs" style={{ color: '#475569' }}>
          Disponible en: <span style={{ color: '#475569' }}>Walmart, Sanborns, OXXO, 7-Eleven</span>
        </p>
        <div style={INNER}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>Tarjeta de Débito BBVA</p>
              <p className="font-mono text-base text-slate-800 tracking-wider">{debitCard}</p>
            </div>
            <CopyBtn text={debitCard} />
          </div>
        </div>
      </Section>

      <Section icon={<CreditCard className="w-4 h-4" style={{ color: '#059669' }} />} title="Pago con Tarjeta a Meses">
        <p className="text-sm" style={{ color: '#64748b' }}>
          Aceptamos pagos con tarjeta de crédito. Solicita tu enlace de pago por WhatsApp y recibe las instrucciones por correo electrónico.
        </p>
        <p className="text-sm font-semibold" style={{ color: '#047857' }}>
          ¡Pregunta por la opción de 3 meses sin intereses con tarjetas BBVA y American Express!
        </p>
      </Section>

      <Section icon={<MessageSquare className="w-4 h-4" style={{ color: '#059669' }} />} title="Envía tu Comprobante">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="max-w-sm">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Una vez realizado el pago, envía tu comprobante a nuestro WhatsApp para confirmarlo y agilizar el proceso.
            </p>
            <p className="text-sm font-semibold mt-2" style={{ color: '#047857' }}>¡Escanea el código QR para abrir el chat!</p>
          </div>
          <div className="p-2 rounded-xl shrink-0 border border-slate-200" style={{ background: 'white' }}>
            <Image src={officialQrUrl} alt="QR WhatsApp AEA" width={130} height={130} data-ai-hint="QR code" />
          </div>
        </div>
      </Section>

      {/* Aviso importante */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#059669' }} />
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: '#047857' }}>¡Importante!</p>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Al realizar tu pago, pon en el concepto o referencia el <strong style={{ color: '#0f172a' }}>nombre completo del alumno</strong>, o el <strong style={{ color: '#0f172a' }}>número de factura</strong> si es un pago empresarial.
          </p>
          <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>
            Los precios <strong style={{ color: '#0f172a' }}>no incluyen IVA</strong>.
          </p>
        </div>
      </div>

    </div>
  );
}
