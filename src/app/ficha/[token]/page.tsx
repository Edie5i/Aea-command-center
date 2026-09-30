/**
 * La ficha del alumno.
 *
 * La misma liga toda la vida de la inscripción: el token se genera una vez y
 * esta página lee el estado en vivo. Por eso no es un documento —era un PDF y
 * mentía en cuanto algo cambiaba—, y por eso su orden no es el de un documento.
 *
 * Lo primero de la página es lo que falta por hacer: si no ha apartado, el monto
 * y a dónde depositar; si ya apartó, cuándo y dónde es su primera clase. Sus
 * datos y el folio van al final, en chico: están para comprobar, no para leer.
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/firestore';
import type { Ficha } from '@/lib/fichaLuz';
import { apartadoRecibido } from '@/lib/ficha-reglas';
import { CUENTA, TIENDAS } from '@/lib/cuenta';

export const dynamic = 'force-dynamic';

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

type Clase = { dia: string; hora: string };

/** "lunes 5 de octubre" + "10:00 a.m.", por separado: en la página pesan distinto. */
function partirFecha(fechaHora: string): Clase {
  const [fecha, hora] = fechaHora.split(' ');
  if (!fecha || !hora) return { dia: fechaHora, hora: '' };
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const [hh, mm] = hora.split(':').map(Number);
  const ampm = hh >= 12 ? 'p.m.' : 'a.m.';
  return {
    dia: `${DIAS_ES[dt.getDay()]} ${d} de ${MESES_ES[m - 1]}`,
    hora: `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${ampm}`,
  };
}

async function getFichaPorToken(token: string): Promise<(Ficha & { id: string }) | null> {
  const snap = await db.collection('fichas').where('fichaToken', '==', token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Ficha) };
}

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(148,163,184,0.25)',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

