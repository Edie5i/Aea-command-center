import type { Metadata } from 'next';
import Link from 'next/link';
import { AppFooter } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad — Auto Escuela Americana',
  description:
    'Conoce cómo Auto Escuela Americana recopila, usa y protege tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/aviso-privacidad',
  },
  robots: 'index, follow',
};

export default function AvisoPrivacidadPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 text-sm leading-relaxed">
        <nav className="mb-8 text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Aviso de Privacidad</span>
        </nav>

        <h1 className="text-3xl font-headline font-bold mb-2">Aviso de Privacidad</h1>
        <p className="text-muted-foreground mb-10">Última actualización: mayo de 2026</p>

        <section className="space-y-8 text-foreground">

          <div className="space-y-2">
            <h2 className="font-semibold text-base">1. Responsable del tratamiento</h2>
            <p>
              <strong>Auto Escuela Americana</strong>, con domicilio en Torreón 49, colonia Roma Sur,
              alcaldía Cuauhtémoc, Ciudad de México, C.P. 06760, es responsable del tratamiento de
              sus datos personales conforme a la{' '}
              <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em>{' '}
              (LFPDPPP) y su Reglamento.
            </p>
            <p>
              Contacto de privacidad:{' '}
              <a href="mailto:autoescuelaamericanamx@gmail.com" className="underline">
                autoescuelaamericanamx@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">2. Datos personales que recopilamos</h2>
            <p>Recopilamos únicamente los datos necesarios para brindarle el servicio:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Nombre completo</li>
              <li>Número de teléfono (WhatsApp)</li>
              <li>Correo electrónico (cuando lo proporciona)</li>
              <li>Colonia o zona de la Ciudad de México (para coordinación de clases a domicilio)</li>
              <li>Preferencias de horario y tipo de transmisión</li>
            </ul>
            <p className="text-muted-foreground">
              No recopilamos datos sensibles (origen racial, estado de salud, datos biométricos,
              creencias religiosas o políticas).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">3. Finalidades del tratamiento</h2>
            <p className="font-medium">Finalidades primarias (necesarias para el servicio):</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Agendar y confirmar clases de manejo vía WhatsApp y Google Calendar</li>
              <li>Enviar recordatorios de clases y seguimiento del curso</li>
              <li>Coordinar instructor, horario y domicilio de cada sesión</li>
              <li>Gestionar pagos, anticipos y solicitudes de cancelación</li>
            </ul>
            <p className="font-medium mt-3">Finalidades secundarias (puede negarse sin afectar el servicio):</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Enviar información sobre nuevos cursos o promociones</li>
              <li>Solicitar reseñas de satisfacción del servicio</li>
            </ul>
            <p className="text-muted-foreground">
              Para negarse a las finalidades secundarias, envíe un mensaje a{' '}
              <a href="mailto:autoescuelaamericanamx@gmail.com" className="underline">
                autoescuelaamericanamx@gmail.com
              </a>{' '}
              indicando "No deseo recibir comunicaciones promocionales".
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">4. Transferencia de datos</h2>
            <p>
              Sus datos pueden ser compartidos con los siguientes terceros, en la medida estrictamente
              necesaria para prestar el servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong>Google LLC</strong> — Google Calendar y Google Workspace, para el agendamiento
                de clases. Política de privacidad:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  policies.google.com/privacy
                </a>
              </li>
              <li>
                <strong>Meta Platforms (WhatsApp Business API)</strong> — para el envío de mensajes
                y notificaciones. Política de privacidad:{' '}
                <a
                  href="https://www.whatsapp.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  whatsapp.com/legal/privacy-policy
                </a>
              </li>
            </ul>
            <p className="text-muted-foreground">
              No vendemos, cedemos ni rentamos sus datos personales a terceros con fines comerciales.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">5. Derechos ARCO</h2>
            <p>
              Usted tiene derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>,{' '}
              <strong>Cancelar</strong> u <strong>Oponerse</strong> al tratamiento de sus datos
              personales (derechos ARCO). Para ejercerlos:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>
                Envíe un correo a{' '}
                <a href="mailto:autoescuelaamericanamx@gmail.com" className="underline">
                  autoescuelaamericanamx@gmail.com
                </a>{' '}
                con el asunto "Derechos ARCO".
              </li>
              <li>Indique su nombre completo y el derecho que desea ejercer.</li>
              <li>
                Responderemos en un plazo máximo de <strong>20 días hábiles</strong> conforme a la LFPDPPP.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">6. Cookies y tecnologías de rastreo</h2>
            <p>
              Nuestro sitio web utiliza Google Analytics (cookies de análisis) para medir el tráfico
              y mejorar la experiencia de usuario. Esta información es anónima y estadística. Puede
              desactivar las cookies desde la configuración de su navegador.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">7. Cambios al aviso de privacidad</h2>
            <p>
              Cualquier modificación a este aviso será publicada en esta misma página. Si continúa
              usando nuestros servicios después de la publicación de cambios, se entenderá que acepta
              las modificaciones.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-base">8. Autoridad competente</h2>
            <p>
              Si considera que su derecho a la protección de datos ha sido vulnerado, puede presentar
              una queja ante el{' '}
              <a
                href="https://www.inai.org.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos
                Personales (INAI)
              </a>.
            </p>
          </div>

        </section>
      </div>

      <AppFooter />
    </main>
  );
}
