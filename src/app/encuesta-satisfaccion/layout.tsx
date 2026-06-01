import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Encuesta de Satisfacción | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function EncuestaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
