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
 *
 * El vestido vive en `../aea.css`, compartido con la captura de mostrador: el oficio de Vía Urb —relieve, cromo,
 * semáforo, el dinero en blanco— pero en los colores de AEA, sacados de su
 * propio logo. Esta ficha es suya.
 */

import { notFound } from 'next/navigation';
import { Building2, CalendarDays, MapPin, MessageCircle, StickyNote } from 'lucide-react';
import { db } from '@/lib/firestore';
import type { Ficha } from '@/lib/fichaLuz';
import { apartadoRecibido } from '@/lib/ficha-reglas';
import { CUENTA, TIENDAS } from '@/lib/cuenta';
import { Copiar } from './Copiar';
import '../aea.css';

export const dynamic = 'force-dynamic';

/** El WhatsApp al que se le manda el comprobante. */
const WHATSAPP_ESCUELA = '525634433212';

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

/** Un par etiqueta/valor de los datos de abajo. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="dato">
      <span className="dato-et">{etiqueta}</span>
      <span className="dato-v">{children}</span>
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

  // El mensaje ya escrito: así no tiene que explicar quién es ni de qué ficha
  // habla, que es donde se atora quien nunca ha escrito por WhatsApp.
  const avisoComprobante = `Hola, les mando el comprobante de mi apartado. Folio ${folio}${ficha.studentName ? ` · ${ficha.studentName}` : ''}`;
  const ligaWhatsapp = `https://wa.me/${WHATSAPP_ESCUELA}?text=${encodeURIComponent(avisoComprobante)}`;

  return (
    <main className="ficha">
      <div className="hoja">

        {/* Membrete: una línea. No es la portada de un documento. */}
        <div className="membrete">
          {/* El logo de verdad, recortado en círculo con fondo transparente.
              `logo.png` es ese mismo círculo dentro de un cuadro BLANCO y sin
              canal alfa, así que sobre el petróleo enseñaba el cuadro. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="marca" src="/logo-circulo.png" alt="Auto Escuela Americana" width={36} height={36} />
          <p className="membrete-nombre">Auto Escuela Americana</p>
          <span className="folio">{folio}</span>
        </div>

        {/* Lo que falta por hacer. Es lo único grande de la página. */}
        {perdida ? (
          <div className="panel">
            <div className="estado" style={{ background: 'rgba(143,163,160,0.1)', color: 'var(--suave)' }}>
              <span className="testigo t-gris" aria-hidden />
              Este apartado ya no está vigente
            </div>
            <div className="cuerpo">
              <p className="texto">
                Si quieres retomarlo, escríbenos y lo vemos. Tu lugar y tu precio se
                revisan otra vez.
              </p>
              <div style={{ marginTop: '1rem' }}>
                <a className="plata" href={`https://wa.me/${WHATSAPP_ESCUELA}?text=${encodeURIComponent(`Hola, quiero retomar mi inscripción. Folio ${folio}`)}`}>
                  <MessageCircle className="ico" aria-hidden />
                  Escribirnos por WhatsApp
                </a>
              </div>
            </div>
          </div>
        ) : reservada ? (
          <div className="panel">
            <div className="estado estado-verde">
              <span className="testigo t-verde" aria-hidden />
              Tu lugar está apartado{nombrePila ? `, ${nombrePila}` : ''}
            </div>
            <div className="cuerpo">
              <p className="rotulo">Tu primera clase</p>
              {primera ? (
                <>
                  <p className="fecha-grande">{primera.dia}</p>
                  <p className="hora-grande">{primera.hora}</p>
                </>
              ) : (
                <p className="texto" style={{ marginTop: '0.375rem' }}>
                  Te confirmamos la fecha por WhatsApp.
                </p>
              )}
              {ficha.zona && (
                <p className="texto" style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                  <MapPin className="ico" style={{ marginTop: '0.2rem', flexShrink: 0, color: 'var(--tenue)' }} aria-hidden />
                  <span>Tu instructor llega a <strong>{ficha.zona}</strong></span>
                </p>
              )}
              {saldo > 0 && (
                <p
                  className="nota-chica"
                  style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                  Saldo del curso: <strong>${saldo.toLocaleString('es-MX')}</strong> — se paga antes de
                  terminar, o a 3 meses sin intereses si prefieres.
                </p>
              )}
            </div>
          </div>
        ) : enRevision ? (
          <div className="panel">
            <div className="estado estado-ambar">
              <span className="testigo t-ambar" aria-hidden />
              Recibimos tu comprobante
            </div>
            <div className="cuerpo">
              <p className="texto">
                Lo estamos confirmando. No tienes que hacer nada: esta misma página va a
                decir <strong>«apartado»</strong> en cuanto quede, y te avisamos por WhatsApp.
              </p>
            </div>
          </div>
        ) : (
          <div className="panel">
            <div className="cuerpo" style={{ paddingBottom: 0 }}>
              <p className="rotulo">
                {abonado > 0 ? 'Te falta para apartar tu lugar' : 'Para apartar tu lugar'}
              </p>
              <p className="cifra">${porApartar.toLocaleString('es-MX')}</p>
              {abonado > 0 && (
                <p className="nota-chica" style={{ marginTop: '0.5rem' }}>
                  Ya recibimos <strong>${abonado.toLocaleString('es-MX')}</strong> de tu apartado de
                  ${ficha.depositoMonto.toLocaleString('es-MX')}.
                </p>
              )}
              <p className="nota-chica" style={{ marginTop: '0.5rem' }}>
                Se descuenta del total{ficha.precio > 0 ? ` de $${ficha.precio.toLocaleString('es-MX')}` : ''}.
                Reembolsable hasta 48 h antes de tu primera clase.
              </p>
            </div>

            {/* A dónde depositar, hundido: esto se copia, no se lee. */}
            <div className="hueco banco">
              <p className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 className="ico" aria-hidden />
                Transferencia · {CUENTA.banco}
              </p>

              <div style={{ marginTop: '0.75rem' }}>
                <p className="nota-chica">CLABE</p>
                <div className="clabe-fila" style={{ marginTop: '0.125rem' }}>
                  <span className="clabe">{CUENTA.clabe}</span>
                  <Copiar valor={CUENTA.clabe} que="la CLABE" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <p className="nota-chica">Cuenta</p>
                  <p className="mono" style={{ fontSize: '0.8125rem' }}>{CUENTA.numero}</p>
                </div>
                <div>
                  <p className="nota-chica">A nombre de</p>
                  <p className="texto" style={{ fontSize: '0.8125rem' }}>{CUENTA.titular}</p>
                </div>
              </div>

              <p className="nota-chica" style={{ marginTop: '0.75rem' }}>
                ¿En efectivo? En {TIENDAS} con la tarjeta{' '}
                <span className="mono">{CUENTA.tarjeta}</span>
              </p>
            </div>

            {/* La acción. Antes decía «mándanos el comprobante por WhatsApp» y
                no había por dónde: había que salirse a buscar el número. */}
            <div className="cuerpo" style={{ paddingTop: '1rem' }}>
              <p className="nota-chica" style={{ marginBottom: '0.75rem' }}>
                Pon <strong>tu nombre completo</strong> en el concepto. Esta página se
                actualiza sola en cuanto lo confirmemos.
              </p>
              <a className="plata" href={ligaWhatsapp}>
                <MessageCircle className="ico" aria-hidden />
                Mandar mi comprobante
              </a>
            </div>
          </div>
        )}

        {/* Las clases: es a lo que vuelve el alumno cada vez que abre la liga. */}
        {clases.length > 0 && (
          <div className="panel">
            <div className="cuerpo">
              <p className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays className="ico" aria-hidden />
                {clases.length === 1 ? 'Tu clase' : `Tus ${clases.length} clases`}
              </p>
              <div style={{ marginTop: '0.5rem' }}>
                {clases.map((c, i) => (
                  <div key={i} className={`clase${i === 0 ? ' clase-1' : ''}`}>
                    <span className="clase-dia">{c.dia}</span>
                    <span className="clase-hora">{c.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ficha.nota && (
          <div className="panel">
            <div className="cuerpo" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
              <StickyNote className="ico" style={{ marginTop: '0.15rem', flexShrink: 0, color: 'var(--tenue)' }} aria-hidden />
              <p className="texto" style={{ fontSize: '0.8125rem' }}>{ficha.nota}</p>
            </div>
          </div>
        )}

        {/* Para comprobar que es suya, no para leer. */}
        <div className="panel">
          <div className="cuerpo" style={{ padding: '0.25rem 1.25rem' }}>
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
        </div>

        <p className="pie">
          Al apartar aceptas los{' '}
          <a href="https://autoescuelaamericana.com/terminos">términos y condiciones</a>.
          Cancelaciones con menos de 48 h no son reembolsables.
        </p>

        <p className="pie">Torreón 49, Roma Sur, CDMX · 56 3443 3212</p>
      </div>
    </main>
  );
}
