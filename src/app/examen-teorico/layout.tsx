import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Examen Teórico | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function ExamenTeoricoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
