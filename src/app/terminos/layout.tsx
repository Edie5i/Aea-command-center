import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Auto Escuela Americana',
  description: 'Términos y condiciones del servicio de clases de manejo de Auto Escuela Americana en CDMX.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/terminos',
  },
  robots: 'index, follow',
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
