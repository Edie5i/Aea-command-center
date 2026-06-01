import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agendar Clase de Manejo en CDMX — Auto Escuela Americana',
  description: 'Reserva tu clase de manejo en CDMX en línea. Instructores certificados, clases 1 a 1 en Roma Sur y a domicilio. Desde $690. Más de 220 reseñas ⭐ 4.8.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/agenda',
  },
  robots: 'index, follow',
};

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