/** Un par etiqueta/valor de los datos de abajo. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2" style={{ borderTop: '1px solid rgba(148,163,184,0.18)' }}>
      <span className="text-xs shrink-0" style={{ color: '#64748b' }}>{etiqueta}</span>
      <span className="text-xs text-right" style={{ color: '#334155' }}>{children}</span>
    </div>
  );
}

export default async function FichaPublicaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ficha = await getFichaPorToken(token);
  if (!ficha) notFound();

  const folio = `AEA-${new Date(ficha.creada).getFullYear()}-${String(ficha.creada).slice(-4)}`;
  const reservada = ficha.estado === 'reservada';
  const perdida = ficha.estado === 'perdida';
  // Mandó su comprobante y todavía nadie lo revisa. Sin este estado, la ficha le
  // pedía pagar a alguien que acababa de pagar.
  const enRevision = !reservada && !perdida && !!ficha.comprobanteURL;

  const clases = ficha.opcionesFechaHora.map(partirFecha);
  const primera = clases[0];
  // El saldo se cuenta contra lo que de verdad entró, no contra el apartado de
  // tabla. La regla vive en ficha-reglas.ts, que es donde se puede probar.
  const recibido = apartadoRecibido(ficha);
  const saldo = ficha.precio > 0 ? ficha.precio - recibido : 0;
  // Un abono que todavía no alcanza para apartar: lo que se le pide es la
  // diferencia, no el apartado completo otra vez.
  const abonado = !reservada && ficha.depositoRegistrado ? ficha.depositoRegistrado : 0;
  const porApartar = Math.max(ficha.depositoMonto - abonado, 0);
  const nombrePila = (ficha.studentName || '').trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen py-6 px-4" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>
      <div className="max-w-md mx-auto space-y-4">

        {/* Membrete: una línea. No es la portada de un documento. */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: '#004aad' }}>A</div>
          <p className="text-sm font-bold leading-none" style={{ color: '#1e293b' }}>Auto Escuela Americana</p>
          <span className="ml-auto text-xs" style={{ ...MONO, color: '#94a3b8' }}>{folio}</span>
        </div>

        {/* Lo que falta por hacer. Es lo único grande de la página. */}
        {perdida ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)' }}>
            <p className="font-semibold text-sm" style={{ color: '#475569' }}>Este apartado ya no está vigente</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Escríbenos por WhatsApp si quieres retomarlo.</p>
          </div>
        ) : reservada ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(34,197,94,0.4)' }}>
            <div className="px-5 py-2.5" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <p className="text-sm font-bold" style={{ color: '#15803d' }}>
                ✅ Tu lugar está apartado{nombrePila ? `, ${nombrePila}` : ''}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Tu primera clase</p>
              {primera ? (
                <>
                  <p className="text-2xl font-bold leading-tight mt-1" style={{ color: '#1e293b' }}>{primera.dia}</p>
                  <p className="text-lg font-semibold" style={{ color: '#1d4ed8' }}>{primera.hora}</p>
                </>
              ) : (
                <p className="text-sm mt-1" style={{ color: '#475569' }}>Te confirmamos la fecha por WhatsApp.</p>
              )}
              {ficha.zona && (
                <p className="text-sm mt-3" style={{ color: '#334155' }}>
                  📍 Tu instructor llega a <strong>{ficha.zona}</strong>
                </p>
              )}
              {saldo > 0 && (
                <p className="text-xs mt-3 pt-3" style={{ color: '#64748b', borderTop: '1px solid rgba(148,163,184,0.2)' }}>
                  Saldo del curso: <strong style={{ color: '#334155' }}>${saldo.toLocaleString('es-MX')}</strong> — se paga antes de terminar, o a 3 meses sin intereses si prefieres.
                </p>
              )}
            </div>
          </div>
        ) : enRevision ? (
          <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(37,99,235,0.35)' }}>
            <p className="text-sm font-bold" style={{ color: '#1d4ed8' }}>⏳ Recibimos tu comprobante</p>
            <p className="text-sm mt-2" style={{ color: '#334155' }}>
              Lo estamos confirmando. No tienes que hacer nada: esta misma página te va a decir
              «apartado» en cuanto quede, y te avisamos por WhatsApp.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(245,158,11,0.45)' }}>
            <div className="px-5 pt-5">
              <p className="text-xs uppercase tracking-wide" style={{ color: '#b45309' }}>
                {abonado > 0 ? 'Te falta para apartar tu lugar' : 'Para apartar tu lugar'}
              </p>
              <p className="text-4xl font-black leading-none mt-1" style={{ color: '#1e293b' }}>
                ${porApartar.toLocaleString('es-MX')}
              </p>
              {abonado > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#334155' }}>
                  Ya recibimos <strong>${abonado.toLocaleString('es-MX')}</strong> de tu apartado de ${ficha.depositoMonto.toLocaleString('es-MX')}.
                </p>
              )}
              <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                Se descuenta del total{ficha.precio > 0 ? ` de $${ficha.precio.toLocaleString('es-MX')}` : ''}. Reembolsable hasta 48 h antes de tu primera clase.
              </p>
            </div>

            <div className="mt-4 px-5 py-4" style={{ background: 'rgba(148,163,184,0.07)', borderTop: '1px solid rgba(148,163,184,0.2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>Transferencia · {CUENTA.banco}</p>
              <div className="mt-2 space-y-1.5">
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>CLABE</p>
                  <p className="text-base font-semibold tracking-wider" style={{ ...MONO, color: '#1e293b' }}>{CUENTA.clabe}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs" style={{ color: '#64748b' }}>Cuenta</p>
                    <p className="text-sm tracking-wider" style={{ ...MONO, color: '#334155' }}>{CUENTA.numero}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#64748b' }}>A nombre de</p>
                    <p className="text-sm" style={{ color: '#334155' }}>{CUENTA.titular}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: '#64748b' }}>
                ¿En efectivo? En {TIENDAS} con la tarjeta{' '}
                <span className="tracking-wider" style={{ ...MONO, color: '#334155' }}>{CUENTA.tarjeta}</span>
              </p>
            </div>

            <div className="px-5 py-3" style={{ background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs" style={{ color: '#92400e' }}>
                Pon <strong>tu nombre completo</strong> en el concepto y mándanos el comprobante por WhatsApp.
                Esta página se actualiza sola en cuanto lo confirmemos.
              </p>
            </div>
          </div>
        )}

        {/* Las clases: es a lo que vuelve el alumno cada vez que abre la liga. */}
        {clases.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>
              {clases.length === 1 ? 'Tu clase' : `Tus ${clases.length} clases`}
            </p>
            <div className="px-5 py-3">
              {clases.map((c, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 py-2"
                  style={i > 0 ? { borderTop: '1px solid rgba(148,163,184,0.18)' } : undefined}
                >
                  <span className="text-sm font-medium" style={{ color: i === 0 ? '#1e293b' : '#475569' }}>{c.dia}</span>
                  <span className="text-sm shrink-0" style={{ color: i === 0 ? '#1d4ed8' : '#64748b' }}>{c.hora}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ficha.nota && (
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-xs" style={{ color: '#334155' }}>📝 {ficha.nota}</p>
          </div>
        )}

        {/* Para comprobar que es suya, no para leer. */}
        <div className="rounded-2xl px-5 py-3" style={CARD}>
          <Dato etiqueta="Alumno">{ficha.studentName || '—'}</Dato>
          <Dato etiqueta="Curso">
            {ficha.curso || '—'}
            {ficha.precio > 0 ? ` · $${ficha.precio.toLocaleString('es-MX')}` : ''}
          </Dato>
          {ficha.zona && <Dato etiqueta="Punto de encuentro">{ficha.zona}</Dato>}
          {ficha.depositoRegistrado ? (
            <Dato etiqueta="Apartado recibido">${recibido.toLocaleString('es-MX')}</Dato>
          ) : null}
        </div>

        <p className="text-xs text-center px-4" style={{ color: '#94a3b8' }}>
          Al apartar aceptas los{' '}
          <a href="https://autoescuelaamericana.com/terminos" style={{ color: '#2563eb' }}>términos y condiciones</a>.
          Cancelaciones con menos de 48 h no son reembolsables.
        </p>

        <p className="text-center text-xs" style={{ color: '#64748b' }}>
          Torreón 49, Roma Sur, CDMX · 56 3443 3212
        </p>
      </div>
    </main>
  );
}
