import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuestros Instructores de Manejo en CDMX | Auto Escuela Americana',
  description: 'Conoce al equipo de instructores certificados de Auto Escuela Americana. Paciencia, experiencia y clases personalizadas en Ciudad de México.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/instructores',
  },
  robots: 'index, follow',
};

export default function InstructoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
