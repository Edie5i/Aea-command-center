import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Programa de Clases de Manejo — Temario | Auto Escuela Americana',
  description: 'Consulta el programa completo de clases de manejo: temario, contenidos teórico-prácticos y plan de estudios. Auto Escuela Americana en CDMX.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/programa',
  },
  robots: 'index, follow',
};

export default function ProgramaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
